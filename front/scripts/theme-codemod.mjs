#!/usr/bin/env node
/**
 * Theme codemod — moves hardcoded Tailwind colour literals onto semantic tokens.
 *
 *   node scripts/theme-codemod.mjs                 # dry run (default): prints what would change
 *   node scripts/theme-codemod.mjs --check         # report only, exit 1 if work remains
 *   node scripts/theme-codemod.mjs --write         # apply
 *   node scripts/theme-codemod.mjs --write src/components/charts
 *
 * Design: docs/superpowers/specs/2026-11-01-theme-architecture-design.md
 *
 * Dry run is the default on purpose. This script edits ~350 files and its failure
 * mode is a silently restyled app, not a compile error.
 *
 * The mapping below is the whole design decision. Review the table, not the diff.
 *
 * `text-white` is NOT in the table: its target depends on context. It becomes
 * `text-on-brand` when the same class string carries a solid fill, and `text-fg`
 * otherwise. See `transformString`.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";

/**
 * `from` → `to`.
 *
 * Two kinds of key:
 *  - With an opacity (`border-white/10`): the alpha *is* the mapping, so only
 *    that exact form matches and the result carries no alpha — `border-line`
 *    already encodes the right alpha per theme.
 *  - Without (`bg-white`): any `/<opacity>` suffix is preserved, so
 *    `bg-white/70` → `bg-surface/70`.
 *
 * ORDER IS LOAD-BEARING for `hover:` / `focus:` variants: they must precede the
 * bare utility, or `hover:bg-gray-50` is eaten by the `bg-gray-50` rule and
 * becomes a canvas-coloured hover instead of a hover tint.
 */
