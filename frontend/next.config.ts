import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.70.102', '192.168.70.105', '*.loca.lt', 'nasty-squids-happen.loca.lt'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8080/api/:path*', // Proxy to Backend
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:8080/uploads/:path*',
      },
      {
        source: '/music/:path*',
        destination: 'http://127.0.0.1:8080/music/:path*',
      },
    ];
  },

};

export default nextConfig;
