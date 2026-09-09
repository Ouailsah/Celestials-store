import { test, expect } from '@playwright/test';
import { seedOutfits } from '../../src/lib/outfits';
import { seedProducts } from '../../src/lib/catalog';
test('every product uses identical global delivery information', async ({page}, info) => {
  const expected = 'Algeria-wide shipping via Zr Express Home delivery: 500 - 1,600 DA depending on wilaya Stop desk: 370 - 1,120 DA depending on wilaya Delivery time: 2-5 business days';
  for (const product of [...seedProducts, ...seedOutfits]) {
    await page.goto(`/product/${product.slug}`);
    const delivery = page.locator('.product-delivery:visible');
    await expect(delivery).toHaveCount(1);
    await delivery.locator('summary').click();
    await expect(delivery).toHaveAttribute('open','');
    await expect(delivery.locator('p')).toBeVisible();
    expect((await delivery.locator('p').innerText()).replace(/\s+/g,' ').trim()).toBe(expected);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    if (product.slug === 'sakura-shirt') await delivery.screenshot({path:`test-results/global-delivery-${info.project.name}.png`});
    await delivery.locator('summary').click();
    await expect(delivery).not.toHaveAttribute('open','');
  }
});
