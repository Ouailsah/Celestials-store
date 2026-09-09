import { translations } from './messages';

export type Locale = 'en' | 'fr' | 'ar';
export const localeCookie = 'celestials-language';
export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'fr' || value === 'ar';
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();
const dictionary = new Map(translations.map(([en, fr, ar]) => [normalize(en), { fr, ar }]));

/** English source keys keep the default copy readable; values never change catalog IDs. */
export function translate(locale: Locale, source: string, values: Record<string, string | number> = {}) {
  let result = source;
  if (locale !== 'en') {
    const found = dictionary.get(normalize(source));
    if (found) {
      result = found[locale];
      if (locale === 'fr' && /[A-Z]/.test(source) && source === source.toUpperCase()) result = result.toLocaleUpperCase('fr');
      result = (source.match(/^\s*/)?.[0] || '') + result + (source.match(/\s*$/)?.[0] || '');
    } else if (/^(Too (small|big):|Invalid (input|option|UUID|string)|Failed to fetch)/.test(source)) {
      result = locale === 'fr' ? 'Vérifiez les informations saisies et réessayez.' : 'تحقق من المعلومات المدخلة وحاول مجددًا.';
    }
  }
  return result.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
