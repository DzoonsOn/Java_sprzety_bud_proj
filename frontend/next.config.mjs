const API_URL = process.env.API_URL || 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // przeglądarka woła /api/... na porcie Next.js, a ten przekazuje to do backendu Spring Boot
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  images: { unoptimized: true },
};

export default nextConfig;
