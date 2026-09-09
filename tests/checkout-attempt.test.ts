import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutAttempt,clearCheckoutAttempt} from '../src/lib/checkout-attempt';
test('lost checkout responses can be retried after refresh without changing the order key',()=>{
 const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};
 const items=[{variantId:crypto.randomUUID(),quantity:1}];
 const first=checkoutAttempt(storage,items);assert.equal(checkoutAttempt(storage,items),first);
 assert.notEqual(checkoutAttempt(storage,[{...items[0],quantity:2}]),first);
 clearCheckoutAttempt(storage);assert.equal(values.size,0);assert.notEqual(checkoutAttempt(storage,items),first);
 assert.ok(checkoutAttempt(null,items));
});
