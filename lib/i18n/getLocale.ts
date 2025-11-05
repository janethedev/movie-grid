import { headers, cookies } from 'next/headers';
import { defaultLocale, type Locale, locales } from './locales';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Server-side function to get the current locale from middleware-injected headers or cookies
 */
export async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const cookieStore = await cookies();
  
  // Try to get locale from custom header set by middleware
  const headerLocale = headersList.get('x-locale');
  if (headerLocale && locales.includes(headerLocale as Locale)) {
    return headerLocale as Locale;
  }
  
  // Fallback to cookie
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }
  
  return defaultLocale;
}

