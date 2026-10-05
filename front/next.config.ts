import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "550mb", // Increase limit to 50MB for large database uploads
    },
    // `@forms` resolves to ../shared/form-engine, which sits above the Next
    // project root. Without this, webpack refuses to transpile those files.
    externalDir: true,
  },
};

export default nextConfig;
