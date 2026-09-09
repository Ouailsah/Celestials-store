import { test, expect } from '@playwright/test';
test('Sakura has five gallery photos and a separate working size guide',async({page},info)=>{
 await page.goto('/shop?category=Outfits');
 await expect(page.locator('.product-info').getByRole('link',{name:'Sakura Long Sleeve',exact:true})).toHaveCount(0);
 for(const route of ['/shop','/shop?category=Tops','/shop?edit=new']) {
  await page.goto(route);
  await expect(page.locator('.product-info').getByRole('link',{name:'Sakura Long Sleeve',exact:true})).toHaveCount(1);
 }
 await page.locator('.product-info').getByRole('link',{name:'Sakura Long Sleeve',exact:true}).click();
 await expect(page.locator('.product-detail-info h1')).toHaveText('Sakura Long Sleeve');
 await expect(page.locator('.detail-price')).toContainText('3,800 DZD');
 await expect(page.locator('.gallery-thumbs button')).toHaveCount(5);
 await expect(page.locator('.gallery img[src*="size-chart"]')).toHaveCount(0);
 const chart=page.locator('details .product-size-chart');
 await expect(chart).toHaveCount(1); await expect(chart).not.toBeVisible();
 for(const [i,name] of ['01-cover','02-rear','03-detail','04-models','05-angled'].entries()) {
  await page.getByRole('button',{name:`Show image ${i+1}`,exact:true}).click();
  await expect(page.locator('.gallery-main img')).toHaveAttribute('src',`/products/sakura-long-sleeve/${name}.jpeg`);
  await expect(page.locator('.gallery-thumbs .selected')).toHaveAttribute('aria-pressed','true');
 }
 await page.getByText('SIZE GUIDE',{exact:true}).click();
 await expect(chart).toBeVisible();
 await chart.evaluate((img:HTMLImageElement)=>img.decode());
 expect(await chart.evaluate((img:HTMLImageElement)=>Math.abs(img.width/img.height-img.naturalWidth/img.naturalHeight)<.01)).toBeTruthy();
 await page.getByRole('button',{name:'Show image 1',exact:true}).click();
 for(const size of ['S','M-L','XL']) {
  await page.locator('.size-options').getByRole('button',{name:size,exact:true}).click();
  await expect(page.locator('.size-options .selected')).toHaveText(size);
 }
 await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await page.locator('.product-detail').screenshot({path:`test-results/sakura-${info.project.name}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/cart'); await page.reload();
 await expect(page.locator('.cart-item')).toContainText('Sakura Long Sleeve');
 await expect(page.locator('.cart-item')).toContainText('XL');
});
