import type { Product } from './types';
import { isOutfit, matchesCategory, storefrontCategory } from './categories';

/** Category navigation leaves a collection edit, retaining explicit filter controls. */
export function categoryQuery(current: URLSearchParams, selected: string) {
  const next = new URLSearchParams(current);
  const category = storefrontCategory(selected);
  next.delete('edit');
  if (category === 'All pieces') next.delete('category');
  else next.set('category', category);
  return next;
}

export function filterShopProducts(products: Product[], params: URLSearchParams): Product[] {
  const category = params.get('category') || 'All pieces';
  const search = (params.get('search') || '').trim().toLowerCase();
  const edit = (params.get('edit') || '').toLowerCase();
  const size = (params.get('size') || '').toLowerCase();
  const color = (params.get('color') || '').toLowerCase();
  const requestedMax = params.get('max') ? Number(params.get('max')) : Infinity;
  const max = Number.isFinite(requestedMax) && requestedMax >= 0 ? requestedMax : Infinity;
  const stockOnly = params.has('stock');
  const visible = products.filter(p => {
    if (!p.active || !matchesCategory(p, category) || !p.name.toLowerCase().includes(search) || p.price > max) return false;
    if (edit === 'new' && p.badge !== 'NEW ARRIVAL' || edit === 'best' && p.badge !== 'BEST SELLER') return false;
    // Each component must have a selectable matching size. Color may belong to
    // either component; outfits need not have the same color for both pieces.
    const pieces = p.outfit ? p.outfit.components.map(c => c.product) : [p];
    const matchingVariants = pieces.map(piece => piece.active ? piece.product_variants.filter(v => (!size || v.size.toLowerCase() === size) && (!stockOnly || v.stock > 0)) : []);
    return matchingVariants.every(variants => variants.length > 0) && (!color || matchingVariants.some(variants => variants.some(v => v.color.toLowerCase() === color)));
  });
  const sort = params.get('sort');
  if (sort === 'price-asc') return visible.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') return visible.sort((a,b) => b.price - a.price);
  return [...visible.filter(isOutfit), ...visible.filter(p => !isOutfit(p))];
}
