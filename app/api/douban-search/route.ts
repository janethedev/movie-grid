// app/api/douban-search/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "搜索词不能为空" }, { status: 400 });
  }

  // 使用流式响应，兼容前端现有逻辑
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // 发送初始状态
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: "init", 
          message: "正在搜索电影..." 
        }) + "\n"));

        // 直接使用豆瓣的搜索建议接口
        const response = await fetch(
          `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`,
          { 
            headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://movie.douban.com/",
              "Accept": "application/json",
            }, 
            cache: "no-store" 
          }
        );

        if (!response.ok) {
          throw new Error(`豆瓣接口返回 ${response.status}`);
        }

        const suggest = await response.json();
        
        // 过滤出电影和电视剧类型
        const movies = suggest
          .filter((item: any) => item.type === 'movie' || item.type === 'tv')
          .slice(0, 10);

        if (movies.length === 0) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "end",
            message: "没有找到任何电影"
          }) + "\n"));
          controller.close();
          return;
        }

        // 发送总数
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "init",
          total: movies.length
        }) + "\n"));

        // 逐个发送电影信息
        for (const item of movies) {
          // 获取图片URL，通过代理转发以解决防盗链问题
          const imageUrl = item.img || item.cover_url || null;
          
          const game = {
            id: item.id,
            name: item.title,
            // 通过 /api/proxy 路由代理豆瓣图片，解决防盗链问题
            image: imageUrl ? `/api/proxy?url=${encodeURIComponent(imageUrl)}` : null,
          };

          // 发送开始消息
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "gameStart",
            game: { ...game, image: null }
          }) + "\n"));

          // 发送完成消息（带图片）
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "gameComplete",
            game
          }) + "\n"));
        }

        // 发送结束消息
        controller.enqueue(encoder.encode(JSON.stringify({
          type: "end",
          message: "所有电影数据已发送完成",
          successCount: movies.length
        }) + "\n"));

      } catch (error) {
        console.error("豆瓣搜索失败", error);
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
      "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}