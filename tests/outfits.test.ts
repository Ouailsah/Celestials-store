import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { seedProducts } from '../src/lib/catalog';
import { seedOutfits, resolveOutfits } from '../src/lib/outfits';
import { bundleKey, capacityFor, orderLine, reservedQuantity, validBundle } from '../src/lib/cart';
import { orderSchema } from '../src/lib/validation';
import type { CartItem } from '../src/lib/types';

test('outfit references, basket identity, shared inventory and payload validation', () => {
 const outfits = resolveOutfits(seedProducts, seedOutfits);
 assert.equal(outfits.length, 2);
 assert.deepEqual(outfits.map(p => [p.category,p.price,p.outfit!.original_price]), [['Outfits',6900,7900],['Outfits',8700,9700]]);
 assert.equal(outfits[1].outfit!.components[0].product, seedProducts.find(p => p.slug==='sakura-shirt'));
 assert.deepEqual(outfits[1].outfit!.components.map(c => c.product.product_variants.map(v=>v.size)), [['S','M-L','XL'],['S','M-L','XL']]);
 assert.equal(resolveOutfits(seedProducts.filter(p=>p.slug!=='sakura-jeans'), seedOutfits).length, 1);
 const components=outfits[1].outfit!.components.map(c=>({productId:c.product_id,variantId:c.product.product_variants[0].id,name:c.product.name,size:'S',color:c.product.product_variants[0].color,stock:12}));
 const item:CartItem={variantId:bundleKey(outfits[1].id,components.map(c=>c.variantId)),productId:outfits[1].id,slug:outfits[1].slug,name:outfits[1].name,image:outfits[1].images[0],size:'',color:'',price:8700,stock:12,quantity:2,components};
 assert.equal(validBundle(item),true);
 assert.equal(bundleKey(item.productId,components.map(c=>c.variantId).reverse()),item.variantId);
 assert.equal(reservedQuantity([item],components[0].variantId),2);
 const single={...item,variantId:components[0].variantId,components:undefined,quantity:10};
 assert.equal(capacityFor([single],item),2);
 assert.equal(capacityFor([item],single),10);
 assert.deepEqual(orderLine(item),{outfitId:item.productId,variantIds:components.map(c=>c.variantId),quantity:2});
 const customer={idempotencyKey:crypto.randomUUID(),name:'Test Customer',phone:'0555123456',wilaya:'16 Alger',commune:'Hydra',address:'12 Example Street'};
 assert.equal(orderSchema.safeParse({...customer,items:[orderLine(item)]}).success,true);
 assert.equal(orderSchema.safeParse({...customer,items:[{...orderLine(item),price:1}]}).success,false);
 assert.equal(orderSchema.safeParse({...customer,items:[orderLine(item),orderLine(item)]}).success,false);
 assert.equal(orderSchema.safeParse({...customer,items:[{outfitId:item.productId,variantIds:[components[0].variantId],quantity:1}]}).success,false);
});

