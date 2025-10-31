/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn2.steamgriddb.com",
      },
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
      },
      {
        protocol: "http",
        hostname: "lain.bgm.tv",
      },
      {
        protocol: "https",
        hostname: "lain.bgm.tv",
      },
      {
        protocol: "http",
        hostname: "img.bgm.tv",
      },
      {
        protocol: "https",
        hostname: "img.bgm.tv",
      },
      {
        protocol: "https",
        hostname: "img1.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img2.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img3.doubanio.com",
      },
      {
        protocol: "https",
        hostname: "img9.doubanio.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    // 忽略 TypeScript 构建错误
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

