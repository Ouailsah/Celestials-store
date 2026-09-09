import { test, expect } from '@playwright/test';

test('motion enhances shared elements without layout shifts or blocking controls', async({page},info)=>{
 await page.addInitScript(()=>{
  (window as any).motionShifts=[];
  new PerformanceObserver(list=>{for(const entry of list.getEntries()) if(!(entry as any).hadRecentInput)(window as any).motionShifts.push((entry as any).value);}).observe({type:'layout-shift',buffered:true});
 });
 await page.goto('/shop?category=Outfits');
 await expect(page.locator('html')).toHaveAttribute('data-store-motion','on');
 await expect(page.locator('.outfit-card')).toHaveCount(2);
 await page.locator('.outfit-card').first().scrollIntoViewIfNeeded();
 await page.waitForTimeout(700);
 const before=await page.locator('.outfit-card').first().boundingBox();
 await page.waitForTimeout(300);
 expect(await page.locator('.outfit-card').first().boundingBox()).toEqual(before);
 await page.getByRole('button',{name:'Filters',exact:true}).click();await expect(page.locator('.filter-panel')).toBeVisible();
 await page.getByRole('button',{name:'Filters',exact:true}).click();await expect(page.locator('.filter-panel')).toHaveCount(0);
 await page.goto('/product/sakura-shirt');
 await page.waitForTimeout(650);
 await page.getByRole('button',{name:'Show image 2',exact:true}).click();
 await expect(page.locator('.gallery-main > img')).toHaveAttribute('src','/products/sakura-shirt/02-rear.jpeg');
 await expect(page.locator('[data-motion-overlay]')).toHaveCount(0,{timeout:3000});
 await page.getByRole('button',{name:'Show image 3',exact:true}).click();await page.getByRole('button',{name:'Show image 4',exact:true}).click();
 await expect(page.locator('.gallery-main > img')).toHaveAttribute('src','/products/sakura-shirt/04-front.jpeg');
 await expect(page.locator('[data-motion-overlay]')).toHaveCount(0,{timeout:3000});
 const guide=page.locator('details').filter({has:page.getByText('SIZE GUIDE',{exact:true})});
 await guide.locator('summary').click();await expect(guide.locator('img')).toBeVisible();await page.waitForTimeout(300);
 await guide.locator('summary').click();await page.waitForTimeout(300);await expect(guide.locator('img')).not.toBeVisible();
 await page.getByRole('button',{name:'M-L',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Added to your bag.');await page.getByRole('link',{name:'VIEW BAG',exact:true}).click();await expect(page.locator('.cart-item')).toHaveCount(1);
 await page.waitForTimeout(700);expect(await page.evaluate(()=>(window as any).motionShifts.reduce((a:number,b:number)=>a+b,0))).toBeLessThan(.1);
 await page.screenshot({path:`test-results/motion-cart-${info.project.name}.png`,fullPage:true});
});

test('reduced motion leaves pages visible and navigation, galleries and accordions usable', async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const route of ['/','/shop?category=Tops','/shop?category=Bottoms','/shop?category=Outfits','/product/sakura-outfit-summer','/about','/contact']) {
  await page.goto(route);await page.waitForTimeout(150);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await expect(page.locator('main h1').filter({visible:true})).toBeVisible();
 }
 await page.getByRole('button',{name:'Choose language',exact:true}).click();await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('menu')).toHaveCount(0);
 if(await page.getByRole('button',{name:'Open menu',exact:true}).isVisible()) {
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();await page.getByRole('button',{name:'Close menu',exact:true}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toHaveCount(0);
 }
 await page.goto('/product/sakura-shirt');await page.getByRole('button',{name:'Show image 2',exact:true}).click();await expect(page.locator('[data-motion-overlay]')).toHaveCount(0);
 await page.getByText('SIZE GUIDE',{exact:true}).click();await expect(page.locator('.product-size-chart')).toBeVisible();
 await page.goto('/admin');await expect(page.locator('html')).not.toHaveAttribute('data-store-motion','on');
});
