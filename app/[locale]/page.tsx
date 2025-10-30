"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { GameGrid } from '../components/GameGrid';
import { GameCell } from '../types';
import { loadCellsFromDB } from '../utils/indexedDB';

export default function Home() {
  const { t, locale } = useI18n();

  const [cells, setCells] = useState<GameCell[]>(
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
              const { title: _ignoredTitle, ...rest } = savedCell as any;
              newCells[idx] = { ...newCells[idx], ...rest } as GameCell;
            }
          });

          // 应用该语系下的自定义标题覆盖
          if (typeof window !== 'undefined') {
            const key = `gameGridTitles_${locale}`;
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

  const handleUpdateCells = (newCells: GameCell[]) => setCells(newCells);

  return (
    <main className="min-h-screen flex flex-col items-center py-8 relative">

      {!loading && (
        <GameGrid initialCells={cells} onUpdateCells={handleUpdateCells} />
      )}

      <div className="text-sm text-gray-500 mt-1 text-center px-4">
        <p className="flex items-center justify-center mb-1">
          <a className="text-blue-500 mr-1" href="https://weibo.com/6571509464/Phs2X0DIy">苍旻白轮</a> {t('footer.made_with')}
        </p>
        <p className="flex items-center justify-center mb-1">
          {t('footer.if_useful_star')}
          <a
            href="https://github.com/SomiaWhiteRing/gamegrid"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            <img
              src="https://img.shields.io/github/stars/SomiaWhiteRing/gamegrid?style=social"
              alt="GitHub Stars"
              className="align-middle"
            />
          </a>
        </p>
        <p className="flex items-center justify-center">{t('footer.powered_by')}</p>
        <p className="flex items-center justify-center">{t('footer.official_link')}</p>
        <p className="flex items-center justify-center mt-1">
          <a
            href="https://hits.sh/github.com/SomiaWhiteRing/game-grid/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            <img
              src="https://hits.sh/github.com/SomiaWhiteRing/game-grid.svg?label=visitors&color=007ec6"
              alt="Visitors Count"
              className="align-middle"
            />
          </a>
        </p>
      </div>

      {/* JSON-LD: WebApplication */}
      {(() => {
        const base = 'https://gamegrid.shatranj.space';
        const url = `${base}/${locale}`;
        const webAppLd: any = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name:
            (typeof t('global.main_title') === 'string' && t('global.main_title')) ||
            'Game Preference Grid',
          url,
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web',
          inLanguage: locale,
          description:
            (typeof t('meta.description') === 'string' && t('meta.description')) ||
            'Create your personal game preference grid',
        };
        if (locale.startsWith('zh')) {
          webAppLd.alternateName = [
            '游戏生涯喜好表',
            '游戏生涯个人喜好表',
            '游戏喜好表',
            '游戏九宫格',
            '游戏喜好九宫格',
          ];
        }
        const faqLd = locale === 'zh-CN'
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '什么是游戏生涯喜好表（游戏喜好表）？',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      '一种用九宫格等布局展示你对不同维度「最爱、最惊艳、最治愈」等的游戏偏好，可导出分享。',
                  },
                },
                {
                  '@type': 'Question',
                  name: '如何生成我的游戏生涯喜好表？',
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
