import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "550mb", // Increase limit to 50MB for large database uploads
    },
  },
};

export default nextConfig;
