import { test, expect } from '@playwright/test';
test('Outfits tab works from collection edits, refresh and browser history without reset', async({page})=>{
 for(const edit of ['new','best']) {
  await page.goto(`/shop?edit=${edit}`);
  await page.locator('.shop-tabs').getByRole('button',{name:'Outfits',exact:true}).click();
  await expect(page).toHaveURL(/\/shop\?category=Outfits$/);
  await expect(page.locator('.outfit-card')).toHaveCount(2);await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.getByText('No pieces found.',{exact:true})).toHaveCount(0);
  await page.reload();await expect(page.locator('.outfit-card')).toHaveCount(2);
 }
 await page.locator('.shop-tabs').getByRole('button',{name:'Tops',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(4);await expect(page.locator('.outfit-card')).toHaveCount(0);
 await page.locator('.shop-tabs').getByRole('button',{name:'Bottoms',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(2);
 await page.goBack();await expect(page.locator('.shop-tabs .selected')).toHaveText('Tops');await expect(page.locator('.product-card')).toHaveCount(4);
 await page.goBack();await expect(page.locator('.outfit-card')).toHaveCount(2);
 await page.goForward();await expect(page.locator('.shop-tabs .selected')).toHaveText('Tops');
 await page.locator('.shop-tabs').getByRole('button',{name:'All pieces',exact:true}).click();await expect(page.locator('.outfit-card')).toHaveCount(2);await expect(page.locator('.product-card')).toHaveCount(6);
 for(const width of [375,390,430,1440]) {
  await page.setViewportSize({width,height:850});const grid=await page.locator('.product-grid').boundingBox();
  for(const card of await page.locator('.outfit-card').all())expect(Math.abs((await card.boundingBox())!.width-grid!.width)).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 for(const category of ['outfits','OUTFITS']){await page.goto(`/shop?category=${category}`);await expect(page.locator('.outfit-card')).toHaveCount(2);}
 await page.goto('/shop?category=Outfits&search=missing&size=XL&color=White&stock=1&max=4000&sort=price-desc&edit=new');
 await page.getByRole('button',{name:'RESET FILTERS',exact:true}).click();await expect(page).toHaveURL(/\/shop$/);await expect(page.locator('.outfit-card')).toHaveCount(2);await expect(page.locator('.product-card')).toHaveCount(6);
});
