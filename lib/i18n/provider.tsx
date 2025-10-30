"use client";

import React, { createContext, useContext, useMemo } from 'react';

export type I18nContextType = {
  locale: string;
  messages: Record<string, any>;
  t: (key: string, vars?: Record<string, string | number>) => any;
};

const I18nContext = createContext<I18nContextType | null>(null);

function getByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function I18nProvider({ locale, messages, children }: { locale: string; messages: Record<string, any>; children: React.ReactNode }) {
  const value = useMemo<I18nContextType>(() => {
    return {
      locale,
      messages,
      t: (key: string, vars?: Record<string, string | number>) => {
        const v = getByPath(messages, key);
        if (typeof v === 'string') {
          if (!vars) return v;
          return v.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
        }
        return v ?? key;
      },
    };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

