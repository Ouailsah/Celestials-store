import {test,expect} from '@playwright/test';
test('lost checkout response retains the same attempt after a browser refresh',async({page})=>{
 // Intercept before sending: this test never writes an order to Supabase.
 const attempts:string[]=[];
 await page.route('**/api/orders',async route=>{attempts.push(route.request().postDataJSON().idempotencyKey);await route.abort('failed');});
 await page.goto('/product/slim-fit-shirt-blue-navy');await page.locator('.size-options button:not(:disabled)').first().click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await page.goto('/checkout');
 for(let i=0;i<2;i++){
  if(i)await page.reload();
  await page.locator('[name=name]').fill('QA Retry Test');await page.locator('[name=phone]').fill('0555000000');await page.locator('[name=wilaya]').selectOption('16 Alger');await page.locator('[name=commune]').fill('Hydra');await page.locator('[name=address]').fill('Browser interception only - no order');
  await page.getByRole('button',{name:'PLACE MY ORDER',exact:true}).click();await expect.poll(()=>attempts.length).toBe(i+1);await expect(page.locator('.checkout-layout [role=alert]')).toBeVisible();
 }
 expect(attempts[0]).toBe(attempts[1]);
 const persisted=await page.evaluate(()=>sessionStorage.getItem('celestials-checkout-attempt-v1'));expect(persisted).not.toContain('QA Retry Test');expect(persisted).not.toContain('0555000000');
});