test('outfit SQL checkout reserves real variants, snapshots sizes and restores stock once', async t => {
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth to anon,authenticated,service_role;create function public.gen_random_bytes(n integer) returns bytea language sql as $$ select decode(replace(gen_random_uuid()::text,'-',''),'hex') $$;`);
 await db.exec(readFileSync('supabase/migrations/001_store.sql','utf8').replace('create extension if not exists pgcrypto;',''));
 await db.exec(readFileSync('supabase/migrations/002_outfits.sql','utf8'));
 await db.exec(readFileSync('supabase/seed.sql','utf8'));
 await db.exec(readFileSync('supabase/outfits-seed.sql','utf8'));
 await db.exec('update public.product_variants set stock=12');
 const shirt='20000000-0000-4000-8000-000000000901', jeans='20000000-0000-4000-8000-000000001102';
 const outfitId=seedOutfits[1].id;
 const customer={name:'Bundle Customer',phone:'0555111222',wilaya:'16 Alger',commune:'Hydra',address:'12 Example Street'};
 const place=(items:unknown[],key=crypto.randomUUID())=>db.query<{result:{reference:string,total:number}}>('select public.place_order($1,$2::jsonb,$3::jsonb) as result',[key,JSON.stringify(customer),JSON.stringify(items)]);
 const stock=async(id:string)=>(await db.query<{stock:number}>('select stock from public.product_variants where id=$1',[id])).rows[0].stock;
 const selection={outfitId,variantIds:[shirt,jeans],quantity:1};
 await t.test('RLS exposes outfits but protects component order data and writes',async()=>{
  await db.exec('set role anon');assert.equal((await db.query('select * from public.outfits')).rows.length,2);
  await assert.rejects(db.query('select * from public.order_item_components'),/permission denied/);
  await assert.rejects(place([selection]),/permission denied/);
  await assert.rejects(db.query('update public.outfits set price=1'),/permission denied/);
  await db.exec('reset role');
 });
 let orderId='';
 await t.test('discount is authoritative, one line has two real size snapshots, retries are idempotent',async()=>{
  const key=crypto.randomUUID();await db.exec('set role service_role');
  const result=(await place([{...selection,price:1}],key)).rows[0].result;
  assert.equal(result.total,9300);assert.deepEqual((await place([selection],key)).rows[0].result,result);
  await db.exec('reset role');
  assert.equal(await stock(shirt),11);assert.equal(await stock(jeans),11);
  const rows=(await db.query<{order_id:string;unit_price:number;size:string}>('select * from public.order_items')).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].unit_price,8700);orderId=rows[0].order_id;
  assert.match(rows[0].size,/Sakura Shirt: M-L/);assert.match(rows[0].size,/Sakura Jeans: XL/);
  assert.deepEqual((await db.query<{product_name:string;size:string}>('select product_name,size from public.order_item_components order by product_name')).rows,[{product_name:'Sakura Jeans',size:'XL'},{product_name:'Sakura Shirt',size:'M-L'}]);
  await assert.rejects(db.query('delete from public.product_variants where id=$1',[shirt]),/open outfit orders/);
 });
 await t.test('forged combinations, missing sizes, duplicates and unpublished components fail atomically',async()=>{
  await assert.rejects(place([{...selection,variantIds:[shirt,'20000000-0000-4000-8000-000000001001']}]),/Invalid order/);
  await assert.rejects(place([{...selection,variantIds:[shirt,shirt]}]),/Invalid order/);
  await assert.rejects(place([{...selection,variantIds:[shirt]}]),/Invalid order/);
  await assert.rejects(place([selection,{...selection,variantIds:[jeans,shirt]}]),/Invalid order/);
  await db.query('update public.products set active=false where id=$1',['10000000-0000-4000-8000-000000000011']);
  await assert.rejects(place([selection]),/Product unavailable/);
  await db.query('update public.products set active=true where id=$1',['10000000-0000-4000-8000-000000000011']);
  assert.equal(await stock(shirt),11);
 });
 await t.test('aggregate stock includes individual products and all outfit selections',async()=>{
  await db.query('update public.product_variants set stock=1 where id=$1',[shirt]);
  await assert.rejects(place([selection,{variantId:shirt,quantity:1}]),/Insufficient stock/);
  assert.equal(await stock(shirt),1);assert.equal(await stock(jeans),11);
  await db.query('update public.product_variants set stock=11 where id=$1',[shirt]);
 });
 await t.test('admin cancellation restores both components exactly once',async()=>{
  const admin=crypto.randomUUID();await db.query('insert into auth.users values($1)',[admin]);await db.query('insert into public.admin_users values($1)',[admin]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
  await db.exec('set role authenticated');await db.query("select public.set_order_status($1,'cancelled')",[orderId]);await db.query("select public.set_order_status($1,'cancelled')",[orderId]);await db.exec('reset role');
  assert.equal(await stock(shirt),12);assert.equal(await stock(jeans),12);
 });
 await t.test('Bootcut outfit supports distinct S and XL sizes at 6900',async()=>{
  const result=(await place([{outfitId:seedOutfits[0].id,variantIds:['20000000-0000-4000-8000-000000001200','20000000-0000-4000-8000-000000001003'],quantity:1}])).rows[0].result;
  assert.equal(result.total,7500);
 });
 } finally {await db.close();}
});