const MAP = {
  // ── Dark idiom ──────────────────────────────────────────────────────────
  "border-white/5": "border-line",
  "border-white/8": "border-line",
  "border-white/10": "border-line",
  "border-white/15": "border-line-strong",
  "border-white/20": "border-line-strong",
  "border-white/30": "border-line-strong",
  "divide-white/5": "divide-line",
  "divide-white/10": "divide-line",
  "bg-white/[.02]": "bg-surface-sunken",
  "bg-white/[.025]": "bg-surface-sunken",
  "bg-white/[0.02]": "bg-surface-sunken",
  "bg-white/[.03]": "bg-surface-sunken",
  "bg-white/[.04]": "bg-surface-sunken",
  "bg-white/[0.04]": "bg-surface-sunken",
  "bg-white/[.06]": "bg-surface-hover",
  "bg-white/3": "bg-surface-hover",
  "bg-white/5": "bg-surface-hover",
  "bg-white/10": "bg-surface-hover",
  "bg-white/20": "bg-surface-hover",
  "bg-slate-950": "bg-canvas",
  "bg-slate-900": "bg-surface",
  "bg-slate-800": "bg-surface-sunken",
  "bg-slate-700": "bg-surface-hover",
  "text-slate-100": "text-fg",
  "text-slate-200": "text-fg",
  "text-slate-300": "text-fg-muted",
  "text-slate-400": "text-fg-muted",
  "text-slate-500": "text-fg-faint",
  "text-slate-600": "text-fg-faint",
  "border-slate-700": "border-line",
  "border-slate-800": "border-line",

  // ── Hover / focus variants (must precede their bare utilities) ───────────
  "hover:bg-gray-50": "hover:bg-surface-hover",
  "hover:bg-gray-100": "hover:bg-surface-hover",
  "hover:bg-slate-100": "hover:bg-surface-hover",
  "hover:bg-white/5": "hover:bg-surface-hover",
  "hover:bg-white/10": "hover:bg-surface-hover",
  "hover:bg-blue-500": "hover:bg-brand-hover",
  "hover:bg-blue-600": "hover:bg-brand-hover",
  "hover:bg-blue-700": "hover:bg-brand-hover",
  "hover:text-blue-600": "hover:text-brand-fg",
  "hover:text-gray-900": "hover:text-fg",

  // ── Light idiom ─────────────────────────────────────────────────────────
  "bg-white": "bg-surface",
  "bg-gray-50": "bg-canvas",
  "bg-slate-50": "bg-canvas",
  "bg-gray-100": "bg-surface-sunken",
  "bg-slate-100": "bg-surface-sunken",
  "bg-gray-200": "bg-surface-sunken",
  "text-gray-900": "text-fg",
  "text-gray-800": "text-fg",
  "text-gray-700": "text-fg",
  "text-slate-900": "text-fg",
  "text-slate-800": "text-fg",
  "text-gray-600": "text-fg-muted",
  "text-gray-500": "text-fg-muted",
  "text-gray-400": "text-fg-faint",
  "border-gray-100": "border-line",
  "border-gray-200": "border-line",
  "border-gray-300": "border-line-strong",
  "border-slate-200": "border-line",
  "border-slate-300": "border-line-strong",
  "divide-gray-100": "divide-line",
  "divide-gray-200": "divide-line",

  // ── Tail: mid-greys, skeleton fills, gradient stops, stone ──────────────
  // These are neutral *weights*, not surfaces: they encode "disabled",
  // "skeleton", "divider". They map onto the same neutral ramp.
  "text-slate-700": "text-fg-muted",
  "text-gray-300": "text-fg-faint",
  "text-gray-200": "text-fg-muted",
  "text-stone-800": "text-fg",
  "text-stone-500": "text-fg-faint",
  "bg-gray-400": "bg-line-strong",
  "bg-gray-300": "bg-line",
  "bg-gray-500": "bg-line-strong",
  "bg-gray-600": "bg-surface-hover",
  "bg-gray-700": "bg-surface-sunken",
  "bg-gray-800": "bg-surface-sunken",
  "bg-gray-25": "bg-canvas",
  "bg-slate-600": "bg-surface-hover",
  "bg-slate-500": "bg-line-strong",
  "bg-slate-400/10": "bg-surface-hover",
  "bg-stone-100": "bg-surface-sunken",
  "border-slate-100": "border-line",
  "border-slate-400": "border-line-strong",
  "border-slate-400/25": "border-line",
  "border-slate-400/20": "border-line",
  "border-slate-500/40": "border-line-strong",
  "ring-gray-500": "ring-line-focus",
  "ring-slate-500": "ring-line-focus",
  "ring-slate-900": "ring-line",
  "from-slate-950": "from-canvas",
  "to-slate-900": "to-surface",
  "via-slate-900": "via-surface",
  "from-gray-700": "from-surface-hover",
  "to-gray-800": "to-surface-sunken",
  // Bare `border-white` last: the alpha forms above must win first.
  "border-white": "border-line-strong",

  // ── Brand ───────────────────────────────────────────────────────────────
  "bg-blue-600": "bg-brand",
  "bg-blue-500": "bg-brand",
  "bg-blue-700": "bg-brand-hover",
  "bg-blue-50": "bg-brand-soft",
  "bg-blue-100": "bg-brand-soft",
  "text-blue-600": "text-brand-fg",
  "text-blue-700": "text-brand-fg",
  "text-blue-800": "text-brand-fg",
  "border-blue-200": "border-brand-border",
  "border-blue-300": "border-brand-border",
  "ring-blue-500": "ring-brand",

  // ── Status ──────────────────────────────────────────────────────────────
  "bg-red-50": "bg-danger-soft",
  "bg-red-100": "bg-danger-soft",
  "text-red-600": "text-danger-fg",
  "text-red-700": "text-danger-fg",
  "text-red-800": "text-danger-fg",
  "border-red-200": "border-danger-border",
  "bg-green-50": "bg-success-soft",
  "bg-green-100": "bg-success-soft",
  "text-green-600": "text-success-fg",
  "text-green-700": "text-success-fg",
  "text-green-800": "text-success-fg",
  "border-green-200": "border-success-border",
  "bg-amber-50": "bg-warning-soft",
  "bg-amber-100": "bg-warning-soft",
  "text-amber-600": "text-warning-fg",
  "text-amber-700": "text-warning-fg",
  "border-amber-200": "border-warning-border",
};

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"]);

/**
 * A solid fill in the same class string means `text-white` is *on a colour*, not
 * body text — so it must become `text-on-brand` (white in both themes) rather
 * than `text-fg` (dark in the light theme).
 */
