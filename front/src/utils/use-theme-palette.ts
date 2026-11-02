"use client";

import { useEffect, useState } from "react";

/**
 * The one place that turns CSS tokens into concrete colour strings.
 *
 * Some renderers cannot use a class name at all:
 *
 *  - **ApexCharts** writes `fill`/`stroke` attributes into its own SVG from a
 *    JavaScript options object.
 *  - **react-select** builds its menu from an inline `styles` prop, and its
 *    nodes are reachable by class only for the parts it chooses to expose.
 *
 * Both need `getComputedStyle` values, both must re-resolve when the theme
 * changes, and both must produce the same answer. Doing that twice is how the
 * two halves of this app drifted apart in the first place, so it happens once,
 * here.
 *
 * Design: docs/superpowers/specs/2026-11-01-theme-architecture-design.md
 */

/** Every token a JS renderer may need. Keep in step with `globals.css`. */
export const PALETTE_TOKENS = [
  // surfaces
  "canvas",
  "surface",
  "surface-raised",
  "surface-sunken",
  "surface-hover",
  "overlay",
  // hairlines
  "line",
  "line-strong",
  "line-focus",
  // text
  "fg",
  "fg-muted",
  "fg-faint",
  "on-brand",
  // brand
  "brand",
  "brand-hover",
  "brand-soft",
  "brand-border",
  "brand-fg",
  // status
  "danger",
  "danger-soft",
  "danger-border",
  "danger-fg",
  "success",
  "success-soft",
  "success-border",
  "success-fg",
  "warning",
  "warning-soft",
  "warning-border",
  "warning-fg",
  "info",
  "info-soft",
  "info-border",
  "info-fg",
  // chart chrome
  "chart-grid",
  "chart-axis",
  "chart-label",
  "chart-tooltip-bg",
  "chart-tooltip-fg",
  // chart series
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
] as const;

export type PaletteToken = (typeof PALETTE_TOKENS)[number];
export type Palette = Record<PaletteToken, string>;

/**
 * Dark values, duplicated from `globals.css`.
 *
 * Needed for the server render, where `getComputedStyle` does not exist, and as
 * a per-token fallback if a variable is ever missing. Dark is duplicated rather
 * than light because dark is the canonical theme — see `:root` in `globals.css`.
 */
const DARK_FALLBACK: Palette = {
  canvas: "#020617",
  surface: "#0f172a",
  "surface-raised": "#0f172a",
  "surface-sunken": "#0b1220",
  "surface-hover": "rgba(255, 255, 255, 0.06)",
  overlay: "rgba(2, 6, 23, 0.72)",
  line: "rgba(255, 255, 255, 0.1)",
  "line-strong": "rgba(255, 255, 255, 0.18)",
  "line-focus": "rgba(96, 165, 250, 0.65)",
  fg: "#f8fafc",
  "fg-muted": "#94a3b8",
  "fg-faint": "#64748b",
  "on-brand": "#ffffff",
  brand: "#2563eb",
  "brand-hover": "#3b82f6",
  "brand-soft": "rgba(37, 99, 235, 0.15)",
  "brand-border": "rgba(96, 165, 250, 0.3)",
  "brand-fg": "#bfdbfe",
  danger: "#fb7185",
  "danger-soft": "rgba(251, 113, 133, 0.1)",
  "danger-border": "rgba(251, 113, 133, 0.22)",
  "danger-fg": "#fda4af",
  success: "#34d399",
  "success-soft": "rgba(52, 211, 153, 0.1)",
  "success-border": "rgba(52, 211, 153, 0.22)",
  "success-fg": "#6ee7b7",
  warning: "#fbbf24",
  "warning-soft": "rgba(251, 191, 36, 0.1)",
  "warning-border": "rgba(251, 191, 36, 0.22)",
  "warning-fg": "#fcd34d",
  info: "#38bdf8",
  "info-soft": "rgba(56, 189, 248, 0.1)",
  "info-border": "rgba(56, 189, 248, 0.22)",
  "info-fg": "#7dd3fc",
  "chart-grid": "#1e293b",
  "chart-axis": "#334155",
  "chart-label": "#94a3b8",
  "chart-tooltip-bg": "#0f172a",
  "chart-tooltip-fg": "#f8fafc",
  "chart-1": "#60a5fa",
  "chart-2": "#fb923c",
  "chart-3": "#34d399",
  "chart-4": "#fbbf24",
  "chart-5": "#a78bfa",
  "chart-6": "#f472b6",
  "chart-7": "#22d3ee",
  "chart-8": "#94a3b8",
};

export function readPalette(): Palette {
  if (typeof document === "undefined") return DARK_FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const palette = {} as Palette;
  for (const token of PALETTE_TOKENS) {
    palette[token] = style.getPropertyValue(`--${token}`).trim() || DARK_FALLBACK[token];
  }
  return palette;
}

/**
 * The resolved palette, re-read whenever `<html data-theme>` changes.
 *
 * The returned object is stable between theme changes, so it is safe to use as a
 * `useMemo` dependency without recomputing on every render.
 */
export function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(DARK_FALLBACK);

  useEffect(() => {
    const sync = () => setPalette(readPalette());
    // Watching the attribute catches both the user's choice and an OS change
    // while the preference is `system`.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    sync();
    return () => observer.disconnect();
  }, []);

  return palette;
}
