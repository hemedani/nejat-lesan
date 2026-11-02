"use client";

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import type { ResolvedTheme } from "@/utils/theme";
import { usePalette, type Palette } from "@/utils/use-theme-palette";

/**
 * ApexCharts cannot read CSS variables.
 *
 * It writes `fill` and `stroke` attributes into its own SVG from a JavaScript
 * options object, so a token such as `--chart-grid` never reaches the chart. The
 * library has no stylesheet hook either. Every chart therefore has to be handed
 * *concrete colour strings* — which is why 7 chart components used to hardcode
 * `theme: "light"` and a hundred-odd light-mode hex values such as `#1f2937`.
 *
 * Token resolution lives in `use-theme-palette.ts`, shared with react-select.
 * This module turns that palette into ApexCharts vocabulary.
 *
 * Rules for chart files:
 *   1. No hex colour for *chrome* — grid, axis, labels, tooltip, legend, data
 *      labels. Take them from the hook. A hex that encodes a data value (a
 *      choropleth ramp, a severity scale) is data, not chrome, and stays.
 *   2. Spread `chartTheme.options` first, then override only what is
 *      chart-specific (series, xaxis categories, plotOptions, …).
 */

export interface ChartTheme {
    mode: ResolvedTheme;
    /** Series palette, already resolved to hex/rgb strings. */
    colors: string[];
    grid: string;
    axisLine: string;
    /** The card the chart sits on — used to "cut out" marker rings. */
    surface: string;
    /**
     * One step below `surface`. Used for the *zero* stop of a sequential ramp:
     * an empty heatmap cell should read as background, not as a bright block.
     */
    surfaceSunken: string;
    /** Secondary text: axis values, legend labels, pie totals. */
    label: string;
    /** Primary text: pie centre values, chart titles. */
    fg: string;
    /** Captions and empty-state text. */
    faint: string;
    tooltipBg: string;
    tooltipFg: string;
    /** Text drawn on top of a coloured fill (pie slice labels). */
    onFill: string;
    /** Semantic fills for charts whose colours carry meaning (with/without fault). */
    brand: string;
    danger: string;
    success: string;
    warning: string;
    info: string;
    /** Themed defaults for chart / grid / axes / tooltip / legend. */
    options: ApexOptions;
}

/**
 * Themed base options.
 *
 * `chart.foreColor` covers most of ApexCharts' own text. The explicit axis and
 * legend colours are still needed because those do not inherit from `foreColor`
 * in every chart type.
 */
export function baseChartOptions(theme: Omit<ChartTheme, "options">): ApexOptions {
    return {
        chart: {
            background: "transparent",
            foreColor: theme.label,
            fontFamily: "vazir-matn, sans-serif",
            toolbar: { show: false },
            animations: { enabled: true, speed: 400 },
        },
        theme: { mode: theme.mode },
        colors: theme.colors,
        grid: {
            borderColor: theme.grid,
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        dataLabels: {
            style: {
                fontSize: "12px",
                fontWeight: "600",
                colors: [theme.onFill],
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 1,
                opacity: 0.8,
            },
        },
        stroke: { width: 2 },
        legend: {
            labels: { colors: theme.label },
            markers: { size: 10, strokeWidth: 0, shape: "square" },
            itemMargin: { horizontal: 12, vertical: 6 },
        },
        tooltip: {
            theme: theme.mode,
            style: { fontFamily: "vazir-matn, sans-serif" },
        },
        xaxis: {
            labels: {
                style: { colors: theme.label, fontFamily: "vazir-matn, sans-serif" },
            },
            axisBorder: { color: theme.axisLine },
            axisTicks: { color: theme.axisLine },
        },
        yaxis: {
            labels: {
                style: { colors: theme.label, fontFamily: "vazir-matn, sans-serif" },
            },
        },
    };
}

function buildChartTheme(palette: Palette): ChartTheme {
    const mode: ResolvedTheme =
        typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "light"
            ? "light"
            : "dark";

    const chart = {
        mode,
        colors: [
            palette["chart-1"],
            palette["chart-2"],
            palette["chart-3"],
            palette["chart-4"],
            palette["chart-5"],
            palette["chart-6"],
            palette["chart-7"],
            palette["chart-8"],
        ],
        grid: palette["chart-grid"],
        axisLine: palette["chart-axis"],
        surface: palette.surface,
        surfaceSunken: palette["surface-sunken"],
        label: palette["chart-label"],
        fg: palette.fg,
        faint: palette["fg-faint"],
        tooltipBg: palette["chart-tooltip-bg"],
        tooltipFg: palette["chart-tooltip-fg"],
        onFill: palette["on-brand"],
        brand: palette.brand,
        danger: palette.danger,
        success: palette.success,
        warning: palette.warning,
        info: palette.info,
    };

    return { ...chart, options: baseChartOptions(chart) };
}

/**
 * Resolves the current theme's chart colours and re-resolves when it changes.
 *
 * Reads the DOM attribute rather than React state on purpose: the attribute is
 * set before paint by the pre-paint script, so charts never render a frame in
 * the wrong theme — even on the first paint after a reload.
 */
export function useChartTheme(): ChartTheme {
    const palette = usePalette();
    return useMemo(() => buildChartTheme(palette), [palette]);
}
