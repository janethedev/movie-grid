import { NextResponse } from "next/server";

// API Keys 和配置
const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY;
const BANGUMI_ACCESS_TOKEN = process.env.BANGUMI_ACCESS_TOKEN;
const BANGUMI_USER_AGENT = process.env.BANGUMI_USER_AGENT;

// 保存最近一次预热的时间戳
let lastWarmupTime = 0;
// 预热状态
let isWarming = false;
// 预热冷却时间（5分钟）
const WARMUP_COOLDOWN = 5 * 60 * 1000;

// 执行预热API连接
async function warmupConnection() {
  if (isWarming) {
    return { success: false, steamgriddb: false, bangumi: false };
  }

  // 检查是否需要预热（距离上次预热超过冷却时间）
  const now = Date.now();
  if (now - lastWarmupTime < WARMUP_COOLDOWN) {
    console.log("跳过预热：冷却时间未到");
    return { success: true, steamgriddb: true, bangumi: true };
  }

  try {
    isWarming = true;
    console.log("开始预热API连接...");

    // 设置超时，确保预热不会永远挂起
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 并行预热两个 API
    const [steamgriddbResult, bangumiResult] = await Promise.all([
      // SteamGridDB API 预热
      STEAMGRIDDB_API_KEY
        ? fetch("https://www.steamgriddb.com/api/v2/search/autocomplete/ping", {
            headers: { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` },
            method: "HEAD",
            signal: controller.signal,
          })
            .then(() => true)
            .catch((e) => {
              console.log(
                "SteamGridDB预热请求发生错误，这通常是正常的:",
                e.message
              );
              return false;
            })
        : false,

      // Bangumi API 预热
      BANGUMI_ACCESS_TOKEN
        ? fetch("https://api.bgm.tv/v0/search/subjects?type=4&limit=1", {
            headers: {
              "User-Agent": BANGUMI_USER_AGENT || "GameGrid/1.0",
              Authorization: `Bearer ${BANGUMI_ACCESS_TOKEN}`,
              Accept: "application/json",
            },
            method: "HEAD",
            signal: controller.signal,
          })
            .then(() => true)
            .catch((e) => {
              console.log(
                "Bangumi预热请求发生错误，这通常是正常的:",
                e.message
              );
              return false;
            })
        : false,
    ]);

    clearTimeout(timeoutId);
    lastWarmupTime = now;
    console.log("API连接预热完成");

    const success = steamgriddbResult || bangumiResult;
    return {
      success,
      steamgriddb: steamgriddbResult,
      bangumi: bangumiResult,
    };
  } catch (e) {
    console.error("预热API连接失败:", e);
    return { success: false, steamgriddb: false, bangumi: false };
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
