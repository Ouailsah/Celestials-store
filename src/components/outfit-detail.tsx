'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Truck, ShieldCheck } from 'lucide-react';
import type { Product } from '@/lib/types';
import { bundleKey, reservedQuantity } from '@/lib/cart';
import { isSakura, isSakuraJeans, sakuraSizeChart, jeansSizeChart } from '@/lib/product-content';
import { useLanguage } from './i18n';
import { useCart } from './cart-provider';
import { ProductDelivery } from './product-delivery';
export function OutfitDetail({ product: p }: { product: Product }) {
  const { t } = useLanguage();
  const { items, add } = useCart();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [image,setImage]=useState(0);
  const outfit = p.outfit!;
  const variants = outfit.components.map(c => c.product.product_variants.find(v => v.id === selected[c.product_id]));
  const complete = variants.every(v => !!v);
  const key = complete ? bundleKey(p.id, variants.map(v => v!.id)) : '';
  const available = complete && (items.find(i => i.variantId === key)?.quantity || 0) < 10 && variants.every(v => v!.stock > reservedQuantity(items, v!.id));
  function addOutfit() {
    if (!available) return;
    const components = outfit.components.map((c, index) => ({ variantId: variants[index]!.id, productId: c.product_id, name: c.product.name, size: variants[index]!.size, color: variants[index]!.color, stock: variants[index]!.stock }));
    add({ variantId: key, productId: p.id, slug: p.slug, name: p.name, image: p.images[0], size: components.map(c => `${c.name}: ${c.size}`).join(' / '), color: '', price: p.price, quantity: 1, stock: Math.min(...components.map(c => c.stock)), components });
    setMessage('Added to your bag.');
  }
  return <section className="page-shell cursed-shirt outfit-detail"><div className="breadcrumbs"><Link href="/shop?category=Outfits">{t('OUTFITS')}</Link><span>/</span><span>{p.name}</span></div><div className="product-detail">
    <div className="gallery"><div className="gallery-main"><img src={p.images[image]} alt={p.name} /></div>{p.images.length>1&&<div className="gallery-thumbs">{p.images.map((src,i)=><button key={src} onClick={()=>setImage(i)} className={image===i?'selected':''} aria-pressed={image===i} aria-label={t("Show image {number}",{number:i+1})}><img src={src} alt={`${p.name} ${i+1}`}/></button>)}</div>}</div>
    <div className="product-detail-info"><span className="eyebrow">CELESTIALS / {t('OUTFITS')}</span><h1>{p.name}</h1><div className="detail-price">{p.price.toLocaleString('en-DZ')} DA {outfit.original_price>p.price&&<del>{outfit.original_price.toLocaleString('en-DZ')} DA</del>}</div><p className="product-description">{t(p.description)}</p>
      {outfit.components.map((c, index) => {
        const product = c.product;
        const guide = c.size_guide || (product.size_guide!==undefined ? product.size_guide : (isSakura(product.slug) ? { image: sakuraSizeChart, alt: 'Sakura size chart: S, M-L, XL. A: 60, 62, 65. B: 60, 63, 65. C: 73, 74, 76.' } : isSakuraJeans(product.slug) ? { image: jeansSizeChart, alt: 'Sakura Jeans size chart. S: length 110, waist 40, thighs 34. M-L: length 113, waist 42, thighs 36.' } : undefined));
        const multipleColors = new Set(product.product_variants.map(v => v.color)).size > 1;
        return <div className="outfit-component variant-block" key={product.id} role="group" aria-label={product.name}>
          <div className="outfit-component-heading"><img src={c.thumbnail || product.images[0]} alt={product.name} /><div><span className="eyebrow">{t('PIECE {number}', { number: index + 1 })}</span><h2><Link href={`/product/${product.slug}`}>{product.name}</Link></h2></div></div>
          <div className="field-heading">{t('SELECT SIZE')}</div><div className="size-options">{product.product_variants.map(v => <button key={v.id} disabled={v.stock <= reservedQuantity(items, v.id)} aria-pressed={selected[product.id] === v.id} className={selected[product.id] === v.id ? 'selected' : ''} onClick={() => { setSelected(prev => ({ ...prev, [product.id]: v.id })); setMessage(''); }}>{v.size}{multipleColors ? ` / ${t(v.color)}` : ''}</button>)}</div>
          <details><summary>{t('SIZE GUIDE')} — {product.name}</summary><p>{[...new Set(product.product_variants.map(v => v.size))].join(' / ')}</p>{guide ? <img className="product-size-chart" src={guide.image} alt={t(guide.alt)} loading="lazy" /> : null}</details>
        </div>;
      })}
      <p className="stock-note">{!complete ? t('Select a size for both pieces.') : !available ? t('You have reached the available quantity for this variant.') : t('In stock — ready for your rotation')}</p>
      <button className="button button-dark outfit-add" disabled={!available} onClick={addOutfit}>{t('ADD TO BAG')}<ArrowUpRight size={18} /></button>
      <div role="status" className="cart-feedback">{t(message)}{message && <Link href="/cart">{t('VIEW BAG')}<ArrowUpRight size={14} /></Link>}</div>
      <div className="product-promises"><span><Truck size={17} />{t('Delivery across Algeria')}</span><span><ShieldCheck size={17} />{t('Pay cash on delivery')}</span></div>
      <details open><summary>{t('DESCRIPTION')}</summary><p>{t(p.description)}</p></details><ProductDelivery /><details><summary>{t('SECURE PAYMENT')}</summary><p>{t('Pay cash on delivery')}</p></details>
    </div>
  </div></section>;
}
