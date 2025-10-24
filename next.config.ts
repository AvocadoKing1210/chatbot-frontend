import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server components
  serverExternalPackages: ['pg'],
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
