import type { NextConfig } from 'next';

const apiUpstream =
  process.env.API_UPSTREAM_URL ?? 'https://api-makeplay.onrender.com';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${apiUpstream}/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
