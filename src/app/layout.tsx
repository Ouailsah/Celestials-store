import type { Metadata } from 'next';
import { CartProvider } from '@/components/cart-provider';
import { Header, Footer } from '@/components/chrome';
import { LanguageProvider, StoreMain, T } from '@/components/i18n';
import { getLocale } from '@/lib/i18n/server';
import { StorefrontMotion } from '@/components/storefront-motion';
import './globals.css';
export const metadata: Metadata = { title: { default: 'CELESTIALS — Above the ordinary', template: '%s | CELESTIALS' }, description: 'Considered streetwear. Independent spirit. Discover premium everyday essentials from CELESTIALS. Cash on delivery across Algeria.' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body><LanguageProvider initialLocale={locale}><CartProvider><StorefrontMotion /><a href="#main" className="skip-link"><T text="Skip to content" /></a><Header /><StoreMain>{children}</StoreMain><Footer /></CartProvider></LanguageProvider></body></html>;
}
