import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

// 保存最近一次预热的时间戳
let lastWarmupTime = 0;
// 预热状态
let isWarming = false;
// 预热冷却时间（5分钟）
const WARMUP_COOLDOWN = 5 * 60 * 1000;

// 执行预热API连接
async function warmupConnection() {
  if (isWarming) {
    return { success: false, tmdb: false };
  }

  // 检查是否需要预热（距离上次预热超过冷却时间）
  const now = Date.now();
  if (now - lastWarmupTime < WARMUP_COOLDOWN) {
    console.log("跳过预热：冷却时间未到");
    return { success: true, tmdb: true };
  }

  if (!TMDB_API_KEY) {
    console.log("未配置 TMDB_API_KEY，跳过预热");
    return { success: false, tmdb: false };
  }

  try {
    isWarming = true;
    console.log("开始预热 TMDB API 连接...");

    // 配置请求选项
    const fetchOptions: any = {
      headers: {
        "Accept": "application/json",
      },
    };

    // 如果配置了代理，使用代理
    if (PROXY_URL) {
      fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
    }

    // 预热 TMDB API（使用配置接口，轻量级）
    const tmdbResult = await undiciFetch(
      `https://api.themoviedb.org/3/configuration?api_key=${TMDB_API_KEY}`,
      fetchOptions
    )
      .then(() => true)
      .catch((e) => {
        console.log("TMDB 预热请求发生错误:", e.message);
        return false;
      });

    lastWarmupTime = now;
    console.log("TMDB API 连接预热完成");

    return {
      success: tmdbResult,
      tmdb: tmdbResult,
    };
  } catch (e) {
    console.error("预热 API 连接失败:", e);
    return { success: false, tmdb: false };
  } finally {
    isWarming = false;
  }
}

// 导出全局预热状态，供其他API路由使用
export const isApiWarmedUp = () =>
  Date.now() - lastWarmupTime < WARMUP_COOLDOWN;

export async function GET() {
  const result = await warmupConnection();

  return NextResponse.json({
    ...result,
    warmedUp: isApiWarmedUp(),
    timestamp: lastWarmupTime,
  });
}
