import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSchema } from '../src/lib/validation';
import { shippingFor } from '../src/lib/types';
const order={idempotencyKey:crypto.randomUUID(),name:'Test Customer',phone:'+213 555 123 456',wilaya:'16 Alger',commune:'Hydra',address:'12 Example Street',items:[{variantId:'20000000-0000-4000-8000-000000000101',quantity:1}]};
test('checkout validates delivery details and normalizes Algerian mobile numbers',()=>{const parsed=orderSchema.parse(order);assert.equal(parsed.phone,'+213555123456');for(const field of [{phone:'123'},{wilaya:'Unknown'},{name:'A'},{address:'x'},{items:[]},{items:[{...order.items[0],quantity:-1}]},{items:[order.items[0],order.items[0]]},{website:'spam'}])assert.equal(orderSchema.safeParse({...order,...field}).success,false);});
test('client-supplied prices are excluded and delivery threshold is deterministic',()=>{const parsed=orderSchema.parse({...order,total:1,items:[{...order.items[0],price:1}]});assert.equal('total' in parsed,false);assert.equal('price' in parsed.items[0],false);assert.equal(shippingFor(14999),600);assert.equal(shippingFor(15000),0);});
