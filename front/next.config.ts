import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "550mb", // Increase limit to 50MB for large database uploads
    },
    // `@forms` resolves to ../shared/form-engine, which sits above the Next
    // project root. Without this, webpack refuses to transpile those files.
    externalDir: true,
  },
  turbopack: {
    // Turbopack only resolves files at or below its root, which defaults to the
    // Next project dir (front/). Widen it to the repo root so `../shared` is
    // inside the boundary. See next/dist/server/dev/hot-reloader-turbopack.js
    // (rootPath) and next/dist/build/turbopack-build/impl.js.
    root: repoRoot,
  },
};

export default nextConfig;
