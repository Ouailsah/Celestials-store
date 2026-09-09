'use client';

import { useLanguage } from '@/components/i18n';
import Link from 'next/link';
import { ArrowUpRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { capacityFor } from '@/lib/cart';
import { FREE_SHIPPING, money, shippingFor } from '@/lib/types';
export default function CartPage() {
  const {
    t
  } = useLanguage();
  const {
    items,
    ready,
    count,
    update,
    remove
  } = useCart();
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  return <section className="page-shell"><div className="page-intro"><span className="eyebrow">{t("GOOD CHOICES. GREAT ROTATION.")}</span><h1>{t("Your bag")}<span style={{
          fontSize: 20,
          verticalAlign: 'super',
          marginInlineStart: 12,
          color: '#848979'
        }}>({count})</span></h1></div>{!ready ? <p className="loading">{t("Opening your bag…")}</p> : !items.length ? <div className="empty-state"><ShoppingBag size={35} strokeWidth={1} /><h2>{t("A little room for something good.")}</h2><p>{t("Your bag is empty. Discover considered essentials made for your everyday.")}</p><Link href="/shop" className="button button-dark">{t("EXPLORE THE COLLECTION ")}<ArrowUpRight size={17} /></Link></div> : <div className="cart-layout"><div>{items.map(i => <article className="cart-item" key={i.variantId}><img src={i.image} alt={t(i.name)} /><div><h2><Link href={`/product/${i.slug}`}>{i.name}</Link></h2>{i.components ? i.components.map(c => <p key={c.variantId}>{c.name} / {c.size} / {t(c.color)}</p>) : <p>{t(i.color)} / {i.size}</p>}<div className="quantity-control"><button aria-label={t("Decrease {name} quantity", {name: i.name})} disabled={i.quantity <= 1} onClick={() => update(i.variantId, i.quantity - 1)}><Minus size={13} /></button><span>{i.quantity}</span><button aria-label={t("Increase {name} quantity", {name: i.name})} disabled={i.quantity >= capacityFor(items, i)} onClick={() => update(i.variantId, i.quantity + 1)}><Plus size={13} /></button></div></div><div className="cart-item-end"><span>{money(i.price * i.quantity)}</span><button aria-label={t("Remove {name}, {color}, {size}", {name: i.name, color: t(i.color), size: i.size})} onClick={() => remove(i.variantId)}>{t("Remove")}</button></div></article>)}<Link href="/shop" className="text-link" style={{
          marginTop: 25
        }}>{t("CONTINUE EXPLORING ")}<ArrowUpRight size={16} /></Link></div><aside className="order-summary"><h2>{t("The overview")}</h2><div className="shipping-note">{subtotal >= FREE_SHIPPING ? t('Your order qualifies for complimentary delivery.') : t("You’re {amount} away from free delivery.", {amount: money(FREE_SHIPPING - subtotal)})}<div className="shipping-progress"><span style={{
              width: `${subtotal / FREE_SHIPPING * 100}%`
            }} /></div></div><div className="summary-row"><span>{t("Subtotal")}</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>{t("Delivery")}</span><span>{shipping ? money(shipping) : t('Complimentary')}</span></div><div className="summary-row summary-total"><span>{t("Total")}</span><span>{money(subtotal + shipping)}</span></div><Link href="/checkout" className="button button-dark">{t("CONTINUE TO CHECKOUT ")}<ArrowUpRight size={18} /></Link><p className="summary-note">{t("Pay cash when your order arrives.")}<br />{t("Final availability and prices are checked at checkout.")}</p></aside></div>}</section>;
}
