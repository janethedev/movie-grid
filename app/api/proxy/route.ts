// app/api/proxy/route.ts
import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { status: 400 });
  }

  try {
    // 配置请求选项（支持 TMDB 图片代理）
    const fetchOptions: any = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*",
      },
    };

    // 如果配置了代理，使用代理
    if (PROXY_URL) {
      fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
    }

    const response = await undiciFetch(imageUrl, fetchOptions);
    
    if (!response.ok) {
      return new NextResponse(`Error fetching image: ${response.statusText}`, {
        status: response.status,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Vary", "Accept-Encoding");
    headers.set("CDN-Cache-Control", "public, max-age=31536000");

    return new NextResponse(arrayBuffer, {
      headers,
    });
  } catch (error) {
    console.error("获取图片失败:", imageUrl, error);
    return new NextResponse(`Failed to fetch image: ${error}`, {
      status: 500,
    });
  }
}
