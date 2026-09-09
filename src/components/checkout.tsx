'use client';

import { useLanguage } from '@/components/i18n';
import { localizeValidation } from '@/lib/i18n/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Banknote } from 'lucide-react';
import { useCart } from './cart-provider';
import { orderLine } from '@/lib/cart';
import { checkoutAttempt, clearCheckoutAttempt } from '@/lib/checkout-attempt';
import { money, shippingFor } from '@/lib/types';
import { orderSchema, wilayas } from '@/lib/validation';
export function Checkout({
  connected
}: {
  connected: boolean;
}) {
  const {
    t
  } = useLanguage();
  const {
    items,
    ready,
    clear
  } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = useRef('');
  const submitted = useRef(false);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return;
    setError('');
    const form = new FormData(event.currentTarget);
    let attemptStorage:Storage|null=null;
    try {attemptStorage=window.sessionStorage;}catch{/* Private storage may be unavailable. */}
    if (!key.current) key.current = checkoutAttempt(attemptStorage,items.map(orderLine));
    const payload = {
      ...Object.fromEntries(form),
      idempotencyKey: key.current,
      items: items.map(orderLine)
    };
    const validated = orderSchema.safeParse(payload);
    if (!validated.success) {
      setError(validated.error.issues[0].message);
      return;
    }
    submitted.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validated.data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We could not place your order. Please try again.');
      clearCheckoutAttempt(attemptStorage);
      clear();
      router.push(`/order-confirmation?ref=${encodeURIComponent(result.reference)}&total=${result.total}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      submitted.current = false;
      setBusy(false);
    }
  }
  if (!ready) return <div className="loading">{t("Preparing checkout…")}</div>;
  if (!items.length && !busy) return <section className="page-shell empty-state"><h2>{t("Your bag is waiting.")}</h2><p>{t("Add a piece from the collection to start your order.")}</p><Link className="button button-dark" href="/shop">{t("EXPLORE THE COLLECTION ")}<ArrowUpRight size={17} /></Link></section>;
  return <section className="page-shell"><div className="breadcrumbs"><Link href="/cart">{t("YOUR BAG")}</Link><span>/</span><span>{t("CHECKOUT")}</span></div><div className="page-intro"><span className="eyebrow">{t("ONE STEP CLOSER TO YOUR EVERYDAY.")}</span><h1>{t("Make it yours.")}</h1></div>{!connected && <div className="alert">{t("The store is being prepared. Orders will open once our Supabase connection is configured. You can explore checkout, but no order can be submitted yet.")}</div>}<form onSubmit={submit} onInvalid={event => localizeValidation(event.target as HTMLInputElement, t)} onInput={event => (event.target as HTMLInputElement).setCustomValidity?.('')} className="checkout-layout"><div className="checkout-form"><section className="checkout-section"><h2>{t("01 / Your details")}</h2><div className="form-grid"><label className="form-field">{t("FULL NAME")}<input name="name" dir="auto" autoComplete="name" required minLength={3} maxLength={100} placeholder={t("Your first and last name")} /></label><label className="form-field">{t("PHONE NUMBER")}<input name="phone" type="tel" dir="ltr" autoComplete="tel" required placeholder={t("0555 123 456")} maxLength={25} /><small>{t("We’ll call to confirm your order.")}</small></label></div></section><section className="checkout-section"><h2>{t("02 / Where to?")}</h2><div className="form-grid"><label className="form-field">{t("WILAYA")}<select aria-label={t("WILAYA")} name="wilaya" dir="ltr" autoComplete="address-level1" required defaultValue=""><option value="" disabled>{t("Select your wilaya")}</option>{wilayas.map(w => <option key={w} value={w}>{w}</option>)}</select></label><label className="form-field">{t("COMMUNE")}<input name="commune" dir="auto" autoComplete="address-level2" required minLength={2} maxLength={100} placeholder={t("Your commune")} /></label><label className="form-field full">{t("DELIVERY ADDRESS")}<textarea name="address" dir="auto" autoComplete="street-address" required minLength={8} maxLength={300} placeholder={t("Street, building, floor, and a nearby landmark")} /></label><label className="form-field full">{t("ORDER NOTE (OPTIONAL)")}<input name="notes" dir="auto" maxLength={500} placeholder={t("Anything that helps us find you")} /></label></div><div hidden aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div></section><section className="checkout-section"><h2>{t("03 / Payment")}</h2><div className="payment-choice"><Banknote size={25} strokeWidth={1.3} /><div><span>{t("Cash on delivery")}</span><small>{t("No payment now. Pay the courier when your order arrives.")}</small></div></div></section><p className="summary-note" style={{
          textAlign: 'start'
        }}>{t("Your details are used to fulfil and confirm your order. Our team will contact you by phone. Please review our ")}<Link href="/contact#delivery" style={{
            textDecoration: 'underline'
          }}>{t("delivery information")}</Link>{t(" before ordering.")}</p></div><aside className="order-summary"><h2>{t("Your selection")}</h2>{items.map(i => <div className="summary-product" key={i.variantId}><img src={i.image} alt={t(i.name)} /><div><h3>{i.name}</h3>{i.components?.map(c => <p key={c.variantId}>{c.name} / {c.size} / {t(c.color)}</p>)}<p>{!i.components && <>{t(i.color)} / {i.size}</>}{t(" · Qty ")}{i.quantity}</p></div><span>{money(i.price * i.quantity)}</span></div>)}<div className="summary-row"><span>{t("Subtotal")}</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>{t("Delivery")}</span><span>{shipping ? money(shipping) : t('Complimentary')}</span></div><div className="summary-row summary-total"><span>{t("Total due on delivery")}</span><span>{money(subtotal + shipping)}</span></div>{error && <div className="alert error" role="alert">{t(error)}</div>}<button className="button button-dark" type="submit" disabled={busy || !connected}>{busy ? t('PLACING YOUR ORDER…') : t('PLACE MY ORDER')}<ArrowUpRight size={18} /></button><p className="summary-note">{!connected ? t('Ordering opens when the store is connected.') : t('Secure checkout. No card details required.')}</p></aside></form></section>;
}
