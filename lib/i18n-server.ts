import { cookies } from 'next/headers';
import { defaultLocale, getT, LOCALE_COOKIE_NAME, type Locale } from './i18n';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  if (value === 'es' || value === 'en') return value;
  return defaultLocale;
}

export async function getServerT() {
  const locale = await getLocale();
  return getT(locale);
}
