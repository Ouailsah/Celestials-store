import 'server-only';
import { cache } from 'react';
import { configured, publicDb } from './supabase';
import { seedProducts } from './catalog';
import type { Product } from './types';
import { resolveOutfits, seedOutfits, type OutfitDefinition } from './outfits';
export const getProducts = cache(async (): Promise<Product[]> => {
  if (!configured()) return [...seedProducts, ...resolveOutfits(seedProducts, seedOutfits)];
  const { data, error } = await publicDb().from('products').select('*, product_variants(*)').eq('active', true).order('created_at', { ascending: false });
  if (error) throw new Error('The collection could not be loaded. Please try again.');
  const { data: outfits, error: outfitError } = await publicDb().from('outfits').select('*').eq('active', true);
  if (outfitError) throw new Error('The collection could not be loaded. Please try again.');
  return [...data as Product[], ...resolveOutfits(data as Product[], outfits as OutfitDefinition[])];
});
