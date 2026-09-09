import { test, expect, type Page } from '@playwright/test';

async function choose(page: Page, code: 'en' | 'fr' | 'ar') {
  await page.locator('.language-trigger').click();
  await page.getByRole('menuitemradio').filter({has: page.locator('.language-code', {hasText: code.toUpperCase()})}).click();
  await expect(page.locator('html')).toHaveAttribute('lang', code);
  await expect(page.locator('.language-dropdown')).toHaveCount(0);
}

test('languages translate, persist and preserve cart variants and checkout input', async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await choose(page,'fr');
  await expect(page.locator('.hero-content h1:visible')).toContainText("L'ORDINAIRE.");
  await expect(page.locator('.home-categories h2')).toHaveText('SHOP PAR CATÉGORIE');
  await page.reload();
  await expect(page.locator('.language-trigger')).toContainText('FR');
  await page.goto('/shop');
  await expect(page.getByRole('heading',{name:'La collection.'})).toBeVisible();
  await page.locator('.product-info h3 a').first().click();
  await page.getByRole('button',{name:'M-L',exact:true}).click();
  await page.getByRole('button',{name:'AJOUTER AU PANIER',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Ajouté à votre panier.');
  const before = await page.evaluate(()=>localStorage.getItem('celestials-cart-v1'));
  await choose(page,'ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.getByRole('button',{name:'أضف إلى السلة'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('celestials-cart-v1'))).toBe(before);
  await page.getByRole('link',{name:'عرض السلة',exact:true}).click();
  await expect(page.locator('.page-intro h1')).toContainText('سلتك');
  await expect(page.locator('.shipping-note')).toContainText('للحصول على توصيل مجاني');
  await page.screenshot({path:`test-results/cart-ar-${testInfo.project.name}.png`,fullPage:true});
  await page.getByRole('link',{name:'متابعة إتمام الطلب'}).click();
  await expect(page.getByRole('heading',{name:'اجعلها لك.'})).toBeVisible();
  await page.locator('.checkout-layout').evaluate((form: HTMLFormElement)=>form.reportValidity());
  expect(await page.locator('input[name="name"]').evaluate((input: HTMLInputElement)=>input.validationMessage)).toBe('يرجى ملء هذا الحقل.');
  await page.getByLabel('الاسم الكامل',{exact:true}).fill('Amine Test');
  await page.locator('input[name="phone"]').fill('0555123456');
  await page.getByLabel('الولاية',{exact:true}).selectOption('16 Alger');
  await page.locator('input[name="commune"]').fill('Hydra');
  await page.locator('textarea[name="address"]').fill('12 Example Street');
  await expect(page.locator('input[name="phone"]')).toHaveCSS('direction','ltr');
  await page.screenshot({path:`test-results/checkout-ar-${testInfo.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await choose(page,'fr');
  await expect(page.getByLabel('NOM COMPLET',{exact:true})).toHaveValue('Amine Test');
  await expect(page.locator('select[name="wilaya"]')).toHaveValue('16 Alger');
  await expect(page.locator('input[name="phone"]')).toHaveValue('0555123456');
  await expect(page.getByRole('button',{name:'CONFIRMER MA COMMANDE'})).toBeDisabled();
  await choose(page,'en');
  await expect(page.getByRole('button',{name:'PLACE MY ORDER'})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  await choose(page,'ar');
  await page.goto('/order-confirmation');
  await expect(page.getByRole('heading',{name:'فصلك القادم.'})).toBeVisible();
  await page.goto('/contact');
  await expect(page.getByRole('heading',{name:'نحن هنا من أجلك.'})).toBeVisible();
  await page.goto('/about');
  await expect(page.locator('.story-copy h1')).toContainText('مستوى');
  await page.goto('/admin');
  await expect(page).toHaveURL(/admin\/login/);
  await expect(page.locator('#main')).toHaveAttribute('dir','ltr');
  await expect(page.getByRole('heading',{name:'Behind the label.'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('selector dismisses outside, supports keyboard, and uses the Algerian flag',async({page})=>{
  await page.goto('/');
  await page.locator('.language-trigger').click();
  await expect(page.locator('.language-dropdown img[src="/flags/dz.svg"]')).toBeVisible();
  await page.locator('.announcement').click();
  await expect(page.locator('.language-dropdown')).toHaveCount(0);
  await page.locator('.language-trigger').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitemradio').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang','ar');
  await page.locator('.language-trigger').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.language-dropdown')).toHaveCount(0);
  await expect(page.locator('.language-trigger')).toBeFocused();
});

test('mobile navbar and RTL storefront fit 375, 390 and 430 pixels',async({page})=>{
  for(const width of [375,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    for(const locale of ['en','fr','ar'] as const) {
      await choose(page,locale);
      await expect(page.locator('.hero-content h1:visible')).toContainText(locale==='ar'?'المألوف':locale==='fr'?"L'ORDINAIRE":'ORDINARY');
      await page.locator('.language-trigger').click();
      const geometry=await page.evaluate(()=>{
        const dropdown=document.querySelector('.language-dropdown')!.getBoundingClientRect();
        const selector=document.querySelector('.language-trigger')!.getBoundingClientRect();
        const menu=document.querySelector('.mobile-menu')!.getBoundingClientRect();
        const logo=document.querySelector('.nav-brand-mark') as HTMLImageElement;
        return {fits:dropdown.left>=0&&dropdown.right<=innerWidth,controls:selector.right<=menu.left,overflow:document.documentElement.scrollWidth>innerWidth,logo:logo.naturalWidth>0&&Math.abs(logo.width/logo.height-512/594)<.04};
      });
      expect(geometry).toEqual({fits:true,controls:true,overflow:false,logo:true});
      await page.screenshot({path:`test-results/language-${locale}-${width}.png`});
      await page.keyboard.press('Escape');
      await page.locator('.mobile-menu').click();
      await expect(page.locator('.mobile-nav')).toBeVisible();
      await expect(page.locator('.mobile-nav a[href="/cart"]')).toBeVisible();
      await page.locator('.mobile-menu').click();
    }
  }
});
