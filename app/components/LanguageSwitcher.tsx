"use client";

import { useI18n } from '@/lib/i18n/provider';
import { useState } from 'react';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function LanguageSwitcher() {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'zh-CN', name: '简体中文', short: '中' },
    { code: 'en', name: 'English', short: 'EN' },
  ];

  const currentLang = languages.find(lang => lang.code === locale) || languages[0];

  const switchLanguage = (langCode: string) => {
    // Set cookie
    document.cookie = `${LOCALE_COOKIE}=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // Reload page to apply new language
    window.location.reload();
  };

  return (
    <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          aria-label="切换语言 / Switch Language"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-xs md:text-sm font-medium text-gray-700">{currentLang.short}</span>
          <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    switchLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 md:px-4 md:py-3 hover:bg-gray-50 transition-colors ${
                    lang.code === locale ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base font-medium">{lang.name}</span>
                    {lang.code === locale && (
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

