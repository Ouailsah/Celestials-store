import type { CartItem } from './types';
export const bundleKey = (id: string, variants: string[]) => `outfit:${id}:${[...variants].sort().join(':')}`;
export function reservedQuantity(items: CartItem[], variantId: string) {
  return items.reduce((n, item) => n + ((item.components ? item.components.some(c => c.variantId === variantId) : item.variantId === variantId) ? item.quantity : 0), 0);
}
export function capacityFor(items: CartItem[], item: CartItem) {
  const others = items.filter(i => i.variantId !== item.variantId);
  return Math.max(0, Math.min(10, ...(item.components || [{ variantId: item.variantId, stock: item.stock }]).map(c => c.stock - reservedQuantity(others, c.variantId))));
}
export function orderLine(item: CartItem) {
  return item.components ? { outfitId: item.productId, variantIds: item.components.map(c => c.variantId), quantity: item.quantity } : { variantId: item.variantId, quantity: item.quantity };
}
export function validBundle(item: CartItem) {
  return !item.components ? !item.variantId.startsWith('outfit:') : Array.isArray(item.components) && item.components.length === 2 && new Set(item.components.map(c => c?.productId)).size === 2 && item.components.every(c => c && typeof c.variantId === 'string' && typeof c.productId === 'string' && typeof c.name === 'string' && typeof c.size === 'string' && typeof c.color === 'string' && Number.isInteger(c.stock) && c.stock > 0) && item.variantId === bundleKey(item.productId, item.components.map(c => c.variantId));
}
