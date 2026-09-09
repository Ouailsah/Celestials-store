'use client';

import { useLanguage } from '@/components/i18n';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { storefrontCategories, storefrontCategory } from '@/lib/categories';
import { categoryQuery, filterShopProducts } from '@/lib/shop-filters';
import { useMotionPresence } from './storefront-motion';
import { ProductCard } from './product-card';
import type { Product } from '@/lib/types';
export function Shop({
  products
}: {
  products: Product[];
}) {
  const {
    t
  } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState(false);
  const filtersPresent = useMotionPresence(filters);
  const priceLimit = Math.max(20000, ...products.map(p => Math.ceil(p.price / 100) * 100));
  const requestedMax = Number(params.get('max'));
  const category = storefrontCategory(params.get('category') || 'All pieces'),
    query = params.get('search') || '',
    edit = params.get('edit') || '',
    size = params.get('size') || '',
    color = params.get('color') || '',
    sort = params.get('sort') || 'featured',
    max = params.get('max') && Number.isFinite(requestedMax) && requestedMax >= 0 ? requestedMax : priceLimit;
  function set(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);else next.delete(key);
    window.history.replaceState(null, '', `/shop?${next.toString()}`);
  }
  const visible = filterShopProducts(products, new URLSearchParams(params.toString()));
  function selectCategory(selected: string) {
    const next = categoryQuery(new URLSearchParams(window.location.search), selected);
    window.history.pushState(null, '', next.size ? `/shop?${next}` : '/shop');
  }
  return <section className="page-shell shop-page"><div className="page-intro"><span className="eyebrow">{t("THE CELESTIALS WARDROBE")}</span><h1>{edit === 'new' ? t('Fresh perspectives.') : edit === 'best' ? t('On heavy rotation.') : t('The collection.')}</h1><p>{t("Considered pieces. Endless possibilities. Find your everyday uniform.")}</p></div><div className="shop-tools"><label className="search-field"><Search size={18} /><input aria-label={t("Search products")} placeholder={t("Find your next essential…")} value={query} onChange={e => set('search', e.target.value)} autoFocus={params.has('search')} />{query && <button onClick={() => set('search', '')} aria-label={t("Clear search")}><X size={16} /></button>}</label><button className="filter-button" onClick={() => setFilters(!filters)} aria-expanded={filters}><SlidersHorizontal size={16} />{t(" Filters")}</button><select aria-label={t("Sort products")} value={sort} onChange={e => set('sort', e.target.value)}><option value="featured">{t("Featured")}</option><option value="price-asc">{t("Price: low to high")}</option><option value="price-desc">{t("Price: high to low")}</option></select></div>{filtersPresent && <div data-motion-state={filters ? 'open' : 'closed'} inert={!filters} aria-hidden={!filters} className="filter-panel"><label>{t("Size")}<select aria-label={t("Size")} value={size} onChange={e => set('size', e.target.value)}><option value="">{t("All sizes")}</option>{[...new Set(products.flatMap(p => p.product_variants.map(v => v.size)))].map(s => <option key={s} value={s}>{s}</option>)}</select></label><label>{t("Color")}<select aria-label={t("Color")} value={color} onChange={e => set('color', e.target.value)}><option value="">{t("All colors")}</option>{[...new Set(products.flatMap(p => p.product_variants.map(v => v.color)))].map(c => <option key={c} value={c}>{t(c)}</option>)}</select></label><label>{t("Maximum price: ")}{max.toLocaleString()}{t(" DZD")}<input type="range" min="0" max={Math.max(priceLimit,max)} step="100" value={max} onChange={e => set('max', e.target.value)} /></label><label className="check-label"><input type="checkbox" checked={params.has('stock')} onChange={e => set('stock', e.target.checked ? '1' : '')} />{t(" In stock only")}</label><button className="text-link" onClick={() => router.replace('/shop', {
        scroll: false
      })}>{t("RESET FILTERS ")}<X size={14} /></button></div>}<div className="collection-tabs shop-tabs">{storefrontCategories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => selectCategory(c)}>{t(c)}</button>)}<span className="collection-note">{visible.length}{t(" PIECES")}</span></div>{visible.length ? <div className="product-grid">{visible.map(p => <ProductCard key={p.id} product={p} />)}</div> : <div className="empty-state"><h2>{t("No pieces found.")}</h2><p>{t("Try a different search or give your filters a little room.")}</p><button className="button button-dark" onClick={() => router.replace('/shop')}>{t("RESET FILTERS")}</button></div>}</section>;
}
