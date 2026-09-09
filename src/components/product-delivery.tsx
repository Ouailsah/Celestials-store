'use client';

import { useLanguage } from '@/components/i18n';

/** One delivery policy shared by product accordions and Contact. */
export function DeliveryInformation() {
  const { t } = useLanguage();
  return <p>{t('Algeria-wide shipping via Zr Express')}<br /><br />
    {t('Home delivery: 500 - 1,600 DA depending on wilaya')}<br />
    {t('Stop desk: 370 - 1,120 DA depending on wilaya')}<br />
    {t('Delivery time: 2-5 business days')}
  </p>;
}

/** Shared by every product; delivery information never comes from product data. */
export function ProductDelivery() {
  const { t } = useLanguage();
  return <details className="product-delivery">
    <summary>{t('DELIVERY')}</summary>
    <DeliveryInformation />
  </details>;
}
