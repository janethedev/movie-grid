import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/provider';
import { getMessages } from '@/lib/i18n/getMessages';
import { locales, type Locale } from '@/lib/i18n/locales';
import ApiWarmer from '@/components/ApiWarmer';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const { locale } = params;
  const messages = await getMessages(locale);

  // Build hreflang alternates for all supported locales and a canonical
  const languageAlternates: Record<string, string> = {};
  for (const l of locales) {
    languageAlternates[l] = `/${l}`;
  }
  // Provide x-default to help Google understand the default locale
  languageAlternates['x-default'] = '/';

  const keywords = locale.startsWith('zh')
    ? [
        '电影生涯喜好表',
        '电影生涯个人喜好表',
        '电影喜好表',
        '电影九宫格',
        '电影喜好九宫格',
        '喜好表生成器',
      ]
    : undefined;

  return {
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
      url: `/${locale}`,
      siteName: messages.global?.main_title ?? 'MovieGrid',
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      images: [`/${locale}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title: messages.meta?.title ?? 'MovieGrid',
      description: messages.meta?.description ?? 'Create your movie preference grid',
      images: [`/${locale}/twitter-image`],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates,
    },
    verification: {
      google: 'swtOMxSQC6Dfn-w4YtMQ3OFH4SZz00Blcd6FI0qMgJc',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const messages = await getMessages(params.locale);
  return (
    <html lang={params.locale} className="light" style={{ colorScheme: 'light only' }}>
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className={inter.className} style={{ colorScheme: 'light only' }}>
        <ApiWarmer />
        <I18nProvider locale={params.locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
