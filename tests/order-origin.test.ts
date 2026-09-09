import test from 'node:test';
import assert from 'node:assert/strict';
import {validOrderOrigin} from '../src/lib/order-origin';
test('checkout allows configured origins and explicit development localhost without trusting request hosts',()=>{
 const production='https://celestials.example';
 assert.equal(validOrderOrigin('http://localhost:3000',production,'development'),true);
 assert.equal(validOrderOrigin(production,production+'/','production'),true);
 assert.equal(validOrderOrigin('http://localhost:3000','http://localhost:3000','production'),true);
 for(const origin of [null,'null','','https://evil.example','https://celestials.example.evil.example','http://celestials.example','https://celestials.example:444','http://localhost:3000','http://0.0.0.0:3000','https://celestials.example/','https://user@celestials.example'])assert.equal(validOrderOrigin(origin,production,'production'),false,`${origin}`);
 assert.equal(validOrderOrigin(production,undefined,'production'),false);
 assert.equal(validOrderOrigin(production,'invalid','production'),false);
 assert.equal(validOrderOrigin('http://localhost:3001',undefined,'development'),false);
 assert.equal(validOrderOrigin('http://localhost:3000',undefined,'development'),true);
});
