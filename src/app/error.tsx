'use client';

import { useLanguage } from '@/components/i18n';
export default function ErrorPage({
  reset
}: {
  reset: () => void;
}) {
  const {
    t
  } = useLanguage();
  return <section className="page-shell empty-state"><h2>{t("A moment, please.")}</h2><p>{t("We couldn’t load this page. Please try again.")}</p><button className="button button-dark" onClick={reset}>{t("TRY AGAIN")}</button></section>;
}
