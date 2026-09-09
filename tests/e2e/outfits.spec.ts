import { test, expect } from '@playwright/test';
import { translate } from '../../src/lib/i18n';

test('outfits use references, independent sizes, guides and one persistent discounted cart line',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shop');await expect(page.locator('.outfit-card')).toHaveCount(2);await expect(page.locator('.product-card')).toHaveCount(6);
 const grid=await page.locator('.product-grid').boundingBox();
 for(const card of await page.locator('.outfit-card').all()) expect(Math.abs((await card.boundingBox())!.width-grid!.width)).toBeLessThan(2);
 for(const category of ['Tops','Bottoms']){await page.goto(`/shop?category=${category}`);await expect(page.locator('.outfit-card')).toHaveCount(0);}
 await page.goto('/shop?category=Outfits');await expect(page.locator('.outfit-card')).toHaveCount(2);
 await page.goto('/product/bootcut-slim-shirt-combo');
 await expect(page.locator('.detail-price:visible')).toContainText('6,900 DA');await expect(page.locator('.detail-price del:visible')).toHaveText('7,900 DA');
 const bootcut=page.getByRole('group',{name:'Serpent Hunter Bootcut',exact:true});const navy=page.getByRole('group',{name:'Slim Fit Shirt Blue Navy',exact:true});
 await expect(bootcut.locator('.size-options button')).toHaveText(['S','M','L','XL']);await expect(navy.locator('.size-options button')).toHaveText(['S','M','L','XL']);
 await expect(page.getByRole('button',{name:'ADD TO BAG',exact:true})).toBeDisabled();
 await bootcut.getByRole('button',{name:'S',exact:true}).click();await expect(page.getByRole('button',{name:'ADD TO BAG',exact:true})).toBeDisabled();
 await navy.getByRole('button',{name:'XL',exact:true}).click();await expect(page.getByRole('button',{name:'ADD TO BAG',exact:true})).toBeEnabled();
 await bootcut.locator('summary').click();await expect(bootcut.locator('.product-size-chart')).toBeVisible();await expect(bootcut.locator('.product-size-chart')).toHaveAttribute('src','/products/bootcut-jeans/size-chart.jpeg');
 await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await page.goto('/product/sakura-outfit-summer');
 await expect(page.locator('.gallery-main img')).toHaveAttribute('src','/outfits/sakura-summer/01-cover.jpeg');
 await expect(page.locator('.detail-price:visible')).toContainText('8,700 DA');await expect(page.locator('.detail-price del:visible')).toHaveText('9,700 DA');
 const shirt=page.getByRole('group',{name:'Sakura Shirt',exact:true});const jeans=page.getByRole('group',{name:'Sakura Jeans',exact:true});
 for(const component of [shirt,jeans]){await expect(component.locator('.size-options button')).toHaveText(['S','M-L','XL']);await component.locator('summary').click();await expect(component.locator('.product-size-chart')).toBeVisible();}
 await expect(shirt.locator('.product-size-chart')).toHaveAttribute('src','/outfits/sakura-summer/shirt-size-chart.jpeg');await expect(jeans.locator('.product-size-chart')).toHaveAttribute('src','/products/sakura-jeans/size-chart.jpeg');
 await expect(page.locator('.gallery img[src*="size-chart"]')).toHaveCount(0);
 for(const width of [375,390,430,768,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const img of await page.locator('.product-size-chart').all()) {await img.evaluate((i:HTMLImageElement)=>i.decode());expect(await img.evaluate((i:HTMLImageElement)=>Math.abs(i.width/i.height-i.naturalWidth/i.naturalHeight)<.01)).toBeTruthy();}
  await page.screenshot({path:`test-results/outfit-${info.project.name}-${width}.png`,fullPage:true});
 }
 await shirt.getByRole('button',{name:'M-L',exact:true}).click();await expect(page.getByRole('button',{name:'ADD TO BAG',exact:true})).toBeDisabled();await jeans.getByRole('button',{name:'XL',exact:true}).click();
 await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await page.goto('/cart');await expect(page.locator('.cart-item')).toHaveCount(2);
 const sakura=page.locator('.cart-item').filter({hasText:'SAKURA OUTFIT SUMMER'});await expect(sakura).toContainText('Sakura Shirt / M-L');await expect(sakura).toContainText('Sakura Jeans / XL');await expect(sakura).toContainText('8,700 DZD');
 await page.reload();await expect(page.locator('.cart-item')).toHaveCount(2);
 const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('celestials-cart-v1')!));expect(cart.map((i:any)=>[i.price,i.components.length])).toEqual([[6900,2],[8700,2]]);
 await page.goto('/checkout');await expect(page.locator('.summary-product')).toHaveCount(2);await expect(page.locator('.summary-total')).toContainText('15,600 DZD');await expect(page.locator('.summary-product').last()).toContainText('Sakura Jeans / XL');
 expect(errors).toEqual([]);
});

test('different outfit combinations stay separate and share stock with individual items',async({page})=>{
 await page.goto('/product/sakura-outfit-summer');
 const shirt=page.getByRole('group',{name:'Sakura Shirt',exact:true});const jeans=page.getByRole('group',{name:'Sakura Jeans',exact:true});
 await shirt.getByRole('button',{name:'S',exact:true}).click();await jeans.getByRole('button',{name:'S',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await jeans.getByRole('button',{name:'XL',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await page.goto('/cart');await expect(page.locator('.cart-item')).toHaveCount(2);
 const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('celestials-cart-v1')!));expect(entries[0].variantId).not.toEqual(entries[1].variantId);
 await page.goto('/product/sakura-shirt');await page.getByRole('button',{name:'S',exact:true}).click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();await page.goto('/cart');await expect(page.locator('.cart-item')).toHaveCount(3);
 for(let i=0;i<9;i++)await page.locator('.cart-item').first().getByRole('button',{name:'Increase',exact:false}).click();
 await expect(page.locator('.cart-item').first().locator('.quantity-control span')).toHaveText('10');
 await expect(page.locator('.cart-item').last().getByRole('button',{name:'Increase',exact:false})).toBeDisabled();
});

test('outfit translations and Arabic layout preserve component selections',async({page,context},info)=>{
 for(const language of ['fr','ar','en'] as const) {
  await context.addCookies([{name:'celestials-language',value:language,domain:'localhost',path:'/'}]);
  await page.goto('/product/sakura-outfit-summer');
  await expect(page.locator('html')).toHaveAttribute('dir',language==='ar'?'rtl':'ltr');
  await expect(page.locator('.outfit-add:visible')).toHaveText(translate(language, 'ADD TO BAG'));
  for(const width of [375,390,430]) {
   await page.setViewportSize({width,height:850});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  if(language==='ar') await page.screenshot({path:`test-results/outfit-ar-${info.project.name}.png`,fullPage:true});
 }
 await page.getByRole('group',{name:'Sakura Shirt',exact:true}).getByRole('button',{name:'M-L',exact:true}).click();
 await page.getByRole('group',{name:'Sakura Jeans',exact:true}).getByRole('button',{name:'XL',exact:true}).click();
 await page.locator('.outfit-add:visible').click();
 await context.addCookies([{name:'celestials-language',value:'ar',domain:'localhost',path:'/'}]);
 await page.goto('/cart');await expect(page.locator('.cart-item')).toHaveCount(1);await expect(page.locator('.cart-item')).toContainText('Sakura Shirt / M-L');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto('/checkout');await expect(page.locator('.summary-product')).toContainText('Sakura Jeans / XL');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
