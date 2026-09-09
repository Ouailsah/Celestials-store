import { getTranslator } from '@/lib/i18n/server';
import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/products';
import { OutfitDetail } from '@/components/outfit-detail';
import { ProductDetail } from '@/components/product-detail';
import { ProductCard } from '@/components/product-card';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const {
    slug
  } = await params;
  const p = (await getProducts()).find(p => p.slug === slug);
  return {
    title: p?.name || 'Piece not found'
  };
}
export default async function ProductPage({
  params
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const t = await getTranslator();
  const {
    slug
  } = await params;
  const products = await getProducts();
  const product = products.find(p => p.slug === slug);
  if (!product) notFound();
  return <>{product.outfit ? <OutfitDetail product={product} /> : <ProductDetail product={product} />}<section className="section"><div className="section-heading"><div><span className="eyebrow">{t("BUILD YOUR ROTATION")}</span><h2>{t("Better together.")}</h2></div></div><div className="product-grid">{products.filter(p => p.id !== product.id).slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}</div></section></>;
}
