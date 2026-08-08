import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

/*
  Turbopack infers the workspace root by walking up for a lockfile. There is a
  stray package-lock.json in the user's home directory (an accidental install),
  so it was selecting ~ as the root — which broadened filesystem watching and
  emitted a warning on every dev/build.

  Pinning root to this directory is the documented fix.
*/
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },

  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },
};

export default nextConfig;
