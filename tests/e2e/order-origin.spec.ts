import {test,expect} from '@playwright/test';
test('order API validates the configured origin instead of the bind or forwarded host',async({request})=>{
 const allowed=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
 const valid=await request.post('/api/orders',{headers:{Origin:allowed},data:{}});
 expect(valid.status()).toBe(400); // Origin accepted; invalid payload never creates an order.
 for(const origin of [undefined,'null','https://invalid.example','http://0.0.0.0:3000']){
  const rejected=await request.post('/api/orders',{headers:{...(origin?{Origin:origin}:{}),'X-Forwarded-Host':new URL(allowed).host},data:{}});
  expect(rejected.status()).toBe(403);
  expect(await rejected.json()).toEqual({error:'Invalid request origin.'});
 }
});
