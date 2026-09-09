import { getTranslator } from '@/lib/i18n/server';
import Link from 'next/link';
export default async function NotFound() {
  const t = await getTranslator();
  return <section className="page-shell empty-state"><span className="eyebrow">{t("404 / OFF THE BEATEN PATH")}</span><h2 style={{
      marginTop: 20
    }}>{t("A different direction.")}</h2><p>{t("This page isn’t part of the collection. Let’s get you back to the good pieces.")}</p><Link href="/shop" className="button button-dark">{t("EXPLORE THE COLLECTION")}</Link></section>;
}
