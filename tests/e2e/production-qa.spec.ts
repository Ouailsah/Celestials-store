import {test,expect} from '@playwright/test';
test.use({actionTimeout:10000});

// Read-only against the connected catalog: never submits orders or admin writes.
test('production QA: connected storefront remains usable across desktop tablet and mobile',async({page},info)=>{
 test.skip(info.project.name!=='desktop','This test sets its own mobile/tablet/desktop widths.');
 test.setTimeout(240000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const failures:string[]=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('/products/'))failures.push(`${r.status()} ${r.url()}`);});
 await page.goto('/shop');await expect(page.locator('.product-card')).not.toHaveCount(0);
 const links=await page.locator('.product-card h3 a,.outfit-card h3 a').evaluateAll(a=>a.map(el=>el.getAttribute('href')!));
 for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/', '/shop','/shop?category=Tops','/shop?category=Bottoms','/shop?category=Outfits',...links,'/about','/contact','/cart','/checkout','/order-confirmation','/admin/login']){
   const response=await page.goto(path);expect(response?.status(),path).toBe(200);
   await expect(page.locator('main h1,main h2').first()).toBeVisible();
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),{message:`Overflow: ${path} at ${width}`}).toBeTruthy();
   const images=page.locator('.gallery-main img,.product-image img,.outfit-card-image img,.story-image img');
   for(const img of await images.all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0),{message:`Broken image: ${path}`}).toBeTruthy();}
   if(['/','/shop','/about','/contact','/admin/login'].includes(path))await page.screenshot({path:info.outputPath(`${path.replaceAll('/','')||'home'}-${width}.png`),fullPage:true});
  }
 }
 // Filled cart and checkout, kept entirely in this browser's local storage.
 await page.goto('/product/slim-fit-shirt-blue-navy');await page.locator('.size-options button:not(:disabled)').first().click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 await page.goto('/product/sakura-outfit-summer');await expect(page.locator('.outfit-component')).toHaveCount(2);for(const group of await page.locator('.outfit-component').all())await group.locator('.size-options button:not(:disabled)').first().click();await page.getByRole('button',{name:'ADD TO BAG',exact:true}).click();
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});for(const path of ['/cart','/checkout']){await page.goto(path);await expect(page.locator(path==='/cart'?'.cart-item':'.summary-product')).toHaveCount(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();await page.screenshot({path:info.outputPath(`${path.slice(1)}-filled-${width}.png`),fullPage:true});}}
 await page.goto('/cart');await page.reload();await expect(page.locator('.cart-item')).toHaveCount(2);await page.locator('.cart-item').first().getByRole('button',{name:/Increase/}).click();await expect(page.locator('.cart-item').first().locator('.quantity-control span')).toHaveText('2');await page.locator('.cart-item').first().getByRole('button',{name:/Remove/}).click();await expect(page.locator('.cart-item')).toHaveCount(1);
 for(const path of ['/admin','/admin?tab=products','/admin?tab=outfits','/admin?tab=orders']){await page.goto(path);await expect(page).toHaveURL(/\/admin\/login/);}
 expect(errors).toEqual([]);expect(failures).toEqual([]);
});

test('connected catalog search filters and sorting preserve owner-created records',async({page})=>{
 await page.goto('/shop');const cards=page.locator('.product-grid').first().locator('article');await expect(cards).not.toHaveCount(0);const total=await cards.count();
 await page.getByRole('textbox',{name:'Search products',exact:true}).fill('Slim Fit Shirt Blue Navy');await expect(cards).toHaveCount(1);
 await page.getByRole('button',{name:'Clear search',exact:true}).click();await expect(cards).toHaveCount(total);
 await page.getByRole('button',{name:'Tops',exact:true}).click();await expect(page.locator('.outfit-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Outfits',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(0);await expect(page.locator('.outfit-card')).not.toHaveCount(0);
 await page.getByRole('button',{name:'All pieces',exact:true}).click();await expect(cards).toHaveCount(total);
 for(const sort of ['price-asc','price-desc']){
  await page.getByRole('combobox',{name:'Sort products',exact:true}).selectOption(sort);
  const prices=await cards.evaluateAll(els=>els.map(el=>Number((el.querySelector('.price,.outfit-card-info p')?.textContent?.match(/[\d,]+/)?.[0]||'').replaceAll(',',''))));
  expect(prices).toEqual([...prices].sort((a,b)=>sort==='price-asc'?a-b:b-a));
 }
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Size',{exact:true}).selectOption('XL');await page.getByLabel('In stock only').check();await expect(cards).not.toHaveCount(0);
});
