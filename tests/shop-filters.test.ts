import test from 'node:test';
import assert from 'node:assert/strict';
import { seedProducts } from '../src/lib/catalog';
import { seedOutfits, resolveOutfits } from '../src/lib/outfits';
import { categoryQuery, filterShopProducts } from '../src/lib/shop-filters';
import { matchesCategory } from '../src/lib/categories';
const outfits = resolveOutfits(seedProducts, seedOutfits);
const products = [...seedProducts, ...outfits];
const filter = (query:string) => filterShopProducts(products, new URLSearchParams(query));

test('category navigation exits hidden collection edits and matches outfits independently of category strings', () => {
 for (const edit of ['new','best']) {
  const query=categoryQuery(new URLSearchParams(`edit=${edit}`),'Outfits');
  assert.equal(query.toString(),'category=Outfits');assert.deepEqual(filterShopProducts(products,query),outfits);
 }
 for (const category of ['Outfits','outfits','OUTFITS']) assert.deepEqual(filter(`category=${category}`),outfits);
 assert.equal(matchesCategory({...outfits[0],category:'Tops'},'outfits'),true);
 assert.equal(matchesCategory({...outfits[0],category:'Tops'},'Tops'),false);
 assert.equal(matchesCategory({...seedProducts[0],category:'Outfits'},'Outfits'),false);
 assert.equal(filter('category=Tops').length,4);assert.equal(filter('category=Bottoms').length,2);assert.equal(filter('category=ALL%20PIECES').length,8);
 assert.equal(new Set(filter('').map(p=>p.id)).size,8);
 assert.equal(categoryQuery(new URLSearchParams('edit=new&category=Tops'),'All pieces').toString(),'');
});
test('outfits use their own searchable names, discounted prices and badges, with component availability', () => {
 assert.deepEqual(filter('category=Outfits&search=sakura'),[outfits[1]]);
 assert.deepEqual(filter('category=Outfits&max=7000'),[outfits[0]]);
 assert.deepEqual(filter('category=Outfits&color=white&size=M-L&stock=1'),[outfits[1]]);
 assert.deepEqual(filter('category=Outfits&sort=price-desc'),[outfits[1],outfits[0]]);
 const prices=filter('sort=price-asc').map(p=>p.price);assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));
 assert.equal(filter('edit=new').length,5); // Outfits do not inherit component badges.
 const unavailable=structuredClone(outfits[0]);unavailable.outfit!.components[0].product.product_variants.forEach(v=>v.stock=0);
 assert.equal(filterShopProducts([unavailable],new URLSearchParams('category=Outfits')).length,1);
 assert.equal(filterShopProducts([unavailable],new URLSearchParams('category=Outfits&stock=1')).length,0);
 assert.equal(filterShopProducts([{...outfits[0],active:false}],new URLSearchParams()).length,0);
 assert.equal(categoryQuery(new URLSearchParams('edit=new&search=sakura&max=9000'),'Outfits').get('search'),'sakura');
});
