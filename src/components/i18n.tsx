'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { localeCookie, translate, type Locale } from '@/lib/i18n';

const LanguageContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: 'en', setLocale: () => {} });
export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale);
  const router = useRouter();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  function setLocale(next: Locale) {
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    updateLocale(next);
    router.refresh();
  }
  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: (text: string, values?: Record<string, string | number>) => translate(context.locale, text, values) };
}
export function T({ text, values }: { text: string | number | null | undefined; values?: Record<string, string | number> }) {
  const { t } = useLanguage();
  return <>{typeof text === 'string' ? t(text, values) : text}</>;
}
export function StoreMain({ children }: { children: ReactNode }) {
  const admin = usePathname().startsWith('/admin');
  const { locale } = useLanguage();
  return <main id="main" dir={admin ? 'ltr' : locale === 'ar' ? 'rtl' : 'ltr'} lang={admin ? 'en' : locale} className={admin ? 'admin-content' : 'storefront'}>{children}</main>;
}
