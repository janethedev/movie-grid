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
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": BANGUMI_USER_AGENT || "GameGrid/1.0",
        Referer: "https://bgm.tv/",
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
