import { getTranslator } from '@/lib/i18n/server';
export default async function Loading() {
  const t = await getTranslator();
  return <div className="loading" role="status">{t("A moment for something good…")}</div>;
}
