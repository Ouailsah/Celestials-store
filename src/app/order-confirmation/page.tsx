import { getTranslator } from '@/lib/i18n/server';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Check, ArrowUpRight } from 'lucide-react';
import { money } from '@/lib/types';
export const metadata = {
  title: 'Order confirmation',
  robots: {
    index: false,
    follow: false
  }
};
export default async function ConfirmationPage() {
  const t = await getTranslator();
  let receipt: {
    reference: string;
    total: number;
    expires: number;
  } | null = null;
  try {
    const raw = (await cookies()).get('celestials-receipt')?.value;
    if (raw && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const [encoded, signature] = raw.split('.');
      const expected = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update(encoded).digest('base64url');
      if (signature?.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString());
        if (parsed.expires > Date.now()) receipt = parsed;
      }
    }
  } catch {/* Unverified receipts never show an order confirmation. */}
  return <section className="page-shell"><div className="confirmation">{receipt ? <><div className="confirmation-icon"><Check size={28} strokeWidth={1.4} /></div><span className="eyebrow">{t("GOOD THINGS ARE ON THEIR WAY.")}</span><h1>{t("You’re in")}<br />{t("good company.")}</h1><p>{t("Thank you for choosing CELESTIALS. Your order has been received.")}<br />{t("Our team will call you to confirm the details before dispatch.")}</p><div className="confirmation-box"><div className="summary-row"><span>{t("Order reference")}</span><strong>{receipt.reference}</strong></div><div className="summary-row"><span>{t("Payment")}</span><span>{t("Cash on delivery")}</span></div><div className="summary-row"><span>{t("Total due on delivery")}</span><strong>{money(receipt.total)}</strong></div><div className="summary-row"><span>{t("Status")}</span><span>{t("Awaiting confirmation")}</span></div></div></> : <><span className="eyebrow">{t("CELESTIALS / ORDERS")}</span><h1>{t("Your next chapter.")}</h1><p>{t("No recent order confirmation is available in this browser. If you’ve already ordered, our team will contact you on the phone number you provided.")}</p><div style={{
          height: 30
        }} /></>}<div className="confirmation-actions"><Link className="button button-dark" href="/shop">{t("KEEP EXPLORING ")}<ArrowUpRight size={17} /></Link><Link className="button button-outline" href="/contact">{t("CONTACT THE TEAM")}</Link></div></div></section>;
}
