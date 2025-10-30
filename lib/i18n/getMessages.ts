import type { Locale } from './locales';

export type Messages = Record<string, any>;

export async function getMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'zh-TW':
      return (await import('../../messages/zh-TW')).default;
    case 'ja':
      return (await import('../../messages/ja')).default;
    case 'ko':
      return (await import('../../messages/ko')).default;
    case 'fr':
      return (await import('../../messages/fr')).default;
    case 'de':
      return (await import('../../messages/de')).default;
    case 'es':
      return (await import('../../messages/es')).default;
    case 'pt':
      return (await import('../../messages/pt')).default;
    case 'it':
      return (await import('../../messages/it')).default;
    case 'ru':
      return (await import('../../messages/ru')).default;
    case 'nl':
      return (await import('../../messages/nl')).default;
    case 'pl':
      return (await import('../../messages/pl')).default;
    case 'tr':
      return (await import('../../messages/tr')).default;
    case 'en':
      return (await import('../../messages/en')).default;
    case 'zh-CN':
    default:
      return (await import('../../messages/zh-CN')).default;
  }
}

