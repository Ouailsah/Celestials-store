import 'server-only';
import { cookies } from 'next/headers';
import { isLocale, localeCookie, translate } from './index';
export async function getLocale() {
  const value = (await cookies()).get(localeCookie)?.value;
  return isLocale(value) ? value : 'en';
}
export async function getTranslator() {
  const locale = await getLocale();
  return (source: string, values?: Record<string, string | number>) => translate(locale, source, values);
}
