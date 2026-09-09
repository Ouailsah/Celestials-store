'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { retiredBottomSlugs, retiredTopSlugs } from '@/lib/product-content';
import { capacityFor, validBundle } from '@/lib/cart';
import type { CartItem } from '@/lib/types';
type CartContext = { items: CartItem[]; ready: boolean; add: (item: CartItem) => void; update: (id: string, quantity: number) => void; remove: (id: string) => void; clear: () => void; count: number };
const Context = createContext<CartContext | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('celestials-cart-v1') || '[]'); if (Array.isArray(saved)) setItems(saved.filter((x: CartItem) => x && typeof x.variantId === 'string' && validBundle(x) && !retiredTopSlugs.includes(x.slug) && !retiredBottomSlugs.includes(x.slug) && typeof x.variantId === 'string' && typeof x.name === 'string' && typeof x.slug === 'string' && typeof x.image === 'string' && typeof x.color === 'string' && typeof x.size === 'string' && Number.isFinite(x.price) && x.price > 0 && Number.isInteger(x.stock) && x.stock > 0 && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= Math.min(x.stock, 10))); } catch { /* Invalid stored carts are discarded. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem('celestials-cart-v1', JSON.stringify(items)); } catch { /* Shopping still works if storage is disabled. */ } } }, [items, ready]);
  const add = (item: CartItem) => setItems(prev => { const found = prev.find(x => x.variantId === item.variantId); return found ? prev.map(x => x.variantId === item.variantId ? { ...item, quantity: Math.min(x.quantity + item.quantity, capacityFor(prev, item)) } : x) : capacityFor(prev, item) > 0 ? [...prev, { ...item, quantity: Math.min(item.quantity, capacityFor(prev, item)) }] : prev; });
  const update = (id: string, quantity: number) => setItems(prev => prev.map(x => x.variantId === id ? { ...x, quantity: Math.max(1, Math.min(quantity, capacityFor(prev, x))) } : x));
  return <Context.Provider value={{ items, ready, add, update, remove: id => setItems(prev => prev.filter(x => x.variantId !== id)), clear: () => setItems([]), count: items.reduce((n, x) => n + x.quantity, 0) }}>{children}</Context.Provider>;
}
export function useCart() { const value = useContext(Context); if (!value) throw new Error('Cart provider missing'); return value; }
