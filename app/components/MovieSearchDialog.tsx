"use client"

import { useState, useEffect, useRef } from "react"
import NextImage from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Film, Loader2, AlertCircle, Search, RefreshCw, Upload } from "lucide-react"
import { MovieSearchResult } from "../types"
import { useI18n } from "@/lib/i18n/provider"

interface MovieSearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectMovie: (movie: MovieSearchResult) => void
  onUploadImage?: (file: File) => void
  cellId?: number | null  // 添加 cellId 以判断搜索类型
}

/**
 * 搜索状态类型
 */
type SearchStatus = {
  state: 'idle' | 'searching' | 'success' | 'error' | 'no-results';
  message: string;
};

/**
 * 电影搜索对话框组件
 */
export function MovieSearchDialog({ isOpen, onOpenChange, onSelectMovie, onUploadImage, cellId }: MovieSearchDialogProps) {
  const { t } = useI18n();
  
  // 判断是否使用 person 搜索（索引 1, 2, 3 对应"最佳导演"、"最爱演员"、"最爱导演"）
  const isPersonSearch = cellId !== null && cellId !== undefined && [1, 2, 3].includes(cellId);
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({ 
    state: 'idle', 
    message: isPersonSearch ? String(t('search.idle_hint_person')) : String(t('search.idle_hint')) 
  })
  // 添加状态来跟踪总结果数量
  const [totalResults, setTotalResults] = useState<number>(0)
  // 海报语言偏好
  const [preferEnglishPoster, setPreferEnglishPoster] = useState(false)
  
  // 用于存储搜索请求的 AbortController，以便能取消进行中的请求
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 上一次搜索的关键词
  const lastSearchTermRef = useRef<string>("");

  // 当对话框打开或关闭时重置状态
  useEffect(() => {
    if (isOpen) {
      // 仅在打开时重置状态，不重置搜索词和结果，以便用户可以继续之前的搜索
      setIsLoading(false);
      setSearchStatus({ state: searchResults.length > 0 ? 'success' : 'idle', message: searchResults.length > 0 ? '' : (isPersonSearch ? String(t('search.idle_hint_person')) : String(t('search.idle_hint'))) });
      // 加载用户的海报偏好设置
      const saved = localStorage.getItem('preferEnglishPoster');
      setPreferEnglishPoster(saved === 'true');
    } else {
      // 关闭时取消正在进行的搜索请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen, searchResults.length, isPersonSearch, t]);

  // 清空搜索结果和状态
  const handleClearSearch = () => {
    // 取消正在进行的搜索请求
    if (abortControllerRef.current) {
      console.log('清除搜索时取消进行中的搜索请求');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 重置加载状态
    setIsLoading(false);
    
    // 清空搜索内容和结果
    setSearchTerm('');
    setSearchResults([]);
    setTotalResults(0);
    setSearchStatus({ 
      state: 'idle', 
      message: isPersonSearch ? String(t('search.idle_hint_person')) : String(t('search.idle_hint'))
    });
    lastSearchTermRef.current = '';
  };

  // 搜索电影 - 使用流式响应
  const searchMovies = async (retry: boolean = false) => {
    // 获取搜索词，如果是重试则使用最后一次的搜索词
    const term = retry ? lastSearchTermRef.current : searchTerm.trim();
    
    // 检查搜索词是否为空
    if (!term) {
      setSearchStatus({ state: 'idle', message: isPersonSearch ? String(t('search.idle_hint_person')) : String(t('search.idle_hint')) });
      return;
    }
    
    // 取消之前的搜索请求（如果有）
    if (abortControllerRef.current) {
      console.log('取消之前的搜索请求');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;
    
    // 更新状态为搜索中
    setIsLoading(true);
    
    // 清除之前的搜索结果，但仅当不是重试的情况下
    if (!retry) {
      setSearchResults([]);
      setTotalResults(0);
    }
    
    setSearchStatus({ state: 'searching', message: '正在搜索...' });
    
    // 保存当前搜索词以便重试
    lastSearchTermRef.current = term;
    
    // 超时定时器
    const timeoutId = setTimeout(() => {
      if (isLoading && currentAbortController === abortControllerRef.current) {
        setSearchStatus({ 
          state: 'searching', 
          message: '搜索时间较长，正在努力获取结果...' 
        });
      }
    }, 3000);

    try {
      // 根据格子类型选择 API 端点
      const apiEndpoint = isPersonSearch 
        ? `/api/person-search?q=${encodeURIComponent(term)}`
        : `/api/movie-search?q=${encodeURIComponent(term)}&preferEnglish=${preferEnglishPoster}`;
      
      // 使用当前 AbortController 的信号
      const response = await fetch(apiEndpoint, {
        signal: currentAbortController.signal
      });

      // 检查当前操作是否已被更新的请求取代
      if (currentAbortController !== abortControllerRef.current) {
        console.log('搜索请求已被新请求取代');
        return;
      }

      if (!response.ok) {
        throw new Error(`搜索请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("响应没有正文");
      }

      // 创建一个读取器来处理流数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 临时保存结果的数组
      let movies: MovieSearchResult[] = [];
      const receivedMovies = new Map<string | number, MovieSearchResult>();

      let done = false;
      let buffer = "";
      let reachEnd = false;

      // 流式处理部分不变，但添加检查确保当前控制器仍然有效
      while (!done) {
        // 添加检查确保当前控制器仍然有效
        if (currentAbortController !== abortControllerRef.current) {
          console.log('流处理被新请求中断');
          return;
        }
        
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          // 处理缓冲区中的完整消息
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // 保留最后一个可能不完整的行

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);

              switch (data.type) {
                case "init":
                  // 保存服务端返回的总结果数量
                  if (data.total !== undefined) {
                    setTotalResults(data.total);
                    setSearchStatus({ 
                      state: 'searching', 
                      message: `找到 ${data.total} 个结果，正在加载封面……` 
                    });
                  } else {
                    setSearchStatus({ 
                      state: 'searching', 
                      message: `正在搜索……` 
                    });
                  }
                  break;

                case "movieStart":
                  // 电影开始加载，添加到结果中（无图片）
                  if (data.movie.id !== undefined) {
                    receivedMovies.set(data.movie.id, data.movie);
                  }
                  movies = Array.from(receivedMovies.values());
                  setSearchResults([...movies]);
                  break;

                case "movieComplete":
                  // 电影加载完成（有图片），更新结果
                  if (data.movie.id !== undefined) {
                    receivedMovies.set(data.movie.id, data.movie);
                  }
                  movies = Array.from(receivedMovies.values());
                  setSearchResults([...movies]);
                  break;

                case "movieError":
                  console.error(`电影 ${data.movieId} 加载失败:`, data.error);
                  break;

                case "error":
                  setSearchStatus({ state: 'error', message: data.message || "搜索失败" });
                  break;

                case "end":
                  reachEnd = true;
                  if (movies.length > 0) {
                    setSearchStatus({ state: 'success', message: '' });
                  } else {
                    setSearchStatus({ 
                      state: 'no-results', 
                      message: data.message || (isPersonSearch ? String(t('search.no_results_person')) : String(t('search.no_results')))
                    });
                  }
                  break;
              }
            } catch (error) {
              console.error("解析响应数据失败:", error, line);
            }
          }
        }
      }

      // 如果流结束但没有收到end消息
      if (!reachEnd) {
        if (movies.length > 0) {
          setSearchStatus({ state: 'success', message: '' });
        } else {
          setSearchStatus({ 
            state: 'no-results', 
            message: isPersonSearch ? String(t('search.no_results_person')) : String(t('search.no_results'))
          });
        }
      }

    } catch (error) {
      // 检查是否是当前有效的搜索请求
      if (currentAbortController !== abortControllerRef.current) {
        console.log('搜索错误处理被跳过，因为已有新请求');
        return;
      }
      
      // 如果是用户取消的请求，不显示错误
      if ((error as Error).name === 'AbortError') {
        console.log('搜索请求被取消');
        return;
      }

      console.error("搜索电影失败:", error);
      
      setSearchStatus({ 
        state: 'error', 
        message: "搜索失败，请检查网络连接后重试" 
      });
    } finally {
      // 只有在当前控制器仍然有效的情况下才清理状态
      if (currentAbortController === abortControllerRef.current) {
        clearTimeout(timeoutId);
        setIsLoading(false);
        
        // 清除 AbortController 引用
        abortControllerRef.current = null;
      }
    }
  }

  // 处理回车键搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      searchMovies();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }

  // 渲染搜索状态UI
  const renderSearchStatus = () => {
    switch (searchStatus.state) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Search className="h-12 w-12 mb-2 opacity-30" />
            <p>{searchStatus.message || (isPersonSearch ? String(t('search.idle_hint_person')) : String(t('search.idle_hint')))}</p>
          </div>
        );
      case 'searching':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Loader2 className="h-8 w-8 mb-2 animate-spin" />
            <p>{searchStatus.message}</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{searchStatus.message}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => searchMovies(true)}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('search.retry')}
            </Button>
          </div>
        );
      case 'no-results':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Film className="h-8 w-8 mb-2 opacity-50" />
            <p>{searchStatus.message}</p>
            <p className="text-sm mt-2">{t('search.try_keywords')}</p>
          </div>
        );
      case 'success':
        return null;
      default:
        return null;
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 取消任何进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 添加文件上传处理函数
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(file);
      onOpenChange(false); // 上传后关闭弹窗
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isPersonSearch ? t('search.title_person') : t('search.title')}</DialogTitle>
        </DialogHeader>
        
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isPersonSearch ? String(t('search.placeholder_person')) : String(t('search.placeholder'))}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="pr-8 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden"
                type="text"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={handleClearSearch}
                  aria-label={String(t('search.clear'))}
                >
                  ✕
                </button>
              )}
            </div>
            <Button onClick={() => searchMovies()} disabled={isLoading || !searchTerm.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('search.searching')}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t('search.search')}
                </>
              )}
            </Button>
          </div>
          {/* 只在电影搜索时显示海报语言偏好 */}
          {!isPersonSearch && (
            <TooltipProvider>
              <div className="flex items-center gap-2 mt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label 
                      htmlFor="poster-preference-toggle" 
                      className="text-sm text-gray-600 cursor-pointer select-none flex items-center gap-2"
                    >
                      <span>{t('settings.prefer_english_poster')}</span>
                      <button
                        id="poster-preference-toggle"
                        role="switch"
                        aria-checked={preferEnglishPoster}
                        onClick={() => {
                          const newValue = !preferEnglishPoster;
                          setPreferEnglishPoster(newValue);
                          localStorage.setItem('preferEnglishPoster', String(newValue));
                        }}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${preferEnglishPoster ? 'bg-blue-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                            ${preferEnglishPoster ? 'translate-x-5' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{t('settings.poster_preference_tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </div>

        <div className="max-h-[40vh] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[400px] overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {searchResults.map((movie) => (
                <div
                  key={movie.id || movie.name}
                  onClick={() => onSelectMovie(movie)}
                  className="cursor-pointer border rounded p-1 sm:p-2 hover:bg-gray-50 transition-colors"
                  title={`${movie.name}`}
                >
                  <div className="relative w-full h-0 pb-[133.33%] rounded overflow-hidden bg-gray-100">
                    {movie.image ? (
                      <NextImage 
                        src={movie.image} 
                        alt={movie.name} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, 20vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm truncate mt-1 sm:mt-2">{movie.name}</p>
                </div>
              ))}
            </div>
          ) : renderSearchStatus()}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row justify-between sm:justify-between border-t pt-2 mt-2">
          <div className="text-xs text-gray-500 mb-2 sm:mb-0">
            {totalResults > 0 && String(t('search.results_count', { count: totalResults }))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="hidden sm:inline-flex"
            >
              {t('common.close')}
            </Button>
            {onUploadImage && (
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center justify-center w-full sm:w-8 h-8 rounded bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transition-colors gap-2"
                  title={String(t('search.upload_image'))}
                >
                  <Upload className="h-4 w-4" />
                  <span className="sm:hidden">{t('search.upload_image')}</span>
                </label>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
