#!/usr/bin/env node
/**
 * Chart-theme codemod — moves ApexCharts colours from hex literals onto
 * `useChartTheme()`.
 *
 *   node scripts/chart-theme-codemod.mjs            # dry run
 *   node scripts/chart-theme-codemod.mjs --write
 *
 * Design: docs/superpowers/specs/2026-11-01-theme-architecture-design.md
 *
 * Why this is a separate pass from `theme-codemod.mjs`
 * ---------------------------------------------------
 * ApexCharts renders its own SVG and writes `fill`/`stroke` attributes from a
 * JavaScript options object. No stylesheet reaches it, so a CSS token is useless
 * here: the colours have to be resolved to strings at runtime. That means
 * inserting a hook, which is a structural edit, not a class rename.
 *
 * Only *chrome* is rewritten automatically — grid, axis, label, tooltip and
 * data-label colours. Series palettes are left alone and reported: a colour that
 * encodes "with fault" vs "without fault" is a design decision, not a rename.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["src/components/charts", "src/app/charts", "src/components/dashboards"];
const IMPORT_LINE = 'import { useChartTheme } from "@/utils/chart-theme";';
const HOOK_LINE = "const chartTheme = useChartTheme();";

/**
 * Chrome colours. Keyed by lowercase hex so `#E5E7EB` and `#e5e7eb` share a row.
 * Each value is an expression evaluated inside the component.
 */
const CHROME = {
  "#374151": "chartTheme.label", // gray-700  legend / axis labels
  "#6b7280": "chartTheme.label", // gray-500  totals, secondary labels
  "#9ca3af": "chartTheme.faint", // gray-400  captions
  "#111827": "chartTheme.fg", // gray-900  pie centre value
  "#1f2937": "chartTheme.fg", // gray-800  headings, values
  "#e5e7eb": "chartTheme.grid", // gray-200  grid lines, axis borders
  "#d1d5db": "chartTheme.axisLine", // gray-300  axis ticks
  // The near-white end of the gray/slate ramps. Easy to miss because they are
  // *nearly* invisible on a light card and read as "no border at all" — on a
  // dark card they are a bright hairline.
  "#f3f4f6": "chartTheme.grid", // gray-100
  "#f1f5f9": "chartTheme.grid", // slate-100
  "#f8fafc": "chartTheme.grid", // slate-50
  "#e2e8f0": "chartTheme.axisLine", // slate-200  axis borders / ticks
  "#cbd5e1": "chartTheme.label", // slate-300  dim labels
  "#ffffff": "chartTheme.onFill", // data labels on a coloured slice
};

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"]);

