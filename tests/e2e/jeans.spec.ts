import { test, expect } from '@playwright/test';
test('Sakura Jeans replaces old Bottoms with three gallery photos and a separate working size guide',async({page},info)=>{
 await page.goto('/shop?category=Outfits');
 await expect(page.locator('.product-info').getByRole('link',{name:'Sakura Jeans',exact:true})).toHaveCount(0);
 await page.goto('/shop?category=Tops');await expect(page.locator('.product-info').getByRole('link',{name:'Sakura Jeans',exact:true})).toHaveCount(0);
 await page.goto('/shop?category=Bottoms');await expect(page.locator('.product-info h3')).toHaveText(['Sakura Jeans','Serpent Hunter Bootcut']);
 for(const slug of ['everyday-cargo-pant','washed-denim-01']) {await page.goto('/product/'+slug);await expect(page.getByRole('heading',{name:'A different direction.'})).toBeVisible();}
 for(const route of ['/shop','/shop?category=Bottoms','/shop?edit=new']) {
  await page.goto(route);
  await expect(page.locator('.product-info').getByRole('link',{name:'Sakura Jeans',exact:true})).toHaveCount(1);
 }
 await page.locator('.product-info').getByRole('link',{name:'Sakura Jeans',exact:true}).click();
 await expect(page.locator('.product-detail-info h1')).toHaveText('SAKURA JEANS');
 await expect(page.locator('.detail-price')).toContainText('6,000 DZD');
 await expect(page.locator('.gallery-thumbs button')).toHaveCount(3);
 await expect(page.locator('.gallery img[src*="size-chart"]')).toHaveCount(0);
 await expect(page.locator('.size-options button')).toHaveText(['S','M-L','XL']);
 const chart=page.locator('details .product-size-chart');
 await expect(chart).toHaveAttribute('src','/products/sakura-jeans/size-chart.jpeg');
 await expect(chart).toHaveCount(1); await expect(chart).not.toBeVisible();
 for(const [i,name] of ['01-cover','02-detail','03-outdoor'].entries()) {
  await page.getByRole('button',{name:`Show image ${i+1}`,exact:true}).click();
  await expect(page.locator('.gallery-main img')).toHaveAttribute('src',`/products/sakura-jeans/${name}.jpeg`);
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
  await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 }
 await page.locator('.product-detail').screenshot({path:`test-results/jeans-${info.project.name}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/cart'); await page.reload();
 await expect(page.locator('.cart-item')).toHaveCount(3);
 await expect(page.locator('.cart-item')).toContainText(['Sakura Jeans','Sakura Jeans','Sakura Jeans']);
 await expect(page.locator('.cart-item').last()).toContainText('XL');
});
