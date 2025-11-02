import { NextResponse } from "next/server";

// 保存最近一次预热的时间戳
let lastWarmupTime = 0;
// 预热状态
let isWarming = false;
// 预热冷却时间（5分钟）
const WARMUP_COOLDOWN = 5 * 60 * 1000;

// 执行预热API连接
async function warmupConnection() {
  if (isWarming) {
    return { success: false, douban: false };
  }

  // 检查是否需要预热（距离上次预热超过冷却时间）
  const now = Date.now();
  if (now - lastWarmupTime < WARMUP_COOLDOWN) {
    console.log("跳过预热：冷却时间未到");
    return { success: true, douban: true };
  }

  try {
    isWarming = true;
    console.log("开始预热API连接...");

    // 设置超时，确保预热不会永远挂起
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 预热豆瓣 API
    const doubanResult = await fetch("https://movie.douban.com/j/subject_suggest?q=test", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/",
        "Accept": "application/json",
      },
      method: "HEAD",
      signal: controller.signal,
    })
      .then(() => true)
      .catch((e) => {
        console.log("豆瓣预热请求发生错误，这通常是正常的:", e.message);
        return false;
      });

    clearTimeout(timeoutId);
    lastWarmupTime = now;
    console.log("API连接预热完成");

    return {
      success: doubanResult,
      douban: doubanResult,
    };
  } catch (e) {
    console.error("预热API连接失败:", e);
    return { success: false, douban: false };
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
