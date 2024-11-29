import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['p1.music.126.net','p2.music.126.net'], // 添加允许的域名
    
  },
  async rewrites() {
    return [
      {
        source: '/music/:path*',
        destination: 'http://m10.music.126.net/:path*'
      }
    ]
  }
};

export default nextConfig;
