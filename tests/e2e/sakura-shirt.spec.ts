import { test, expect } from '@playwright/test';
test('Sakura Shirt has four gallery photos and a separate working size guide',async({page},info)=>{
 await page.goto('/shop?category=Outfits');
 await expect(page.locator('.product-info').getByRole('link',{name:'SAKURA SHIRT',exact:true})).toHaveCount(0);
 for(const route of ['/shop','/shop?category=Tops','/shop?edit=new']) {
  await page.goto(route);
  await expect(page.locator('.product-info').getByRole('link',{name:'SAKURA SHIRT',exact:true})).toHaveCount(1);
 }
 await page.locator('.product-info').getByRole('link',{name:'SAKURA SHIRT',exact:true}).click();
 await expect(page.locator('.product-detail-info h1')).toHaveText('Sakura Shirt');
 await expect(page.locator('.detail-price')).toContainText('3,700 DZD');
 await expect(page.locator('.gallery-thumbs button')).toHaveCount(4);
 await expect(page.locator('.gallery img[src*="size-chart"]')).toHaveCount(0);
 const chart=page.locator('details .product-size-chart');
 await expect(chart).toHaveAttribute('src','/products/sakura-long-sleeve/size-chart.jpeg');
 await expect(chart).toHaveCount(1); await expect(chart).not.toBeVisible();
 for(const [i,name] of ['01-cover','02-rear','03-side','04-front'].entries()) {
  await page.getByRole('button',{name:`Show image ${i+1}`,exact:true}).click();
  await expect(page.locator('.gallery-main img')).toHaveAttribute('src',`/products/sakura-shirt/${name}.jpeg`);
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
 await page.locator('.product-detail').screenshot({path:`test-results/sakura-shirt-${info.project.name}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/cart'); await page.reload();
 await expect(page.locator('.cart-item')).toContainText('Sakura Shirt');
 await expect(page.locator('.cart-item')).toContainText('XL');
});
