import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/provider';
import { getMessages } from '@/lib/i18n/getMessages';
import { getLocale } from '@/lib/i18n/getLocale';
import { locales } from '@/lib/i18n/locales';
import ApiWarmer from '@/components/ApiWarmer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { LocaleRedirect } from './components/LocaleRedirect';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  // Build hreflang alternates
  const languageAlternates: Record<string, string> = {};
  for (const l of locales) {
    languageAlternates[l] = '/';
  }
  languageAlternates['x-default'] = '/';

  const keywords = messages.meta?.keywords as string[] | undefined;

  return {
    metadataBase: new URL('https://moviegrid.dsdev.ink'),
    title: messages.meta?.title ?? 'MovieGrid',
    description: messages.meta?.description ?? 'Create your movie preference grid',
    keywords,
    robots: {
      index: true,
      follow: true,
    },
    themeColor: '#ffffff',
    colorScheme: 'light',
    other: {
      'color-scheme': 'light only',
    },
    openGraph: {
      type: 'website',
      title: messages.meta?.title ?? 'MovieGrid',
      description: messages.meta?.description ?? 'Create your movie preference grid',
      url: '/',
      siteName: messages.global?.main_title ?? 'MovieGrid',
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: messages.meta?.title ?? 'MovieGrid',
      description: messages.meta?.description ?? 'Create your movie preference grid',
      images: ['/twitter-image'],
    },
    alternates: {
      canonical: '/',
      languages: languageAlternates,
    },
    verification: {
      google: 'swtOMxSQC6Dfn-w4YtMQ3OFH4SZz00Blcd6FI0qMgJc',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  
  return (
    <html lang={locale} className="light" style={{ colorScheme: 'light only' }}>
      <head>
        <meta name="color-scheme" content="light only" />
        <GoogleAnalytics />
      </head>
      <body className={inter.className} style={{ colorScheme: 'light only' }}>
        <LocaleRedirect />
        <ApiWarmer />
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
