"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { MovieGrid } from './components/MovieGrid';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { FeedbackSidebarTrigger } from './components/FeedbackSidebarTrigger';
import { MovieCell } from './types';
import { loadCellsFromDB } from './utils/indexedDB';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t, locale } = useI18n();
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      // Common in-app browser identifiers
      const isInApp = /micromessenger|weibo|douban|qq\/|playstation|alipay/.test(ua);
      setIsInAppBrowser(isInApp);
    }
  }, []);

  const handleCopyUrl = async () => {
    console.log('Copy button clicked');
    try {
      await navigator.clipboard.writeText('moviegrid.dsdev.ink');
      console.log('Copied successfully');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: try using document.execCommand
      try {
        const textArea = document.createElement('textarea');
        textArea.value = 'moviegrid.dsdev.ink';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const [cells, setCells] = useState<MovieCell[]>(
    (t('cell_titles') as string[]).map((title, index) => ({
      id: index,
      title,
      image: undefined,
      name: undefined,
      imageObj: null,
    }))
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCells = await loadCellsFromDB();
        setCells((prevCells) => {
          let newCells = [...prevCells];
          // 合并 DB 数据但不覆盖标题（title 由语系字典或本地覆盖提供）
          savedCells.forEach((savedCell) => {
            const idx = newCells.findIndex((cell) => cell.id === savedCell.id);
            if (idx !== -1) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { title: _ignoredTitle, ...rest } = savedCell as MovieCell;
              newCells[idx] = { ...newCells[idx], ...rest } as MovieCell;
            }
          });

          // 应用该语系下的自定义标题覆盖
          if (typeof window !== 'undefined') {
            const key = `movieGridTitles_${locale}`;
            const json = localStorage.getItem(key);
            if (json) {
              try {
                const map: Record<string, string> = JSON.parse(json);
                newCells = newCells.map((c) => ({ ...c, title: map[c.id] ?? c.title }));
              } catch {}
            }
          }
          return newCells;
        });
      } catch (e) {
        console.error('加载数据失败:', e);
      } finally {
        setLoading(false);
      }
    };

    // 添加超时机制，确保即使 IndexedDB 失败也能显示界面（特别是 Safari 移动端）
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      console.warn('IndexedDB 加载超时，已强制显示页面');
      setLoading(false);
    }, 800); // 800ms超时

    loadData().finally(() => {
      if (!timeoutTriggered) {
        clearTimeout(timeoutId);
      }
    });

    return () => clearTimeout(timeoutId);
  }, [locale]);

  const handleUpdateCells = (newCells: MovieCell[]) => setCells(newCells);

  return (
    <main className="min-h-screen flex flex-col items-center py-8 relative">
      {isInAppBrowser && (
        <div className="w-full max-w-[1200px] px-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-full bg-yellow-50 rounded-md p-4 border-l-4 border-yellow-400 text-sm">
            <p className="font-bold flex items-center gap-2 text-yellow-700 mb-1">
              <AlertTriangle className="h-4 w-4" />
              {t('common.tip')}
            </p>
            <p className="text-black/90 leading-relaxed mb-3">
              {t('warning.in_app_browser')}
            </p>
            <div className="flex items-center gap-2 bg-white/60 rounded px-3 py-2 border border-yellow-200">
              <code className="flex-1 text-xs font-mono text-black/80">moviegrid.dsdev.ink</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 hover:bg-yellow-100"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-yellow-700" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      <FeedbackSidebarTrigger />
      <LanguageSwitcher />

      {/* SEO 优化：语义化标题 */}
      <h1 className="sr-only">
        {t('global.main_title')}
      </h1>

      {!loading && (
        <MovieGrid initialCells={cells} onUpdateCells={handleUpdateCells} />
      )}

      <div className="text-sm text-gray-500 mt-6 text-center px-4">
        <p className="flex items-center justify-center mb-1">
          {t('footer.if_useful_star')}
          <a
            href="https://github.com/janethedev/movie-grid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/github/stars/janethedev/movie-grid?style=social"
              alt="GitHub Stars"
              className="align-middle"
            />
          </a>
        </p>
        
        <p className="flex items-center justify-center mb-1">
          {t('footer.friendship_link')}<a className="text-blue-500 mr-1" href="https://gamegrid.shatranj.space/">{t('footer.friendship_link_site')}</a>
        </p>
        <p className="flex items-center justify-center mb-1">
          Powered by
          <a
            className="ml-1 text-gray-500 hover:underline focus-visible:underline"
            href="https://www.themoviedb.org/"
          >
            TMDB
          </a>
        </p>
        <p className="flex items-center justify-center mt-1">
          <a
            href="https://hits.sh/github.com/janethedev/movie-grid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://hits.sh/github.com/janethedev/movie-grid.svg?label=views&color=007ec6"
              alt="Visitors Count"
              className="align-middle"
            />
          </a>
        </p>
      </div>

      {/* JSON-LD: WebApplication */}
      {(() => {
        const base = 'https://moviegrid.dsdev.ink';
        const url = base;
        const webAppLd: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name:
            (typeof t('global.main_title') === 'string' && t('global.main_title')) ||
            'Movie Preference Grid',
          url,
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web',
          inLanguage: locale,
          description:
            (typeof t('meta.description') === 'string' && t('meta.description')) ||
            'Create your personal movie preference grid',
        };
        if (locale.startsWith('zh')) {
          webAppLd.alternateName = [
            '电影生涯喜好表',
            '电影生涯个人喜好表',
            '电影喜好表',
            '电影九宫格',
            '电影喜好九宫格',
          ];
        }
        const faqLd = locale === 'zh-CN'
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '什么是电影生涯喜好表（电影喜好表）？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      '一种用九宫格等布局展示你对不同维度「最爱、最惊艳、最治愈」等的电影偏好，可导出分享。',
                  },
                },
                {
                  '@type': 'Question',
                  name: '如何生成我的电影生涯喜好表？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      '在页面中点击格子标题或名称即可编辑，支持搜索封面或拖拽图片，完成后点击生成按钮导出图片。',
                  },
                },
              ],
            }
          : null;
        return (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd) }}
            />
            {faqLd && (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
              />
            )}
          </>
        );
      })()}
    </main>
  );
}
