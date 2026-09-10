import { getTranslator } from '@/lib/i18n/server';
import { BrandMark } from '@/components/brand-mark';
export default async function Loading() {
  const t = await getTranslator();
  return <div className="loading" role="status"><BrandMark className="loading-brand-mark" /><span>{t("A moment for something good…")}</span></div>;
}
