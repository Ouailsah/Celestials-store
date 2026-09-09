'use client';

import { useLanguage } from '@/components/i18n';

/** One delivery policy shared by product accordions and Contact. */
export function DeliveryInformation() {
  const { t } = useLanguage();
  return <p>{t('For an actual purchase, confirm delivery availability, charges and timing directly with the brand. This concept does not establish official shipping terms.')}</p>;
}

/** Shared by every product; delivery information never comes from product data. */
export function ProductDelivery() {
  const { t } = useLanguage();
  return <details className="product-delivery">
    <summary>{t('DELIVERY')}</summary>
    <DeliveryInformation />
  </details>;
}
