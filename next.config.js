/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      // TMDB 图片域名
      {
        protocol: "https",
        hostname: "image.tmdb.org",
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

