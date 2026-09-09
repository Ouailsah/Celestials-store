import { getTranslator } from '@/lib/i18n/server';
import { Suspense } from 'react';
import { getProducts } from '@/lib/products';
import { Shop } from '@/components/shop';
export const metadata = {
  title: 'The collection'
};
export const dynamic = 'force-dynamic';
export default async function ShopPage() {
  const t = await getTranslator();
  const products = await getProducts();
  return <Suspense fallback={<div className="page-shell">{t("Loading the collection…")}</div>}><Shop products={products} /></Suspense>;
}
