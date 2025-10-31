import { NextResponse } from "next/server";

// Bangumi API 基础URL
const BANGUMI_API_BASE_URL = "https://api.bgm.tv";
// Bangumi API Access Token
const BANGUMI_ACCESS_TOKEN = process.env.BANGUMI_ACCESS_TOKEN;
// Bangumi API User Agent
const BANGUMI_USER_AGENT = process.env.BANGUMI_USER_AGENT;

// Bangumi电影类型定义
interface BangumiGame {
  id: number;
  name: string;
  images?: {
    large?: string;
    common?: string;
  };
  image?: string;
}

// 自定义 fetch 函数，包含重试逻辑
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeout = 8000,
  retryDelay = 1000
) {
  // 创建超时控制器，与传入的信号分开处理
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

  // 处理信号：如果options中有信号，则用已有信号，否则使用timeoutController的信号
  const signal = options.signal || timeoutController.signal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // 如果是外部取消导致的错误，直接抛出
    if ((error as any).name === "AbortError") {
      throw error;
    }

    if (retries <= 0) throw error;

    console.log(`请求失败，${retries}次重试后再尝试...`, error);
    // 等待一段时间再重试
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    return fetchWithRetry(url, options, retries - 1, timeout, retryDelay);
  }
}

// 处理单个电影的函数
async function processGame(
  game: BangumiGame,
  signal: AbortSignal,
  controller: ReadableStreamDefaultController<Uint8Array>,
  successCountRef: { value: number }
) {
  try {
    // HTML entities workaround
    game.name = game.name.replaceAll("&amp;", "&");

    console.log(`处理电影: ${game.id} (${game.name})`);

    // 先发送电影的基本信息，不含图片
    controller.enqueue(
      new TextEncoder().encode(
        JSON.stringify({
          type: "gameStart",
          game: {
            id: game.id,
            name: game.name,
            image: null,
          },
        }) + "\n"
      )
    );

    let image = null;

    // 尝试获取电影封面
    if (game.images && game.images.large) {
      image = game.images.large;
    } else if (game.images && game.images.common) {
      image = game.images.common;
    } else if (game.image) {
      image = game.image;
    }

    // 如果没有直接可用的图片，尝试获取详细信息
    if (!image) {
      try {
        const detailUrl = `${BANGUMI_API_BASE_URL}/v0/subjects/${game.id}`;
        const detailResponse = await fetchWithRetry(
          detailUrl,
          {
            headers: {
              "User-Agent": BANGUMI_USER_AGENT || "GameGrid/1.0",
              Accept: "application/json",
              Authorization: `Bearer ${BANGUMI_ACCESS_TOKEN}`,
            },
            signal,
          },
          1,
          5000
        );

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          if (detailData.images && detailData.images.large) {
            image = detailData.images.large;
          } else if (detailData.images && detailData.images.common) {
            image = detailData.images.common;
          } else if (detailData.image) {
            image = detailData.image;
          }
        }
      } catch (detailError) {
        // 检查是否是取消请求导致的错误
        if ((detailError as any).name === "AbortError") {
          throw detailError; // 重新抛出以终止整个流程
        }
        console.log(`获取电影详情失败:`, detailError);
      }
    }

    // 发送电影完整信息，含图片URL
    controller.enqueue(
      new TextEncoder().encode(
        JSON.stringify({
          type: "gameComplete",
          game: {
            id: game.id,
            name: game.name,
            image,
          },
        }) + "\n"
      )
    );

    if (image) successCountRef.value++;
  } catch (error) {
    // 检查是否是取消请求导致的错误
    if ((error as any).name === "AbortError") {
      // 对于取消的请求，只记录，不向客户端发送错误
      console.log(`电影 ${game.id} 请求被取消`);
      return;
    }

    console.error(`处理电影 ${game.id} 失败:`, error);
    controller.enqueue(
      new TextEncoder().encode(
        JSON.stringify({
          type: "gameError",
          gameId: game.id,
          error: (error as Error).message,
        }) + "\n"
      )
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "搜索词不能为空" }, { status: 400 });
  }

  // 使用 ReadableStream 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始状态
      controller.enqueue(
        new TextEncoder().encode(
          JSON.stringify({
            type: "init",
            message: "正在搜索...",
          }) + "\n"
        )
      );

      try {
        console.log(`开始在Bangumi搜索电影: "${query}"`);

        // 创建一个新的 AbortController 仅用于这次搜索请求
        const searchAbortController = new AbortController();

        // 搜索电影 - 使用Bangumi API
        const searchUrl = `${BANGUMI_API_BASE_URL}/search/subject/${encodeURIComponent(
          query
        )}?type=4&responseGroup=small`;
        console.log(`发送搜索请求到: ${searchUrl}`);

        try {
          const searchResponse = await fetchWithRetry(searchUrl, {
            headers: {
              "User-Agent": BANGUMI_USER_AGENT || "GameGrid/1.0",
              Accept: "application/json",
              Authorization: `Bearer ${BANGUMI_ACCESS_TOKEN}`,
            },
            signal: searchAbortController.signal,
          });

          console.log(`搜索响应状态: ${searchResponse.status}`);

          if (!searchResponse.ok) {
            throw new Error(`Bangumi API 错误: ${searchResponse.status}`);
          }

          const searchData = await searchResponse.json();
          console.log(
            `搜索结果数量: ${searchData.list ? searchData.list.length : 0}`
          );

          if (!searchData.list || searchData.list.length === 0) {
            console.log("没有找到搜索结果");
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: "end",
                  message: "没有找到任何电影",
                }) + "\n"
              )
            );
            controller.close();
            return;
          }

          // 发送初始消息，告知前端总电影数量
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "init",
                total: Math.min(searchData.list.length, 10),
              }) + "\n"
            )
          );

          // 处理前10个搜索结果
          const results = searchData.list.slice(0, 10);
          const successCountRef = { value: 0 };

          // 为详情请求创建单独的 AbortController
          const detailAbortController = new AbortController();

          // 同时请求多个电影的详情，但限制并发数
          const batchSize = 2; // 每批处理的电影数

          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);

            // 并行处理每个批次中的电影
            await Promise.all(
              batch.map((game: BangumiGame) =>
                processGame(
                  game,
                  detailAbortController.signal,
                  controller,
                  successCountRef
                )
              )
            );

            // 添加每批次的延迟，减轻API负担
            if (i + batchSize < results.length) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }

          // 根据结果发送不同的结束消息
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "end",
                message:
                  successCountRef.value > 0
                    ? "所有电影数据已发送完成"
                    : "未能获取电影封面，请重试",
                successCount: successCountRef.value,
              }) + "\n"
            )
          );
        } catch (searchError) {
          // 检查是否是取消请求导致的错误
          if ((searchError as any).name === "AbortError") {
            console.log("搜索请求被取消");
            controller.close();
            return;
          }

          console.error("搜索电影失败:", searchError);
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "error",
                message: `搜索失败: ${(searchError as Error).message}`,
              }) + "\n"
            )
          );
        }
      } catch (error) {
        console.error("处理搜索请求失败:", error);
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({
              type: "error",
              message: `处理请求失败: ${(error as Error).message}`,
            }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  // 返回流式响应
  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

