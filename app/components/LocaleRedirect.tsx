"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SUPPORTED_LOCALES = ['zh-CN', 'en'];

/**
 * Client-side component to handle legacy locale paths
 * Redirects /zh-CN/* or /en/* to /* and preserves the locale in cookie
 */
export function LocaleRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if pathname starts with a locale
    const firstSegment = pathname.split('/')[1];
    
    if (SUPPORTED_LOCALES.includes(firstSegment)) {
      // Extract the rest of the path after the locale
      const newPath = pathname.replace(`/${firstSegment}`, '') || '/';
      
      // Store the locale preference
      document.cookie = `NEXT_LOCALE=${firstSegment}; path=/; max-age=${60 * 60 * 24 * 365}`;
      
      // Redirect to the path without locale
      router.replace(newPath);
    }
  }, [pathname, router]);

  return null;
}

