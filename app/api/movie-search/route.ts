// app/api/movie-search/route.ts
import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { TTLCache } from "@/lib/server-cache";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// 是否启用英文海报优先（默认关闭，节省API调用）
const ENABLE_ENGLISH_POSTER = process.env.ENABLE_ENGLISH_POSTER === 'true';

// 使用 wsrv.nl 作为 TMDB 图片代理，减轻本项目域名的图片流量压力
function buildWsrvImageUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath) return null;
  const originalUrl = `${TMDB_IMAGE_BASE}${posterPath}`;
  const encoded = encodeURIComponent(originalUrl);
  // 适度压缩：宽度 400，输出 webp（大部分浏览器支持），在清晰度和体积之间折中
  return `https://wsrv.nl/?url=${encoded}&w=400&output=webp`;
}

type CachedMovie = {
  id: number;
  name: string;
  image: string | null;
};

const movieSearchCache = new TTLCache<CachedMovie[]>(CACHE_TTL_MS, 500);

// 检测文本语言（简单实现：检测是否包含中文字符）
function detectLanguage(text: string): string {
  // 中文字符范围（包括常用汉字、标点等）
  const chineseRegex = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/;
  return chineseRegex.test(text) ? 'zh-CN' : 'en-US';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const preferEnglish = searchParams.get("preferEnglish") === 'true';

  if (!query) {
    return NextResponse.json({ error: "搜索词不能为空" }, { status: 400 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "未配置 TMDB_API_KEY，请在 .env.local 中添加" }, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "init", 
          message: "正在搜索电影..." 
        }) + "\n"));

        // 根据搜索词自动检测语言
        const language = detectLanguage(query);
        // 缓存键包含语言、关键词和用户偏好
        const cacheKey = `${language}:${query.toLowerCase()}:${preferEnglish || ENABLE_ENGLISH_POSTER}`;

        const emitMovies = (movies: CachedMovie[]) => {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "init",
            total: movies.length
          }) + "\n"));

          for (const movie of movies) {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: "movieStart",
              movie: { ...movie, image: null }
            }) + "\n"));

            controller.enqueue(encoder.encode(JSON.stringify({
              type: "movieComplete",
              movie
            }) + "\n"));
          }

          controller.enqueue(encoder.encode(JSON.stringify({
            type: "end",
            message: "所有电影数据已发送完成",
            successCount: movies.length
          }) + "\n"));
        };

        const cachedMovies = movieSearchCache.get(cacheKey);
        if (cachedMovies) {
          emitMovies(cachedMovies);
          return;
        }

        // 配置请求选项
        const fetchOptions: any = {
          headers: {
            "Accept": "application/json",
          },
        };

        // 如果配置了代理，添加代理 dispatcher
        if (PROXY_URL) {
          console.log(`使用代理: ${PROXY_URL}`);
          fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
        } else {
          console.log('未配置代理，使用 undici 直接访问');
        }

        // 如果是中文搜索且用户选择了英文海报，同时发起英文搜索
        let movies: CachedMovie[] = [];
        
        if (language === 'zh-CN' && (preferEnglish || ENABLE_ENGLISH_POSTER)) {
          const zhUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=zh-CN&page=1`;
          const enUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;

          const [zhResponse, enResponse] = await Promise.all([
            undiciFetch(zhUrl, fetchOptions),
            undiciFetch(enUrl, fetchOptions)
          ]);

          if (!zhResponse.ok) throw new Error(`TMDB 接口返回 ${zhResponse.status}`);
          
          const zhData = await zhResponse.json() as any;
          const enData = enResponse.ok ? await enResponse.json() as any : { results: [] };

          // 创建英文结果的映射表 (ID -> PosterPath)
          const enPosterMap = new Map<number, string>();
          (enData.results || []).forEach((item: any) => {
            if (item.poster_path) {
              enPosterMap.set(item.id, item.poster_path);
            }
          });

          // 合并结果：使用中文名，但优先使用英文海报
          movies = (zhData.results || []).slice(0, 10).map((item: any) => {
            // 优先查找英文海报，如果没有则使用中文结果里的海报
            const posterPath = enPosterMap.get(item.id) || item.poster_path;
            const imagePath = buildWsrvImageUrl(posterPath);

            return {
              id: item.id,
              name: item.title || item.original_title,
              image: imagePath,
            } satisfies CachedMovie;
          });

        } else {
          // 非中文搜索，直接请求一次
          const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${language}&page=1`;
          // fetchOptions 在上面已经定义，可以直接使用
          const response = await undiciFetch(url, fetchOptions);
          
          if (!response.ok) throw new Error(`TMDB 接口返回 ${response.status}`);
          
          const data = await response.json() as any;
          movies = (data.results || []).slice(0, 10).map((item: any) => {
            const imagePath = buildWsrvImageUrl(item.poster_path);
            return {
              id: item.id,
              name: item.title || item.original_title,
              image: imagePath,
            } satisfies CachedMovie;
          });
        }

        if (movies.length === 0) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "end",
            message: "没有找到任何电影"
          }) + "\n"));
          controller.close();
          return;
        }

        emitMovies(movies);
        movieSearchCache.set(cacheKey, movies);

      } catch (error) {
        console.error("TMDB 搜索失败", error);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "error",
          message: `搜索失败: ${(error as Error).message}`
        }) + "\n"));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

