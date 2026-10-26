import type { NextConfig } from "next";

import { getStableSecurityHeaders } from "./src/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk", "sharp"],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    deviceSizes: [640, 750, 1080, 1440],
    imageSizes: [64, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: Object.entries(getStableSecurityHeaders()).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
