// app/api/proxy/route.ts
import { NextResponse } from "next/server";

// Bangumi API User Agent
const BANGUMI_USER_AGENT = process.env.BANGUMI_USER_AGENT;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    // 根据图片来源设置不同的 Referer
    let referer = "https://bgm.tv/";
    if (imageUrl.includes("douban") || imageUrl.includes("doubanio")) {
      referer = "https://movie.douban.com/";
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": BANGUMI_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
      },
    });
    if (!response.ok) {
      return new NextResponse(`Error fetching image: ${response.statusText}`, {
        status: response.status,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") || "image/png"
    );
    headers.set("Cache-Control", "public, max-age=31536000");

    return new NextResponse(arrayBuffer, {
      headers,
    });
  } catch (error) {
    return new NextResponse(`Failed to fetch image: ${error}`, {
      status: 500,
    });
  }
}
