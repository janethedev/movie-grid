import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// 仅在开发环境使用此路由
export const dynamic = 'force-dynamic';

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  // 如果不是开发环境，直接返回 404，防止线上误用（虽然 Rewrite 会拦截，但多一层保险）
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("This route is only for development environment", { status: 404 });
  }

  const path = params.path.join('/');
  const targetUrl = `${TMDB_IMAGE_BASE}/${path}`;

  try {
    const fetchOptions: any = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*",
      },
    };

    // 本地开发使用代理
    if (PROXY_URL) {
      fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
    }

    const response = await undiciFetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      return new NextResponse(`Dev Proxy Error: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Dev Proxy Error:", error);
    return new NextResponse(`Dev Proxy Failed: ${error}`, { status: 500 });
  }
}
