import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase API route timeout for database connections
    serverComponentsExternalPackages: ['pg'],
  },
  // Configure API route timeout
  async headers() {
    return [
      {
        source: '/api/database/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
