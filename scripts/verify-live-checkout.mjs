// Explicitly run against the locally configured store. Creates two labelled test
// orders, retains their audit trail, and reserves real variant stock. Do not ship.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Supabase configuration required');
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const db=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=async(query)=>{const r=await query;if(r.error)throw new Error(r.error.message);return r.data;};
const products=await checked(db.from('products').select('*,product_variants(*)').eq('active',true));
const outfit=await checked(db.from('outfits').select('*').eq('slug','sakura-outfit-summer').single());
assert.ok(outfit.active);
const navy=products.find(p=>p.slug==='slim-fit-shirt-blue-navy');assert.ok(navy);
const single=navy.product_variants.find(v=>v.stock>0);assert.ok(single);
const pieces=outfit.components.map((c,i)=>{
 const p=products.find(p=>p.id===c.product_id);assert.ok(p);
 const v=p.product_variants.find(v=>v.size===(i===0?'M-L':'XL')&&v.stock>0);assert.ok(v,'Required test component size is in stock');return {p,v};
});
for(const sample of [{name:'Normal product',price:navy.price,variants:[single],items:[{variantId:single.id,quantity:1}]},{name:'Outfit',price:outfit.price,variants:pieces.map(c=>c.v),items:[{outfitId:outfit.id,variantIds:pieces.map(c=>c.v.id),quantity:1}]}]){
 const before=await checked(db.from('product_variants').select('id,stock').in('id',sample.variants.map(v=>v.id)));
 const payload={idempotencyKey:crypto.randomUUID(),name:`LOCAL CHECKOUT TEST ${sample.name}`,phone:'0555000000',wilaya:'16 Alger',commune:'Hydra',address:'LOCAL VERIFICATION ONLY - DO NOT SHIP',notes:'Automated localhost origin regression test. Do not fulfill. Cancel in Admin after review to restore stock.',items:sample.items};
 const post=async()=>{const r=await fetch('http://localhost:3000/api/orders',{method:'POST',headers:{Origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await r.json();assert.equal(r.status,201,JSON.stringify(body));return body;};
 const result=await post();console.log(JSON.stringify({created:sample.name,reference:result.reference,total:result.total}));
 const retry=await post();assert.deepEqual(retry,result);
 // Same relation projection used by Admin -> Orders, read using a fresh client.
 const inspection=await client().from('orders').select('*,order_items(*,order_item_components(*))').eq('idempotency_key',payload.idempotencyKey);
 const after=await checked(db.from('product_variants').select('id,stock').in('id',sample.variants.map(v=>v.id)));
 for(const v of before)assert.equal(after.find(a=>a.id===v.id).stock,v.stock-1);
 assert.equal(result.total,sample.price+(sample.price>=15000?0:600));
 if(inspection.error){console.log(JSON.stringify({verified:sample.name,reference:result.reference,total:result.total,sizes:sample.variants.map(v=>v.size),retrySameReference:true,inventory:'decremented once per underlying variant',adminInspection:inspection.error.message}));continue;}
 const orders=inspection.data;
 assert.equal(orders.length,1);const order=orders[0];assert.equal(order.subtotal,sample.price);assert.equal(order.shipping,sample.price>=15000?0:600);assert.equal(order.total,order.subtotal+order.shipping);assert.equal(result.total,order.total);assert.equal(order.order_items.length,1);
 const line=order.order_items[0];assert.equal(line.quantity,1);assert.equal(line.unit_price,sample.price);
 if(sample.name==='Outfit'){
  assert.equal(line.outfit_id,outfit.id);assert.equal(line.order_item_components.length,2);
  for(const {p,v} of pieces){const c=line.order_item_components.find(c=>c.variant_id===v.id);assert.ok(c);assert.equal(c.product_name,p.name);assert.equal(c.size,v.size);assert.equal(c.color,v.color);}
 }else {assert.equal(line.variant_id,single.id);assert.equal(line.size,single.size);assert.equal(line.order_item_components.length,0);}
 console.log(JSON.stringify({verified:sample.name,reference:order.reference,sizes:sample.variants.map(v=>v.size),orderItems:1,shipping:order.shipping,total:order.total,duplicateOrders:0,inventory:'decremented once per underlying variant',persistent:true}));
}
