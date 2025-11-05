import { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/locales';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://moviegrid.dsdev.ink';
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: locales.reduce((acc, locale) => {
          acc[locale] = baseUrl;
          return acc;
        }, {} as Record<string, string>),
      },
    },
  ];
}

