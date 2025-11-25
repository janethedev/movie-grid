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
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/tmdb-image/:path*',
        // 开发环境：走本地 API 代理 (支持 VPN/代理)
        // 生产环境：直接走 Vercel Edge (省钱、快)
        destination: isDev 
          ? '/api/dev-proxy/:path*'
          : 'https://image.tmdb.org/t/p/w500/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/tmdb-image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

