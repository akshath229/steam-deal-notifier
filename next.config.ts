import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.akamai.steamstatic.com',
        pathname: '/steam/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
        pathname: '/steam/**',
      },
      {
        protocol: 'https',
        hostname: 'store.steampowered.com',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
