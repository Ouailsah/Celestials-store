import { test, expect } from '@playwright/test';
test('public dark surfaces and simplified categories remain usable', async ({page}, info) => {
  for (const route of ['/', '/shop', '/product/cursed-blood-manipulation-shirt', '/about', '/cart', '/contact', '/order-confirmation']) {
    await page.goto(route, {waitUntil:'networkidle'});
    await page.evaluate(() => document.querySelectorAll('img').forEach(img => img.loading = 'eager'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.storefront')).toHaveCSS('background-color', 'rgb(8, 11, 16)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (route === '/shop') await page.getByRole('button', {name:'Filters', exact:true}).click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({path:`test-results/theme-${info.project.name}-${route.replaceAll('/', '-') || 'home'}.png`, fullPage:true});
  }
  await page.goto('/shop');
  await expect(page.locator('.shop-tabs button')).toHaveText(['All pieces','Tops','Bottoms','Outfits']);
  for (const [category, count] of [['Tops',4],['Bottoms',2],['Outfits',2],['All pieces',8]] as const) {
    await page.locator('.shop-tabs').getByRole('button',{name:category,exact:true}).click();
    await expect(page.locator('.product-card, .outfit-card')).toHaveCount(count);
  }
  for (const legacy of ['Hoodies','T-Shirts','Outerwear']) {
    await page.goto(`/shop?category=${legacy}`);
    await expect(page.locator('.shop-tabs .selected')).toHaveText('Tops');
    await expect(page.locator('.product-card')).toHaveCount(4);
  }
  await page.goto('/');
  await page.getByRole('link',{name:'Shop outfits',exact:true}).click();
  await expect(page).toHaveURL(/category=Outfits/);
  await expect(page.locator('.outfit-card')).toHaveCount(2);
  await page.goto('/product/cursed-blood-manipulation-shirt');
  await page.getByRole('button',{name:'M-L',exact:true}).click();
  await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
  await page.getByRole('link',{name:'VIEW BAG',exact:true}).click();
  await page.waitForLoadState('networkidle');
    await page.screenshot({path:`test-results/theme-${info.project.name}-cart-filled.png`,fullPage:true});
  await page.getByRole('link',{name:'CONTINUE TO CHECKOUT'}).click();
  await expect(page.getByLabel('FULL NAME')).toBeVisible();
  await expect(page.locator('.order-summary')).toHaveCSS('background-color','rgb(17, 22, 27)');
  await page.waitForLoadState('networkidle');
    await page.screenshot({path:`test-results/theme-${info.project.name}-checkout.png`,fullPage:true});
});
