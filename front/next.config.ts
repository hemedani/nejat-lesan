import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "..");

/**
 * `NEXT_PUBLIC_*` values that must be present when the client bundle is built.
 *
 * Each one names something only the **deployment** knows — which public host the
 * backend is reachable at — and which therefore cannot be defaulted in the repo.
 */
const REQUIRED_PUBLIC_ENV = ["NEXT_PUBLIC_LESAN_URL"] as const;

/**
 * `next build` only. `next start` is deliberately not included: the client bundle
 * is already compiled by then, so the value is baked in and re-supplying it at
 * start would block a working deploy for no benefit.
 */
const BUILD_PHASE = "phase-production-build";

/**
 * Fail the build rather than ship a report page whose images 404.
 *
 * `NEXT_PUBLIC_*` is substituted into the bundle while `next build` runs, so a
 * missing value cannot be repaired afterwards by setting it on `next start` —
 * the browser keeps whatever was baked in. `getLesanBaseUrl` then reads `undefined`
 * and silently falls back to `window.location.origin`, which builds every
 * attachment URL against the Next.js origin. Nothing errors: the API proxy keeps
 * working, because `LESAN_URL` *is* a runtime server variable, so only the images
 * break. That asymmetry is what let this survive to production twice — once via
 * Docker, once via a pm2 `next start`.
 *
 * The phase comes from Next's function-form config, which is the supported way to
 * tell `next build` from `next start`. `process.env.NEXT_PHASE` looks equivalent
 * and is not: Next assigns it *late* in `build/index.js`, after the config has
 * already been evaluated, so a guard reading it here would never fire.
 */
function assertPublicEnvPresent() {
  const missing = REQUIRED_PUBLIC_ENV.filter((key) => !process.env[key]);
  if (!missing.length) return;

  throw new Error(
    `Cannot build: ${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} not set.\n\n` +
      `NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this\n` +
      `cannot be fixed by setting it on \`next start\`. Without it, getLesanBaseUrl()\n` +
      `(src/services/api.ts) falls back to window.location.origin and every backend\n` +
      `asset URL — /uploads/... — 404s.\n\n` +
      `  NEXT_PUBLIC_LESAN_URL=http://<public-backend-host>:<port> pnpm build\n\n` +
      `For local development this guard does not apply: \`pnpm dev\` needs no public host.`,
  );
}

export default (phase: string): NextConfig => {
  if (phase === BUILD_PHASE) assertPublicEnvPresent();

  return {
    experimental: {
      serverActions: {
        bodySizeLimit: "550mb", // Increase limit to 50MB for large database uploads
      },
      // `@forms` resolves to ../shared/form-engine, which sits above the Next
      // project root. Without this, webpack refuses to transpile those files.
      externalDir: true,
    },
    turbopack: {
      // Turbopack only resolves files at or below its root, which falls back to
      // the Next project dir (front/) when neither `turbopack.root` nor
      // `outputFileTracingRoot` is set. Widen it to the repo root so `../shared`
      // is inside the boundary. See next/dist/server/dev/hot-reloader-turbopack.js
      // (rootPath) and next/dist/build/turbopack-build/impl.js.
      root: repoRoot,
    },
  };
};
