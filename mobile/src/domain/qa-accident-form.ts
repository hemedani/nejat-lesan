/**
 * The QA reference form now lives in the shared form engine, at
 * `shared/form-engine/src/qa-accident-form.ts`.
 *
 * It is the engine's acceptance test *and* the accident form the backend
 * activates for a demo organization, so it cannot live in one app's source tree.
 * This shim keeps the two existing importers — `./qa-accident-form.test.ts` and
 * `./default-accident-form.ts` — working unchanged, and points at the one
 * artifact rather than holding a second copy of it.
 *
 * It re-exports from the bare `@forms` barrel on purpose. `back/deno.json` maps
 * `@forms` to the engine's index file and has no `@forms/*` entry, so the barrel
 * is the only way the backend reaches this definition — importing it here too
 * keeps one entry point for both sides. A deep `@forms/qa-accident-form` import
 * would resolve on mobile (tsconfig and Metro both map it) but would bypass the
 * one re-export the backend depends on.
 */

export { qaAccidentFormDefinition } from '@forms';