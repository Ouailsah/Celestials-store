import { test,expect, type Page } from '@playwright/test';
async function expectBagCount(page: Page, count: number) {
 if (await page.locator('.mobile-menu').isVisible()) {
  await page.getByRole('button',{name:'Open menu'}).click();
  await expect(page.locator('.mobile-nav a[href="/cart"]')).toHaveText(`Bag (${count})`);
  await page.getByRole('button',{name:'Close menu'}).click();
 } else await expect(page.getByRole('link',{name:`Shopping bag, ${count} items`})).toBeVisible();
}
test('browse, search, choose variants, persist cart, and reach checkout',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'ABOVE THE ORDINARY.'})).toBeVisible();
 await page.getByRole('link',{name:'EXPLORE THE COLLECTION',exact:true}).click();await expect(page.getByRole('heading',{name:'The collection.'})).toBeVisible();
 await page.getByRole('textbox',{name:'Search products'}).fill('Blue Navy');await expect(page.locator('.product-card')).toHaveCount(1);
 await page.locator('.product-info').getByRole('link',{name:'Slim Fit Shirt Blue Navy',exact:true}).click();
 await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await expect(page.getByRole('status')).toContainText('Select a size');
 await page.getByRole('button',{name:'M',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await expect(page.getByRole('status')).toContainText('Added to your bag.');
 await page.getByRole('button',{name:'L',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await page.getByRole('link',{name:'VIEW BAG',exact:true}).click();await expect(page.locator('.cart-item')).toHaveCount(2);await page.reload();await expect(page.locator('.cart-item')).toHaveCount(2);await expectBagCount(page,2);
 await page.getByRole('button',{name:'Increase Slim Fit Shirt Blue Navy quantity'}).first().click();await expectBagCount(page,3);
 await page.getByRole('button',{name:'Remove Slim Fit Shirt Blue Navy, Navy, L',exact:true}).click();await expect(page.locator('.cart-item')).toHaveCount(1);
 await page.getByRole('link',{name:'CONTINUE TO CHECKOUT'}).click();await page.getByLabel('FULL NAME').fill('Amine Test');await page.getByLabel('PHONE NUMBER').fill('0555123456');await page.getByLabel('WILAYA',{exact:true}).selectOption('16 Alger');await page.getByLabel('COMMUNE',{exact:true}).fill('Hydra');await page.getByLabel('DELIVERY ADDRESS').fill('12 Rue des Oliviers, floor 2');
 await expect(page.getByRole('button',{name:'PLACE MY ORDER'})).toBeDisabled();await expect(page.getByText('Orders will open once our Supabase connection',{exact:false})).toBeVisible();expect(errors).toEqual([]);
});
test('filters, image gallery, empty results and mobile layout',async({page},testInfo)=>{
 await page.goto('/shop?search=Blue%20Navy');await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Size',{exact:true}).selectOption('XL');await page.getByLabel('Color',{exact:true}).selectOption('White');await page.getByLabel('In stock only').check();await expect(page.locator('.product-card')).toHaveCount(0);await page.getByRole('button',{name:'RESET FILTERS'}).last().click();await expect(page.locator('.product-card')).toHaveCount(6);
 await page.goto('/product/slim-fit-shirt-blue-navy');const initial=await page.locator('.gallery-main img:visible').getAttribute('src');await page.getByRole('button',{name:'Show image 2'}).click();expect(await page.locator('.gallery-main img:visible').getAttribute('src')).not.toEqual(initial);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.goto('/');await page.screenshot({path:`test-results/home-${testInfo.project.name}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 if(testInfo.project.name==='mobile'){await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'The brand'}).click();await expect(page).toHaveURL(/about/);}
});
test('admin is protected, APIs reject bad orders, and confirmation cannot be forged',async({page,request})=>{
 await page.goto('/admin');await expect(page).toHaveURL(/admin\/login/);await expect(page.getByRole('button',{name:'SECURE SIGN IN'})).toBeDisabled();
 const invalid=await request.post('/api/orders',{headers:{Origin:process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'},data:{items:[]}});expect(invalid.status()).toBe(400);
 const crossOrigin=await request.post('/api/orders',{headers:{Origin:'https://invalid.example'},data:{}});expect(crossOrigin.status()).toBe(403);
 const unavailable=await request.post('/api/orders',{headers:{Origin:process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'},data:{idempotencyKey:crypto.randomUUID(),name:'Test User',phone:'0555123456',wilaya:'16 Alger',commune:'Hydra',address:'12 Example Street',items:[{variantId:'20000000-0000-4000-8000-000000000101',quantity:1}]}});expect(unavailable.status()).toBe(503);
 await page.goto('/order-confirmation?ref=FAKE&total=1');await expect(page.getByText('No recent order confirmation',{exact:false})).toBeVisible();await expect(page.getByText('FAKE',{exact:true})).toHaveCount(0);
});
