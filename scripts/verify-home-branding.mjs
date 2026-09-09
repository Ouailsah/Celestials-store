import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
mkdirSync('test-results/branding', { recursive: true });
try {
  for (const width of [1440, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.locator('.home-categories').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.home-categories img, .hero-image, .header .brand-mark')].every(img => img.complete && img.naturalWidth > 0));
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.hero-image');
      const logo = document.querySelector('.header .brand-mark');
      const tops = document.querySelector('.home-category-tops').getBoundingClientRect();
      const bottoms = document.querySelector('.home-category-bottoms').getBoundingClientRect();
      const outfits = document.querySelector('.home-category-outfits').getBoundingClientRect();
      const heading = document.querySelector('#category-heading');
      return {
        width: innerWidth, documentWidth: document.documentElement.scrollWidth,
        heroSource: hero.getAttribute('src'), heroFit: getComputedStyle(hero).objectFit,
        logoRatio: logo.getBoundingClientRect().width / logo.getBoundingClientRect().height,
        headingFits: heading.scrollWidth <= heading.clientWidth,
        topsDominant: tops.width * tops.height > bottoms.width * bottoms.height && tops.width * tops.height > outfits.width * outfits.height,
        labelsFit: [...document.querySelectorAll('.home-category-caption > div')].every(el => el.scrollWidth <= el.clientWidth),
        mobileComposition: innerWidth > 700 || (bottoms.y >= tops.bottom && outfits.y >= tops.bottom && outfits.x > bottoms.x),
      };
    });
    assert.equal(metrics.documentWidth, width, 'No horizontal overflow');
    assert.equal(metrics.heroFit, 'cover', 'Campaign covers the entire hero');
    assert.equal(await page.locator('.arrivals, .category-section, .home-page .product-card').count(), 0);
    assert.equal(await page.locator('.home-categories + .brand-section').count(), 1);
    const hero = await page.locator('.hero').boundingBox();
    const artwork = await page.locator('.hero-artwork').boundingBox();
    assert.deepEqual(artwork, hero, 'Background fills every edge of the hero');
    await page.locator('.brand-section').screenshot({ path: `test-results/branding/brand-${width}.png` });
    await page.locator('.hero').screenshot({ path: `test-results/branding/hero-${width}.png` });
    assert.ok(metrics.heroSource.includes('hero.jpg'));
    assert.ok(Math.abs(metrics.logoRatio - 512 / 594) < .01, 'Logo is not distorted');
    assert.ok(metrics.headingFits && metrics.labelsFit && metrics.topsDominant && metrics.mobileComposition, JSON.stringify(metrics));
    await page.locator('.home-categories').screenshot({ path: `test-results/branding/categories-${width}.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/branding/home-${width}.png`, fullPage: true });
    console.log('PASS responsive branding', metrics);
  }

  for (const [name, expected, count] of [['tops', '/shop?category=Tops', 4], ['bottoms', '/shop?category=Bottoms', 1], ['outfits', '/shop?category=Outfits', 0]]) {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.locator('.home-categories').getByRole('link', { name: `Shop ${name}`, exact: true }).click();
    await page.waitForURL(`**${expected}`);
    if (count) await page.locator('.product-card').first().waitFor();
    else await page.getByRole('heading', { name: 'No pieces found.' }).waitFor();
    assert.equal(await page.locator('.product-card').count(), count, `${name} filters sample catalog correctly`);
    console.log(`PASS ${name} → ${expected} (${count} products)`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
