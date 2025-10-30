import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, normalizeLocale } from './lib/i18n/locales';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore next internal assets and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // If path already includes a supported locale, continue
  const pathLocale = pathname.split('/')[1];
  console.log('[Middleware] Raw pathLocale:', pathLocale);
  console.log('[Middleware] Is valid locale?', locales.includes(pathLocale as any));
  
  if (locales.includes(pathLocale as any)) {
    return NextResponse.next();
  }
  // Try to normalize the pathLocale in case it has extra characters
  const normalizedPathLocale = normalizeLocale(pathLocale);
  console.log('[Middleware] Normalized pathLocale:', normalizedPathLocale);
  if (locales.includes(normalizedPathLocale)) {
    console.log('[Middleware] Found valid locale after normalization, redirecting to clean path');
    // Redirect to clean locale path
    const cleanPath = pathname.replace(`/${pathLocale}`, `/${normalizedPathLocale}`);
    return NextResponse.redirect(new URL(cleanPath, request.url), 308);
  }

  // Determine locale from cookie or Accept-Language
  let finalLocale = request.cookies.get(LOCALE_COOKIE)?.value as any;
  if (!finalLocale || !locales.includes(finalLocale)) {
    const accept = request.headers.get('accept-language') || '';
    const lang = accept.split(',')[0] || '';
    finalLocale = normalizeLocale(lang);
  }

  const target = pathname === '/' ? `/${finalLocale}` : `/${finalLocale}${pathname}`;
  const response = NextResponse.redirect(new URL(target, request.url), 308);
  // Signal language-based variations for caches and crawlers
  response.headers.set('Vary', 'Accept-Language');
  response.cookies.set(LOCALE_COOKIE, finalLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: [
    // Match all paths except those starting with a locale, Next internals, or file extensions
    '/((?!_next/|api/|assets/|.*\..*).*)',
  ],
};
