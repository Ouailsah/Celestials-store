import type { Product, SizeGuide } from './types';
export type OutfitDefinition = { id: string; slug: string; name: string; price: number; original_price: number; image: string; images?: string[]; badge?: string | null; description: string; active: boolean; components: { product_id: string; thumbnail?: string; size_guide?: SizeGuide }[] };
export const seedOutfits: OutfitDefinition[] = [
  { id: '40000000-0000-4000-8000-000000000001', slug: 'bootcut-slim-shirt-combo', name: 'BOOTCUT + SLIM SHIRT COMBO', price: 6900, original_price: 7900, image: '/outfits/bootcut-slim-combo/01-cover.jpeg', description: 'Serpent Hunter Bootcut paired with Slim Fit Shirt Blue Navy. Choose a size for each piece.', active: true, components: [
    { product_id: '10000000-0000-4000-8000-000000000012' },
    { product_id: '10000000-0000-4000-8000-000000000010', thumbnail: '/outfits/bootcut-slim-combo/shirt-thumbnail.jpeg' },
  ] },
  { id: '40000000-0000-4000-8000-000000000002', slug: 'sakura-outfit-summer', name: 'SAKURA OUTFIT SUMMER', price: 8700, original_price: 9700, image: '/outfits/sakura-summer/01-cover.jpeg', description: 'Sakura Shirt paired with Sakura Jeans. Choose a size for each piece.', active: true, components: [
    { product_id: '10000000-0000-4000-8000-000000000009', thumbnail: '/outfits/sakura-summer/shirt-thumbnail.jpeg', size_guide: { image: '/outfits/sakura-summer/shirt-size-chart.jpeg', alt: 'Sakura Shirt size chart: S/M, L, XL. A: 60, 62, 65. B: 60, 63, 65. C: 73, 74, 76.' } },
    { product_id: '10000000-0000-4000-8000-000000000011', thumbnail: '/outfits/sakura-summer/jeans-thumbnail.jpeg' },
  ] },
];
export function resolveOutfits(products: Product[], definitions: OutfitDefinition[]): Product[] {
  return definitions.filter(o => o.active && o.components.length === 2 && new Set(o.components.map(c => c.product_id)).size === 2 && o.components.every(c => products.some(p => p.id === c.product_id && p.active && !p.outfit))).map(o => ({
    id: o.id, slug: o.slug, name: o.name, category: 'Outfits', price: o.price, description: o.description, images: o.images?.length ? o.images : [o.image], badge: o.badge || null, active: true, product_variants: [],
    outfit: { original_price: o.original_price, components: o.components.map(c => ({ ...c, product: products.find(p => p.id === c.product_id)! })) },
  }));
}
