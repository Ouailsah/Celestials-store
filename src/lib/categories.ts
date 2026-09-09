// Storefront taxonomy only: stored product categories and admin data remain intact.
import type { Product } from './types';
export const storefrontCategories = ['All pieces', 'Tops', 'Bottoms', 'Outfits'] as const;
export function storefrontCategory(category: string): string {
  const key = category.trim().toLowerCase();
  if (['tops', 't-shirts', 'hoodies', 'outerwear'].includes(key)) return 'Tops';
  if (key === 'bottoms') return 'Bottoms';
  if (key === 'outfits') return 'Outfits';
  if (key === 'all pieces') return 'All pieces';
  return category;
}
export const isOutfit = (product: Pick<Product, 'outfit'>): boolean => Boolean(product.outfit);
export function matchesCategory(product: string | Pick<Product, 'category' | 'outfit'>, selected: string): boolean {
  const category = storefrontCategory(selected);
  if (category === 'All pieces') return true;
  if (typeof product === 'string') return storefrontCategory(product) === category;
  if (category === 'Outfits') return isOutfit(product);
  return !isOutfit(product) && storefrontCategory(product.category) === category;
}
