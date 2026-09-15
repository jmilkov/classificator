import path from 'path';

const nextConfig = {
  allowedDevOrigins: ['sp-map.gk-strategy.ru'],  
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    cpus: 4,
  },
  async rewrites() {
    return [
      {
        source: '/api/sensors/:path*',
        destination: 'http://localhost:3001/api/sensors/:path*', // Проксируем на воркер
      },
    ];
  },
};

export default nextConfig;
