"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { MovieGrid } from './components/MovieGrid';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { MovieCell } from './types';
import { loadCellsFromDB } from './utils/indexedDB';

export default function Home() {
  const { t, locale } = useI18n();

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
    loadData();
  }, [locale]);

  const handleUpdateCells = (newCells: MovieCell[]) => setCells(newCells);

  return (
    <main className="min-h-screen flex flex-col items-center py-8 relative">
      <LanguageSwitcher />

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
        Powered by <a className="text-blue-500 ml-1" href="https://www.themoviedb.org/">TMDB</a>
        </p>
        <p className="flex items-center justify-center mt-1">
          <a
            href="https://hits.sh/github.com/janethedev/movie-grid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
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
        const webAppLd: any = {
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
