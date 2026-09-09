import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesCategory, storefrontCategory } from '../src/lib/categories';
test('legacy product taxonomy remains accessible as Tops', () => {
  for (const category of ['Hoodies', 'T-Shirts', 'Outerwear', 'Tops']) {
    assert.equal(storefrontCategory(category), 'Tops');
    assert.ok(matchesCategory(category, 'Tops'));
    assert.ok(matchesCategory(category, 'All pieces'));
    assert.equal(matchesCategory(category, 'Outfits'), false);
  }
  assert.ok(matchesCategory('Outfits', 'Outfits'));
  assert.equal(matchesCategory('Bottoms', 'Outfits'), false);
});
