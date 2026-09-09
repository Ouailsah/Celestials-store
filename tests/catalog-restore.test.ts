import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { seedProducts } from '../src/lib/catalog';
import { seedOutfits, resolveOutfits, type OutfitDefinition } from '../src/lib/outfits';
import { filterShopProducts, categoryQuery } from '../src/lib/shop-filters';
import type { Product } from '../src/lib/types';
const restore=readFileSync('supabase/restore-original-catalog.sql','utf8');
async function createDb(){const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth to anon,authenticated,service_role;create function public.gen_random_bytes(n integer) returns bytea language sql as $$ select decode(replace(gen_random_uuid()::text,'-',''),'hex') $$;`);
  for(const migration of ['001_store','002_outfits','003_admin_management'])await db.exec(readFileSync(`supabase/migrations/${migration}.sql`,'utf8').replace('create extension if not exists pgcrypto;',''));

return db;}
const catalog=async(db:PGlite)=>{
 const products=(await db.query<Product>(`select p.*, (select jsonb_agg(v order by v.id) from product_variants v where v.product_id=p.id) as product_variants from products p where active order by p.id`)).rows;
 const outfits=(await db.query<OutfitDefinition>('select * from outfits where active order by id')).rows;
 return [...products,...resolveOutfits(products,outfits)];
};
test('original database catalog is restored additively, with guides, demo stock and admin products intact',async()=>{
 const db=await createDb();try{
 const id=crypto.randomUUID(),variant=crypto.randomUUID();
 await db.query("insert into products(id,slug,name,category,price,description,images,active) values($1,'test-celestial-tee','TEST CELESTIAL TEE','T-Shirts',25000,'Existing owner product',array['/products/sakura-shirt/01-cover.jpeg'],true)",[id]);
 await db.query("insert into product_variants(id,product_id,size,color,color_hex,stock) values($1,$2,'L','Black','#222222',7)",[variant,id]);
 const existing=(await db.query('select * from products where id=$1',[id])).rows;
 await db.exec(restore);
 const all=await catalog(db);assert.equal(all.length,9);
 assert.deepEqual((await db.query('select * from products where id=$1',[id])).rows,existing);
 for(const p of seedProducts){const restored=all.find(r=>r.id===p.id)!;for(const key of ['slug','name','category','price','description','images','badge','active','product_variants'] as const)assert.deepEqual(restored[key],p[key],`${p.slug}: ${key}`);}
 for(const o of seedOutfits){const restored=all.find(r=>r.id===o.id)!;assert.equal(restored.price,o.price);assert.equal(restored.outfit!.original_price,o.original_price);assert.deepEqual(restored.images,[o.image]);assert.deepEqual(restored.outfit!.components.map(({product,...c})=>c),o.components);}
 assert.equal(all.find(p=>p.slug==='sakura-shirt')!.size_guide!.image,all.find(p=>p.slug==='sakura-long-sleeve')!.size_guide!.image);
 assert.equal(all.find(p=>p.slug==='sakura-jeans')!.size_guide!.image,'/products/sakura-jeans/size-chart.jpeg');
 for(const [category,count] of [['All pieces',9],['Tops',5],['Bottoms',2],['Outfits',2]] as const)assert.equal(filterShopProducts(all,new URLSearchParams({category})).length,count);
 assert.equal(filterShopProducts(all,new URLSearchParams({stock:'1'})).length,9);
 assert.equal(filterShopProducts(all,new URLSearchParams({max:'20000'})).length,8);
 assert.equal(filterShopProducts(all,categoryQuery(new URLSearchParams('edit=new'),'Outfits')).length,2);
 assert.equal(filterShopProducts(all,new URLSearchParams('edit=new')).length,5);
 await db.query('update product_variants set stock=3 where id=$1',[seedProducts[0].product_variants[0].id]);
 await db.query("update products set description='Preserved owner edit' where id=$1",[seedProducts[0].id]);
 const before=await catalog(db);await db.exec(restore);assert.deepEqual(await catalog(db),before);
 await db.exec('set role anon');assert.equal((await db.query('select * from products')).rows.length,7);assert.equal((await db.query('select * from outfits')).rows.length,2);
 }finally{await db.close();}
});
test('restore reuses matching slugs with different IDs and never resets existing variants',async()=>{
 const db=await createDb();try{
 const id=crypto.randomUUID(),variant=crypto.randomUUID();
 await db.query("insert into products(id,slug,name,category,price,description,images,active) values($1,'sakura-shirt','Owner Sakura','Tops',3900,'Preserve this owner version',array['/products/sakura-shirt/01-cover.jpeg'],true)",[id]);
 await db.query("insert into product_variants(id,product_id,size,color,color_hex,stock) values($1,$2,'S','White','#eeeeee',0)",[variant,id]);
 await db.exec(restore);const all=await catalog(db);const shirt=all.find(p=>p.slug==='sakura-shirt')!;
 assert.equal(shirt.id,id);assert.equal(shirt.name,'Owner Sakura');assert.equal(shirt.price,3900);assert.equal(shirt.product_variants.length,3);assert.equal(shirt.product_variants.find(v=>v.size==='S')!.stock,0);
 assert.equal(all.find(p=>p.slug==='sakura-outfit-summer')!.outfit!.components[0].product_id,id);
 const before=await catalog(db);await db.exec(restore);assert.deepEqual(await catalog(db),before);
 }finally{await db.close();}
});

test('restore uses a block-local map and leaves real table RLS and policies unchanged',async()=>{
 assert.doesNotMatch(restore,/create\s+(?:temporary\s+|temp\s+)?table/i);
 assert.doesNotMatch(restore,/restored_product_ids/);
 const db=await createDb();try{
 const security=async()=>({tables:(await db.query("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','storage') and c.relkind='r' order by 1,2")).rows,policies:(await db.query("select * from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname")).rows});
 const before=await security();await db.exec(restore);await db.exec(restore);assert.deepEqual(await security(),before);
 await db.exec('set role anon');
 await assert.rejects(db.query('select * from public.orders'),/permission denied/);
 await assert.rejects(db.query('update public.products set price=1'),/permission denied/);
 await assert.rejects(db.query('update public.product_variants set stock=999'),/permission denied/);
 await assert.rejects(db.query('delete from public.outfits'),/permission denied/);
 }finally{await db.close();}
});
