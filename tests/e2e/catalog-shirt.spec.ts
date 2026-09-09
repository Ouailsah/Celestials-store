import { test, expect } from '@playwright/test';
test('replacement shirt catalog, variants and all five supplied images', async ({page},info) => {
  for (const query of ['', '?category=Tops', '?edit=new', '?search=Cursed']) {
    await page.goto('/shop'+query);
    await expect(page.locator('.product-info').getByRole('link',{name:'Cursed Blood Manipulation Shirt',exact:true})).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(query === '?edit=new' ? 5 : query === '?category=Tops' ? 4 : query ? 1 : 6);
    await expect(page.locator('.product-card')).not.toContainText(['The Heavyweight Hoodie']);
  }
  for (const slug of ['heavyweight-hoodie','studio-oversized-tee','essential-zip-jacket','off-duty-crewneck']) {
    const response = await page.goto('/product/'+slug);
    await expect(page.getByRole('heading',{name:'A different direction.'})).toBeVisible();
    await expect(page.locator('.product-detail')).toHaveCount(0);
  }
  await page.goto('/product/cursed-blood-manipulation-shirt', {waitUntil:'networkidle'});
  await expect(page.locator('.product-detail-info h1')).toHaveText('CURSED BLOOD MANIPULATION SHIRT');
  await expect(page.locator('.detail-price')).toContainText('3,500 DA');
  await expect(page.locator('.size-options button')).toHaveText(['S','M-L','XL']);
  await expect(page.locator('details summary')).toHaveText(['SIZE GUIDE','DESCRIPTION','DELIVERY','SECURE PAYMENT']);
  for (const [index,name] of ['01-cover','02-back','03-side','04-detail','05-outfit'].entries()) {
    await page.getByRole('button',{name:`Show image ${index+1}`,exact:true}).click();
    await expect(page.locator('.gallery-main img')).toHaveAttribute('src',`/products/cursed-blood-manipulation/${name}.jpeg`);
    await expect(page.locator('.gallery-thumbs .selected')).toHaveAttribute('aria-pressed','true');
  }
  await page.getByRole('button',{name:'Show image 1',exact:true}).click();
  await page.getByRole('button',{name:'M-L',exact:true}).click();
  await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
  await page.screenshot({path:`test-results/shirt-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.goto('/cart'); await page.reload();
  await expect(page.locator('.cart-item')).toContainText('M-L');
});
