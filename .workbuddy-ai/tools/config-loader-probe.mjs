/**
 * Exercises `front/next.config.ts` through **Next's own** config loader.
 *
 * The tsc-based harness proves the guard's logic; this proves the *wiring* —
 * that `next build` actually reaches the guard — which is the part that could
 * regress silently. `next build` calls
 * `loadConfig(PHASE_PRODUCTION_BUILD, …)` and `next start` calls it with
 * `PHASE_PRODUCTION_SERVER`, so the phase argument is what decides, not
 * `NODE_ENV` (both are `production`) and not `process.env.NEXT_PHASE` (Next
 * assigns that only *after* the config is evaluated).
 *
 * It runs against a copy of the config in a directory with **no `.env`**, because
 * that is the deployment case: a repo copy of `.env`/`next.local` silently
 * supplies the variable and masks the guard entirely.
 *
 * Usage: node config-loader-probe.mjs <configDir> <phase>
 * Prints one JSON line.
 */
const mod = await import("next/dist/server/config.js");
// `loadConfig` is the default export; the interop shape has differed across
// Next releases, so both shapes are tried rather than assumed.
const loadConfig = mod.default?.default ?? mod.default;

const [, , dir, phase] = process.argv;

if (typeof loadConfig !== "function") {
  console.log(
    JSON.stringify({ skipped: "next/dist/server/config.js no longer exports loadConfig" }),
  );
  process.exit(0);
}

try {
  await loadConfig(phase, dir, {});
  console.log(JSON.stringify({ ok: true, resolved: process.env.NEXT_PUBLIC_LESAN_URL ?? null }));
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      error: (error?.message ?? String(error)).replace(/\s+/g, " ").slice(0, 300),
    }),
  );
}