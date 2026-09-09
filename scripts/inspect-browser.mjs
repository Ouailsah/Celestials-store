import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1280,height:900}});
for (const path of ['/product/heavyweight-hoodie','/']) {
 await page.goto(`http://localhost:3000${path}`,{waitUntil:'networkidle'});
 console.log(path, await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(0,15),images:[...document.images].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))})));
 await page.screenshot({path:`test-results/inspect-${path==='/'?'home':'product'}.png`,fullPage:true});
}
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/inspect-mobile.png',fullPage:true});
await browser.close();
