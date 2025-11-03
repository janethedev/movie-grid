import type { Locale } from './locales';

export type Messages = Record<string, any>;

export async function getMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'en':
      return (await import('../../messages/en')).default;
    case 'zh-CN':
    default:
      return (await import('../../messages/zh-CN')).default;
  }
}

