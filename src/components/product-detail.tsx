'use client';

import { isSakuraJeans, jeansSizeChart, isNavyShirt, isCursedShirt, isSakura, hasCampaignDetails, sakuraSizeChart, shirtCardDescription } from '@/lib/product-content';
import { storefrontCategory } from '@/lib/categories';
import { ProductDelivery } from './product-delivery';
import { useLanguage } from '@/components/i18n';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Minus, Plus, Truck, ShieldCheck } from 'lucide-react';
import { type Product, money } from '@/lib/types';
import { reservedQuantity } from '@/lib/cart';
import { useCart } from './cart-provider';
export function ProductDetail({
  product: p
}: {
  product: Product;
}) {
  const {
    t
  } = useLanguage();
  const {
    add,
    items
  } = useCart();
  const [color, setColor] = useState(p.product_variants[0]?.color || '');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const [message, setMessage] = useState('');
  const colors = [...new Map(p.product_variants.map(v => [v.color, v.color_hex])).entries()];
  const variant = p.product_variants.find(v => v.color === color && v.size === size);
  const inCart = reservedQuantity(items, variant?.id || '');
  const available = Math.max(0, Math.min(variant?.stock || 0, 10) - inCart);
  function addToBag() {
    if (!variant) {
      setMessage('Select a size to find your fit.');
      return;
    }
    if (available < quantity) {
      setMessage('You have reached the available quantity for this variant.');
      return;
    }
    add({
      variantId: variant.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0],
      size,
      color,
      price: p.price,
      quantity,
      stock: variant.stock
    });
    setMessage('Added to your bag.');
  }
  return <section className={`page-shell${(hasCampaignDetails(p.slug) || !!p.size_guide) ? ' cursed-shirt' : ''}`}><div className="breadcrumbs"><Link href="/shop">{t("THE COLLECTION")}</Link><span>/</span><span>{p.name.toUpperCase()}</span></div><div className="product-detail"><div className="gallery"><div className="gallery-main"><img src={p.images[image]} alt={t("{name} — view {number}", {name: p.name, number: image + 1})} />{p.badge && <span className="product-badge">{t(p.badge)}</span>}<span className="gallery-index">0{image + 1} / 0{p.images.length}</span></div><div className="gallery-thumbs">{p.images.map((src, i) => <button key={src} onClick={() => setImage(i)} className={image === i ? 'selected' : ''} aria-label={t("Show image {number}", {number: i + 1})} aria-pressed={image === i}><img src={src} alt={t("{name} thumbnail {number}", {name: p.name, number: i + 1})} /></button>)}</div></div><div className="product-detail-info"><span className="eyebrow">{t("CELESTIALS / ")}{t(storefrontCategory(p.category).toUpperCase())}</span><h1>{(isCursedShirt(p.slug) || isNavyShirt(p.slug) || isSakuraJeans(p.slug)) ? p.name.toUpperCase() : p.name}</h1><div className="detail-price">{(isNavyShirt(p.slug) || isCursedShirt(p.slug)) ? `${p.price.toLocaleString('en-DZ')} DA` : money(p.price)}{p.original_price!=null&&p.original_price>p.price&&<del>{money(p.original_price)}</del>}<span>{t("ALL TAXES INCLUDED")}</span></div><p className="product-description">{t(p.slug === 'serpent-hunter-bootcut' ? 'Bootcut fit' : isSakuraJeans(p.slug) ? 'Wide / relaxed fit' : isNavyShirt(p.slug) ? 'Slim fit' : isCursedShirt(p.slug) ? shirtCardDescription : isSakura(p.slug) ? 'Relaxed / oversized fit' : p.description)}</p><div className="variant-block"><span className="field-heading">{t("COLOR ")}<span>{t(color)}</span></span><div className="color-options">{colors.map(([c, hex]) => <button key={c} aria-label={t(c)} aria-pressed={c === color} className={c === color ? 'selected' : ''} style={{
              background: hex
            }} onClick={() => {
              setColor(c);
              setSize('');
              setQuantity(1);
              setMessage('');
            }} />)}</div></div><div className="variant-block"><div className="field-heading">{t("SELECT SIZE")}<Link href="/contact#sizing">{t("Size guide ↗")}</Link></div><div className="size-options">{p.product_variants.filter(v => v.color === color).map(v => <button key={v.id} disabled={v.stock === 0} aria-pressed={size === v.size} className={size === v.size ? 'selected' : ''} onClick={() => {
              setSize(v.size);
              setQuantity(1);
              setMessage('');
            }}>{v.size}</button>)}</div><p className="stock-note">{variant ? variant.stock ? <><span className="stock-dot" />{t(" In stock — ready for your rotation")}</> : t('Currently out of stock') : t(p.slug === 'serpent-hunter-bootcut' ? 'Bootcut fit' : isSakuraJeans(p.slug) ? 'Wide / relaxed fit' : isNavyShirt(p.slug) ? 'Slim fit' : 'Relaxed, oversized fit. Choose your usual size.')}</p></div><div className="add-row"><div className="quantity-control"><button aria-label={t("Decrease quantity")} disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}><Minus size={14} /></button><span>{quantity}</span><button aria-label={t("Increase quantity")} disabled={!variant || quantity >= available} onClick={() => setQuantity(q => q + 1)}><Plus size={14} /></button></div><button className="button button-dark" onClick={addToBag} disabled={Boolean(variant && available === 0)}>{variant && available === 0 ? t('LIMIT REACHED') : t('ADD TO BAG')}<ArrowUpRight size={18} /></button></div><div className="cart-feedback" role="status">{t(message)}{message === 'Added to your bag.' && <Link href="/cart">{t("VIEW BAG ")}<ArrowUpRight size={14} /></Link>}</div><div className="product-promises"><span><Truck size={17} />{t(" Delivery across Algeria")}</span><span><ShieldCheck size={17} />{t(" Pay cash on delivery")}</span></div>{<><details><summary>{t("SIZE GUIDE")}</summary><p>{t(p.slug === 'serpent-hunter-bootcut' ? 'Bootcut fit' : isSakuraJeans(p.slug) ? "Wide / relaxed fit" : isNavyShirt(p.slug) ? "Slim fit" : isSakura(p.slug) ? "Relaxed / oversized fit" : "Oversized / relaxed fit")} / {[...new Set(p.product_variants.map(v => v.size))].join(' / ')}</p>{p.size_guide && <img className="product-size-chart" src={p.size_guide.image} alt={t(p.size_guide.alt)} loading="lazy" />}{p.size_guide===undefined && isSakuraJeans(p.slug) && <img className="product-size-chart" src={jeansSizeChart} alt={t("Sakura Jeans size chart. S: length 110, waist 40, thighs 34. M-L: length 113, waist 42, thighs 36.")} loading="lazy" />}{p.size_guide===undefined && isSakura(p.slug) && <img className="product-size-chart" src={sakuraSizeChart} alt={t("Sakura size chart: S, M-L, XL. A: 60, 62, 65. B: 60, 63, 65. C: 73, 74, 76.")} loading="lazy" />}</details><details open><summary>{t("DESCRIPTION")}</summary><p>{t(p.description)}</p></details><ProductDelivery /><details><summary>{t("SECURE PAYMENT")}</summary><p>{t("Pay cash on delivery")}</p></details></>}</div></div></section>;
}
