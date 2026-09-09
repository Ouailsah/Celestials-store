"use client";

import { isSakuraJeans, jeansCardDescription, isNavyShirt, navyCardDescription, isCursedShirt, shirtCardDescription } from '@/lib/product-content';
import { storefrontCategory } from '@/lib/categories';
import { useLanguage } from '@/components/i18n';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { OutfitCard } from './outfit-card';
import { money, type Product } from '@/lib/types';
export function ProductCard({
  product
}: {
  product: Product;
}) {
  const {
    t
  } = useLanguage();
  if (product.outfit) return <OutfitCard product={product} />;
  const colors = [...new Map(product.product_variants.map(v => [v.color, v.color_hex])).entries()];
  return <article className="product-card"><Link href={`/product/${product.slug}`} className="product-image"><img src={product.images[0]} alt={t(product.name)} loading="lazy" />{product.badge && <span className="product-badge">{t(product.badge)}</span>}<span className="product-arrow"><ArrowUpRight size={19} /></span><span className="product-view">{t("DISCOVER PIECE ")}<ArrowUpRight size={15} /></span></Link><div className="product-info"><div><h3><Link href={`/product/${product.slug}`}>{product.slug === 'sakura-shirt' ? product.name.toUpperCase() : product.name}</Link></h3><p>{isSakuraJeans(product.slug) ? t(jeansCardDescription) : isNavyShirt(product.slug) ? t(navyCardDescription) : isCursedShirt(product.slug) ? t(shirtCardDescription) : <>{t(storefrontCategory(product.category))}{t(" \u00b7 Relaxed fit")}</>}</p></div><span className="price">{(isNavyShirt(product.slug) || isCursedShirt(product.slug)) ? `${product.price.toLocaleString('en-DZ')} DA` : money(product.price)}{product.original_price!=null&&product.original_price>product.price&&<del className="product-original-price">{money(product.original_price)}</del>}</span></div><div className="swatches" aria-label={t("Available colors")}>{colors.map(([color, hex]) => <span key={color} style={{
        background: hex
      }} title={t(color)} />)}<span className="color-count">{colors.length} {colors.length === 1 ? t('color') : t('colors')}</span></div></article>;
}