const SOLID_FILL =
  /(?:^|[\s"'`])(?:bg-(?:brand|blue|red|green|emerald|amber|orange|rose|indigo|violet|purple|cyan|teal|sky)-(?:5|6|7)\d\d|bg-gradient-to-|from-(?:brand|blue|red|green|amber|orange|rose|indigo|violet|purple|cyan|teal|sky)-)/;

function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Splits a source file into code and string segments.
 *
 * The codemod must only rewrite class names, never prose. A blunt global replace
 * would also hit `// bg-white looks wrong here` and `"bg-white"` in an aria-label
 * lookup table, and it could not tell whether a `text-white` sits on a fill.
 */
function splitStrings(source) {
  const segments = [];
  let buffer = "";
  let index = 0;

  const push = (text, isString) => {
    if (text) segments.push({ text, isString });
  };

  while (index < source.length) {
    const char = source[index];

    // Comments are code as far as the codemod is concerned — leave them alone.
    if (char === "/" && source[index + 1] === "/") {
      push(buffer, false);
      buffer = "";
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      push(source.slice(index, stop), "comment");
      index = stop;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      push(buffer, false);
      buffer = "";
      const end = source.indexOf("*/", index);
      const stop = end === -1 ? source.length : end + 2;
      push(source.slice(index, stop), "comment");
      index = stop;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      push(buffer, false);
      buffer = "";
      push(char, false); // opening delimiter, preserved verbatim
      let cursor = index + 1;
      let body = "";
      while (cursor < source.length) {
        const current = source[cursor];
        if (current === "\\") {
          body += source.slice(cursor, cursor + 2);
          cursor += 2;
          continue;
        }
        if (current === char) break;
        body += current;
        cursor += 1;
      }
      push(body, "string");
      if (cursor < source.length) push(source[cursor], false); // closing delimiter
      index = cursor + 1;
      continue;
    }

    buffer += char;
    index += 1;
  }

  push(buffer, false);
  return segments;
}

/** Escapes a literal for use inside a RegExp. */
function escapeRegex(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Anchors a utility on class boundaries. */
function toRegex(pattern) {
  return new RegExp(`(?<![\\w-])${escapeRegex(pattern)}(?![\\w-])`, "g");
}

/**
 * Replaces one mapping.
 *
 * Two shapes, because `String.replace` only rewrites the *matched* span:
 *
 *  - `bg-white` → `bg-surface`. The `/70` in `bg-white/70` is outside the match,
 *    so it survives on its own — the replacement must NOT re-append it.
 *  - `border-white/10` → `border-line`. Here the alpha *is* the mapping, so the
 *    suffix has to be part of the match in order to be consumed and dropped.
 */
function buildReplacer(from, to) {
  const slash = from.indexOf("/");
  if (slash === -1) {
    const regex = toRegex(from);
    return (source) => source.replace(regex, to);
  }

  const base = from.slice(0, slash);
  const alpha = from.slice(slash);
  const regex = toRegex(`${base}${alpha}`);
  return (source) => source.replace(regex, to);
}

/**
 * Transforms one class string.
 *
 * `text-white` is resolved first, while the fills are still in their original
 * spelling, and it is the only mapping whose target depends on context.
 */
function transformString(content) {
  const onFill = SOLID_FILL.test(content);
  let out = buildReplacer("text-white", onFill ? "text-on-brand" : "text-fg")(content);
  for (const [from, to] of Object.entries(MAP)) {
    out = buildReplacer(from, to)(out);
  }
  return out;
}

const args = process.argv.slice(2);
const write = args.includes("--write");
const checkOnly = args.includes("--check");
const targets = args.filter((arg) => !arg.startsWith("--"));

const files = (targets.length > 0 ? targets : [ROOT]).flatMap((target) => collect(target));
let changedFiles = 0;
let changedLines = 0;
let onBrandCount = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");

  const segments = splitStrings(original);
  const next = segments
    .map((segment) => {
      if (segment.isString !== "string") return segment.text;
      if (!/[a-z]/.test(segment.text)) return segment.text;
      const transformed = transformString(segment.text);
      if (transformed !== segment.text) {
        onBrandCount += (transformed.match(/text-on-brand/g) || []).length;
      }
      return transformed;
    })
    .join("");

  if (next !== original) {
    const before = original.split("\n");
    const after = next.split("\n");
    let delta = 0;
    for (let i = 0; i < before.length; i += 1) if (before[i] !== after[i]) delta += 1;

    changedFiles += 1;
    changedLines += delta;
    if (!checkOnly) {
      console.log(`${write ? "edited" : "would edit"}  ${relative(process.cwd(), file)}  (${delta} lines)`);
    }
    if (write) writeFileSync(file, next, "utf8");
  }
}

console.log("");
console.log(`files scanned      : ${files.length}`);
console.log(`files with literals: ${changedFiles}`);
console.log(`lines changed      : ${changedLines}`);
console.log(`text-on-brand      : ${onBrandCount}`);
console.log(`mode               : ${write ? "WRITE" : checkOnly ? "CHECK" : "DRY RUN"}`);

if (checkOnly && changedFiles > 0) process.exit(1);
