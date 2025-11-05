export type Locale = 'zh-CN' | 'en';

export const locales: Locale[] = ['zh-CN', 'en'];

export const defaultLocale: Locale = 'en';

// Map common language tags to our supported locales
const langMap: Record<string, Locale> = {
  'zh-CN': 'zh-CN',
  'zh': 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh-TW': 'zh-CN',
  'zh-HK': 'zh-CN',
  'zh-Hant': 'zh-CN',
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
};

export function normalizeLocale(tag: string): Locale {
  console.log('[normalizeLocale] Input tag:', tag);
  
  // Clean the tag: extract only valid locale characters
  // Valid locale format: language code (2-3 letters) optionally followed by - and region code
  const cleanTag = tag.match(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?/)?.[0] || tag;
  console.log('[normalizeLocale] Cleaned tag:', cleanTag);
  
  const exact = locales.find((l) => l.toLowerCase() === cleanTag.toLowerCase());
  if (exact) {
    console.log('[normalizeLocale] Found exact match:', exact);
    return exact;
  }
  
  if ((langMap as any)[cleanTag]) {
    console.log('[normalizeLocale] Found in langMap:', (langMap as any)[cleanTag]);
    return (langMap as any)[cleanTag];
  }
  
  const base = cleanTag.split('-')[0];
  if ((langMap as any)[base]) {
    console.log('[normalizeLocale] Found base in langMap:', (langMap as any)[base]);
    return (langMap as any)[base];
  }
  
  console.log('[normalizeLocale] No match found, returning default:', defaultLocale);
  return defaultLocale;
}

