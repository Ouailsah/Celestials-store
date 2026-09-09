import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
test('PostgreSQL checkout transactions, RLS, admin permissions and order management',async(t)=>{
 const db=new PGlite();
 // Local stand-ins for Supabase-owned auth/storage schemas. The application migration is unchanged except pgcrypto setup.
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth to anon,authenticated,service_role;create function public.gen_random_bytes(n integer) returns bytea language sql as $$ select decode(replace(gen_random_uuid()::text,'-',''),'hex') $$;`);
 await db.exec(readFileSync('supabase/migrations/001_store.sql','utf8').replace('create extension if not exists pgcrypto;',''));
 await db.exec(readFileSync('supabase/seed.sql','utf8'));
 await db.exec("update public.product_variants set stock=12 where id='20000000-0000-4000-8000-000000001001'");
 const variant='20000000-0000-4000-8000-000000001001';
 const customer={name:'Test Customer',phone:'0555123456',wilaya:'16 Alger',commune:'Hydra',address:'12 Example Street'};
 const place=async(key=crypto.randomUUID(),quantity=1,phone=customer.phone,items?:unknown[])=>db.query<{result:{reference:string,total:number}}>('select public.place_order($1,$2::jsonb,$3::jsonb) as result',[key,JSON.stringify({...customer,phone}),JSON.stringify(items||[{variantId:variant,quantity}])]);
 let reference='';
 await t.test('anonymous users see only published catalog and cannot access orders or submit RPC',async()=>{
  await db.exec('set role anon');assert.equal((await db.query('select * from public.products')).rows.length,6);
  await assert.rejects(db.query('select * from public.orders'),/permission denied/);
  await assert.rejects(place(),/permission denied/);
  await assert.rejects(db.query("insert into public.admin_users(user_id) values(gen_random_uuid())"),/permission denied/);
  await db.exec('reset role');
 });
 await t.test('server-authoritative totals, stock reservation and idempotent retries',async()=>{
  const key=crypto.randomUUID();await db.exec('set role service_role');const first=(await place(key,2)).rows[0].result;reference=first.reference;assert.equal(first.total,4600);assert.equal((await place(key,2)).rows[0].result.reference,reference);await db.exec('reset role');
  assert.equal((await db.query<{stock:number}>('select stock from public.product_variants where id=$1',[variant])).rows[0].stock,10);assert.equal((await db.query('select * from public.orders')).rows.length,1);assert.equal((await db.query<{quantity:number}>('select quantity from public.order_items')).rows[0].quantity,2);
 });
 await t.test('insufficient stock rolls back every line in an order',async()=>{
  await db.exec('set role service_role');await assert.rejects(place(crypto.randomUUID(),1,customer.phone,[{variantId:variant,quantity:1},{variantId:'20000000-0000-4000-8000-000000001100',quantity:1}]),/Insufficient stock/);await db.exec('reset role');assert.equal((await db.query<{stock:number}>('select stock from public.product_variants where id=$1',[variant])).rows[0].stock,10);assert.equal((await db.query('select * from public.orders')).rows.length,1);
 });
 await t.test('non-admin authenticated users cannot read orders or mutate products',async()=>{
  await db.exec('set role authenticated');assert.equal((await db.query('select * from public.orders')).rows.length,0);await assert.rejects(db.query("select public.set_order_status(gen_random_uuid(),'confirmed')"),/Unauthorized/);await assert.rejects(db.query("select public.delete_product(gen_random_uuid())"),/Unauthorized/);await db.exec('reset role');
 });
 const admin='30000000-0000-4000-8000-000000000001';await db.query('insert into auth.users(id) values($1)',[admin]);await db.query('insert into public.admin_users(user_id) values($1)',[admin]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
 await t.test('admin can view delivery details, change status and restore stock exactly once',async()=>{
  await db.exec('set role authenticated');const order=(await db.query<{id:string;phone:string}>('select * from public.orders where reference=$1',[reference])).rows[0];assert.equal(order.phone,customer.phone);await db.query("select public.set_order_status($1,'confirmed')",[order.id]);await db.query("select public.set_order_status($1,'cancelled')",[order.id]);await db.query("select public.set_order_status($1,'cancelled')",[order.id]);await assert.rejects(db.query("select public.set_order_status($1,'confirmed')",[order.id]),/Invalid status transition/);await db.exec('reset role');assert.equal((await db.query<{stock:number}>('select stock from public.product_variants where id=$1',[variant])).rows[0].stock,12);
 });
 await t.test('admin can create, edit, unpublish and delete products atomically',async()=>{
  const id=crypto.randomUUID();const product={id,name:'Test Tee',slug:'test-tee',category:'T-Shirts',price:4500,description:'A test garment.',images:['https://example.com/test.jpg'],badge:null,active:true,product_variants:[{id:crypto.randomUUID(),size:'M',color:'Black',color_hex:'#222222',stock:4}]};
  await db.exec('set role authenticated');await db.query('select public.save_product($1::jsonb)',[JSON.stringify(product)]);await db.query('select public.save_product($1::jsonb)',[JSON.stringify({...product,price:5000,active:false})]);assert.equal((await db.query<{price:number}>('select price from public.products where id=$1',[id])).rows[0].price,5000);await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role anon');assert.equal((await db.query('select * from public.products where id=$1',[id])).rows.length,0);await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);await db.exec('set role authenticated');await db.query('select public.delete_product($1)',[id]);await db.exec('reset role');assert.equal((await db.query('select * from public.products where id=$1',[id])).rows.length,0);
 });
 await t.test('phone-based order limit is enforced by the database',async()=>{
  await db.exec('set role service_role');for(let i=0;i<4;i++)await place();await assert.rejects(place(crypto.randomUUID(),1,'+213555123456'),/Too many orders/);await db.exec('reset role');
 });
 await db.close();
});
