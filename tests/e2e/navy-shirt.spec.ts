import { test, expect } from '@playwright/test';
test('navy shirt is a separate product with exactly three working photos',async({page},info)=>{
 for(const route of ['/shop','/shop?category=Tops','/shop?edit=new']) {
  await page.goto(route);
  await expect(page.locator('.product-info').getByRole('link',{name:'Slim Fit Shirt Blue Navy',exact:true})).toHaveCount(1);
  await expect(page.locator('.product-info').getByRole('link',{name:'Cursed Blood Manipulation Shirt',exact:true})).toHaveCount(1);
 }
 await page.locator('.product-info').getByRole('link',{name:'Slim Fit Shirt Blue Navy',exact:true}).click();
 await expect(page.locator('.product-detail-info h1')).toHaveText('SLIM FIT SHIRT BLUE NAVY');
 await expect(page.locator('.detail-price')).toContainText('2,000 DA');
 await expect(page.locator('.gallery-thumbs button')).toHaveCount(3);
 await expect(page.locator('.gallery-main img')).toHaveAttribute('src','/products/slim-fit-shirt-blue-navy/01-cover.jpeg');
 for(const [i,name] of ['01-cover','02-front','03-back'].entries()) {
  await page.getByRole('button',{name:`Show image ${i+1}`,exact:true}).click();
  await expect(page.locator('.gallery-main img')).toHaveAttribute('src',`/products/slim-fit-shirt-blue-navy/${name}.jpeg`);
  await expect(page.locator('.gallery-thumbs .selected')).toHaveAttribute('aria-pressed','true');
 }
 await expect(page.locator('details summary')).toHaveText(['SIZE GUIDE','DESCRIPTION','DELIVERY','SECURE PAYMENT']);
 await page.getByText('SIZE GUIDE',{exact:true}).click();
 await page.getByRole('button',{name:'M',exact:true}).click();
 await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await page.getByRole('button',{name:'Show image 1',exact:true}).click();
 await page.locator('.gallery-main img').evaluate((img:HTMLImageElement)=>img.decode());
 await page.locator('.product-detail').screenshot({path:`test-results/navy-${info.project.name}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/cart');await page.reload();
 await expect(page.locator('.cart-item')).toContainText('Slim Fit Shirt Blue Navy');
 await expect(page.locator('.cart-item')).toContainText('Navy / M');
});
