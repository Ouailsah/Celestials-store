'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useLanguage } from './i18n';
export function OutfitCard({ product: p }: { product: Product }) {
  const { t } = useLanguage();
  return <article className="outfit-card"><Link href={`/product/${p.slug}`} className="outfit-card-image"><img src={p.images[0]} alt={p.name} loading="lazy" /></Link><div className="outfit-card-info"><div><span className="eyebrow">{t('OUTFITS')}</span><h3><Link href={`/product/${p.slug}`}>{p.name}</Link></h3><p>{p.price.toLocaleString('en-DZ')} DA {p.outfit!.original_price>p.price&&<del>{p.outfit!.original_price.toLocaleString('en-DZ')} DA</del>}</p></div><Link className="button button-dark" href={`/product/${p.slug}`}>{t('VIEW OUTFIT')}<ArrowUpRight size={18} /></Link></div></article>;
}
