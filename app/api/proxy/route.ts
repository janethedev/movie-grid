// app/api/proxy/route.ts
import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

// 安全配置
const ALLOWED_DOMAINS = ['image.tmdb.org']; // 只允许 TMDB 图片域名
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB 限制
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

// 错误响应的通用头部
const ERROR_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  // 1. 检查参数是否存在
  if (!imageUrl) {
    return new NextResponse("Missing URL parameter", { 
      status: 400,
      headers: ERROR_HEADERS
    });
  }

  // 2. 验证 URL 格式和域名白名单（防止 SSRF）
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch (error) {
    return new NextResponse("Invalid URL format", {
      status: 400,
      headers: ERROR_HEADERS
    });
  }

  // 3. 检查协议（只允许 HTTPS）
  if (parsedUrl.protocol !== 'https:') {
    return new NextResponse("Only HTTPS URLs are allowed", {
      status: 403,
      headers: ERROR_HEADERS
    });
  }

  // 4. 检查域名白名单
  const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
    parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowedDomain) {
    return new NextResponse(`Domain not allowed. Only TMDB images are supported.`, {
      status: 403,
      headers: ERROR_HEADERS
    });
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
        headers: ERROR_HEADERS
      });
    }

    // 5. 检查 Content-Type（确保是图片）
    const contentType = response.headers.get("content-type") || "";
    const isValidImageType = VALID_IMAGE_TYPES.some(type => contentType.toLowerCase().startsWith(type));
    
    if (!isValidImageType) {
      return new NextResponse(`Invalid content type: ${contentType}. Only images are allowed.`, {
        status: 415, // Unsupported Media Type
        headers: ERROR_HEADERS
      });
    }

    // 6. 检查文件大小（防止内存耗尽）
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      return new NextResponse(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`, {
        status: 413, // Payload Too Large
        headers: ERROR_HEADERS
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // 7. 再次检查实际大小（防止无 Content-Length 头部的情况）
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return new NextResponse(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`, {
        status: 413,
        headers: ERROR_HEADERS
      });
    }

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
      headers: ERROR_HEADERS
    });
  }
}
