import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Evaluates `front/next.config.ts` as Next does — calling the default export
 * with a phase — and reports what happened.
 *
 * The guard is driven by the **phase argument**, not `NODE_ENV`: `next build` and
 * `next start` are both `production`, and `process.env.NEXT_PHASE` is assigned
 * only *after* the config is evaluated. So the phase arrives on stdin, and one
 * process per case is used because the config module caches on first require.
 */
const phase = process.argv[2];

let outcome;
try {
  const config = require("./next.config.js");
  const factory = config?.default ?? config;
  if (typeof factory !== "function") {
    outcome = `not a function config: ${typeof factory}`;
  } else {
    factory(phase, { defaultConfig: {} });
    outcome = "loaded";
  }
} catch (error) {
  outcome = `threw: ${error?.message ?? String(error)}`;
}

console.log(JSON.stringify({ outcome: outcome.replace(/\s+/g, " ").slice(0, 400) }));