import { test, expect } from '@playwright/test';

test('runtime Supabase configuration enables admin login and checkout', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByRole('button', { name: 'SECURE SIGN IN' })).toBeEnabled();
  await expect(page.getByText('Admin sign-in is not configured yet.', { exact: false })).toHaveCount(0);
  await page.goto('/product/slim-fit-shirt-blue-navy');
  await page.locator('.size-options button:not(:disabled)').first().click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'PLACE MY ORDER', exact: true })).toBeEnabled();
  await expect(page.getByText('Ordering opens when the store is connected.', { exact: true })).toHaveCount(0);
  // Do not submit: this regression check must not create a live order.
});