function collect(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Replaces `'#abc123'` / `"#ABC123"` with an expression, keeping the quote style irrelevant. */
function replaceHex(source) {
  let replaced = 0;
  const next = source.replace(/(['"])(#[0-9a-fA-F]{3,8})\1/g, (match, _quote, hex) => {
    const target = CHROME[hex.toLowerCase()];
    if (!target) return match;
    replaced += 1;
    return target;
  });
  return { next, replaced };
}

/**
 * Hides module-level series palettes from the chrome pass.
 *
 * `const COLORS = ["#3B82F6", …, "#6B7280"]` is a *categorical* palette: the
 * grey is the "other" series, not a label colour. Rewriting it to
 * `chartTheme.label` both destroys the palette and moves a runtime reference
 * into module scope, where no hook exists. The same hex legitimately means
 * chrome in `labels: { colors: "#6B7280" }`, so the fix cannot be a smarter
 * map — the palette has to be excluded by shape.
 */
const PALETTE_BLOCK = /^const\s+[A-Z][A-Z0-9_]*\s*=\s*\[[\s\S]*?^\];?/gm;

function maskPalettes(source) {
  const masked = [];
  const next = source.replace(PALETTE_BLOCK, (block) => {
    const token = `/*__PALETTE_${masked.length}__*/`;
    masked.push(block);
    return token;
  });
  return { next, masked };
}

function unmaskPalettes(source, masked) {
  return source.replace(/\/\*__PALETTE_(\d+)__\*\//g, (_m, i) => masked[Number(i)]);
}

/** `theme: 'light'` → `theme: chartTheme.mode`. */
function replaceApexThemeMode(source) {
  return source.replace(/(\btheme:\s*)(['"])(light|dark)\2/g, "$1chartTheme.mode");
}

/** Inserts the import after the last import statement. */
function addImport(source) {
  if (source.includes("useChartTheme")) return source;
  const lines = source.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*import\s/.test(lines[i]) || /^\s*}\s*from\s+['"]/.test(lines[i])) last = i;
  }
  if (last === -1) return `${IMPORT_LINE}\n${source}`;
  lines.splice(last + 1, 0, IMPORT_LINE);
  return lines.join("\n");
}

/**
 * Inserts the hook call at the top of the component body.
 *
 * Most of these components have no hooks at all — they build their options
 * inline — so there is no hook to anchor to. The anchor is instead the line that
 * opens the component body: the first line ending in `=> {` or `) {` after the
 * declaration. A bare `({` (the start of a destructured parameter list) does not
 * match, which is what keeps the insert out of a multi-line signature.
 *
 * It has to be the first statement: these components return early for the
 * loading and empty states, and a hook may not follow a conditional return.
 */
function addHook(source) {
  if (source.includes(HOOK_LINE)) return { source, inserted: true };

  const lines = source.split("\n");
  const declIndex = lines.findIndex((line) =>
    /^\s*(?:export\s+)?(?:default\s+)?(?:const|function)\s+[A-Z][\w$]*/.test(line),
  );
  if (declIndex === -1) return { source, inserted: false };

  let bodyIndex = -1;
  for (let i = declIndex; i < lines.length; i += 1) {
    if (/(?:=>\s*\{|\)\s*\{\s*)\s*$/.test(lines[i])) {
      bodyIndex = i;
      break;
    }
  }
  if (bodyIndex === -1) return { source, inserted: false };

  const indent = `${/^\s*/.exec(lines[bodyIndex])[0]}  `;
  lines.splice(bodyIndex + 1, 0, `${indent}${HOOK_LINE}`, "");
  return { source: lines.join("\n"), inserted: true };
}

const args = process.argv.slice(2);
const write = args.includes("--write");

/**
 * Explicit paths win over the roots, so a single file can be re-run after a
 * manual edit. `theme-codemod.mjs` behaves the same way.
 */
const explicit = args.filter((arg) => !arg.startsWith("--"));
const files = explicit.length > 0 ? explicit : ROOTS.flatMap((root) => collect(root));
let touched = 0;
const unresolved = [];
const noHook = [];

for (const file of files) {
  const original = readFileSync(file, "utf8");
  /**
   * `ApexOptions` used to be the filter, which silently skipped every chart that
   * builds its options object without a type annotation — nine files, including
   * the whole temporal family. Match on the library import instead.
   */
  if (!/ApexOptions|react-apexcharts/.test(original)) continue;

  const { next: maskedSource, masked } = maskPalettes(original);

  let next = replaceApexThemeMode(maskedSource);
  const hexResult = replaceHex(next);
  // Unmask *before* the no-op check, otherwise the placeholder comments alone
  // make every file with a palette look modified.
  next = unmaskPalettes(hexResult.next, masked);

  if (next === original) continue;

  next = addImport(next);
  const hooked = addHook(next);
  next = hooked.source;
  if (!hooked.inserted) noHook.push(relative(process.cwd(), file));

  // Whatever hex is left is a series palette or a chart-specific scale.
  const leftovers = [...next.matchAll(/(['"])(#[0-9a-fA-F]{3,8})\1/g)].map((m) => m[2]);
  if (leftovers.length > 0) {
    unresolved.push({ file: relative(process.cwd(), file), hexes: leftovers, count: hexResult.replaced });
  }

  touched += 1;
  if (write) writeFileSync(file, next, "utf8");
  else console.log(`would edit  ${relative(process.cwd(), file)}  (${hexResult.replaced} chrome hex)`);
}

console.log("");
console.log(`files rewritten    : ${touched}`);
console.log(`mode               : ${write ? "WRITE" : "DRY RUN"}`);

if (noHook.length > 0) {
  console.log("");
  console.log(`NO HOOK ANCHOR (${noHook.length}) — insert \`${HOOK_LINE}\` by hand:`);
  for (const file of noHook) console.log(`  ${file}`);
}

if (unresolved.length > 0) {
  console.log("");
  console.log(`SERIES / SCALE HEX LEFT (${unresolved.length} files) — decide per chart:`);
  for (const item of unresolved.slice(0, 40)) {
    console.log(`  ${item.file}`);
    console.log(`    ${[...new Set(item.hexes)].join(" ")}`);
  }
  if (unresolved.length > 40) console.log(`  … and ${unresolved.length - 40} more`);
}
