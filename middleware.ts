import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, normalizeLocale, Locale } from './lib/i18n/locales';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore next internal assets and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/tmdb-image') || // Explicitly ignore TMDB image rewrite path
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  // Handle old locale paths (e.g., /zh-CN, /en) - redirect to root
  const pathLocale = pathname.split('/')[1];
  if (locales.includes(pathLocale as Locale)) {
    const url = request.nextUrl.clone();
    // Extract the locale and remove it from the path
    const restPath = pathname.replace(`/${pathLocale}`, '') || '/';
    url.pathname = restPath;
    
    // Set a temporary redirect (307) instead of permanent (308) to avoid browser caching
    const response = NextResponse.redirect(url, 307);
    
    // Set the detected locale in cookie
    response.cookies.set(LOCALE_COOKIE, pathLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    
    return response;
  }

  // Determine locale from cookie or Accept-Language
  let finalLocale = request.cookies.get(LOCALE_COOKIE)?.value as Locale;
  if (!finalLocale || !locales.includes(finalLocale)) {
    const accept = request.headers.get('accept-language') || '';
    const lang = accept.split(',')[0] || '';
    finalLocale = normalizeLocale(lang);
  }

  // Pass the locale via header and cookie
  const response = NextResponse.next();
  
  // Set custom header for server components to read
  response.headers.set('x-locale', finalLocale);
  
  // Signal language-based variations for caches and crawlers
  response.headers.set('Vary', 'Accept-Language');
  
  // Set/update the locale cookie
  response.cookies.set(LOCALE_COOKIE, finalLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - assets (static assets)
     * - tmdb-image (image proxy rewrites)
     * - files with extensions (e.g. favicon.ico)
     */
    '/((?!api|_next/|assets|tmdb-image|.*\\..*).*)',
  ],
};
