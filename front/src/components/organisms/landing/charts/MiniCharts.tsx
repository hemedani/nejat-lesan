import React from "react";

/**
 * Landing-page chart primitives.
 *
 * Deliberately *not* ApexCharts. The catalogue modal already owns the real
 * charting library and loads it on demand; putting six instances of it on the
 * first screen would ship ~500 KB of JS to render six decorative figures. These
 * are plain SVG/HTML, so they cost zero JavaScript, render on the server, and
 * still read as real charts.
 *
 * Colour is passed in as a CSS value (`var(--chart-1)`, `var(--danger)`), never
 * as a hex literal — the SVG inherits the document's theme, so a theme switch
 * repaints them without a re-render. That is the one thing ApexCharts cannot do,
 * and it is the reason these exist.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Hourly trend — smooth area. The two commuter peaks are the story.
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_W = 100;
const VIEW_H = 40;
const PAD_Y = 6;

function toPoints(data: readonly number[], min: number, max: number): Array<[number, number]> {
  const span = max - min || 1;
  const step = data.length > 1 ? VIEW_W / (data.length - 1) : 0;
  return data.map((value, index) => [
    index * step,
    VIEW_H - PAD_Y - ((value - min) / span) * (VIEW_H - PAD_Y * 2),
  ]);
}

/** Catmull-Rom → cubic bézier. Tension is fixed; this is decoration, not a plot library. */
function smoothPath(points: Array<[number, number]>): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.16;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

interface HourTrendProps {
  /** Unique per instance — two SVGs with the same gradient id collide. */
  id: string;
  data: readonly number[];
  color?: string;
  /** Indices to mark with a vertical band (the peaks). */
  peaks?: readonly number[];
  className?: string;
}

export function HourTrend({
  id,
  data,
  color = "var(--chart-1)",
  peaks = [],
  className = "",
}: HourTrendProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = toPoints(data, min, max);
  const line = smoothPath(points);
  const area = `${line} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`;
  const step = VIEW_W / Math.max(data.length - 1, 1);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className={`h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Baseline grid — three hairlines, enough to read height without noise. */}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1="0"
          x2={VIEW_W}
          y1={VIEW_H * ratio}
          y2={VIEW_H * ratio}
          stroke="var(--chart-grid)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {peaks.map((index) => (
        <rect
          key={index}
          x={index * step - step * 1.1}
          y="0"
          width={step * 2.2}
          height={VIEW_H}
          fill={color}
          opacity="0.08"
        />
      ))}

      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly stacked columns — injury volume with the fatal share capped on top.
// Two magnitudes on one axis, so the cap is the share, not a second scale.
// ─────────────────────────────────────────────────────────────────────────────

interface MonthColumnsProps {
  months: readonly string[];
  injury: readonly number[];
  fatal: readonly number[];
  className?: string;
}

export function MonthColumns({ months, injury, fatal, className = "" }: MonthColumnsProps) {
  const totals = injury.map((value, index) => value + fatal[index]);
  const max = Math.max(...totals);
  const peak = totals.indexOf(max);

  return (
    <div className={className}>
      <div className="flex h-28 items-end gap-[3px]">
        {totals.map((total, index) => {
          const injuryShare = (injury[index] / total) * 100;
          return (
            <div
              key={months[index]}
              className="group/bar relative flex flex-1 flex-col justify-end overflow-hidden rounded-t-[3px]"
              style={{ height: `${Math.max((total / max) * 100, 4)}%` }}
            >
              <div
                className="w-full rounded-t-[3px]"
                style={{
                  height: `${100 - injuryShare}%`,
                  background: "var(--danger)",
                  opacity: index === peak ? 1 : 0.72,
                }}
              />
              <div
                className="w-full"
                style={{
                  height: `${injuryShare}%`,
                  backgroundImage:
                    "linear-gradient(to top, var(--chart-1), color-mix(in oklab, var(--chart-1) 45%, transparent))",
                  opacity: index === peak ? 1 : 0.8,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-fg-faint">
        {[0, 3, 6, 9, 11].map((index) => (
          <span key={months[index]}>{months[index]}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity donut — the share is the message, so the centre carries the total.
// ─────────────────────────────────────────────────────────────────────────────

interface DonutProps {
  items: ReadonlyArray<{ label: string; share: number; color: string }>;
  centerValue: string;
  centerLabel: string;
  className?: string;
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SeverityDonut({ items, centerValue, centerLabel, className = "" }: DonutProps) {
  let offset = 0;

  return (
    <div className={`relative mx-auto h-32 w-32 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--chart-grid)"
          strokeWidth="11"
        />
        {items.map((item) => {
          const length = (item.share / 100) * CIRCUMFERENCE;
          const dash = `${Math.max(length - 3, 0)} ${CIRCUMFERENCE}`;
          const segment = (
            <circle
              key={item.label}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={item.color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-fg">{centerValue}</span>
        <span className="text-[10px] text-fg-faint">{centerLabel}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekday × 3h heatmap — HTML cells, not SVG, so Persian labels stay RTL-native.
// ─────────────────────────────────────────────────────────────────────────────

interface HeatmapProps {
  weekdays: readonly string[];
  buckets: readonly string[];
  matrix: readonly (readonly number[])[];
  className?: string;
}

export function WeekHeatmap({ weekdays, buckets, matrix, className = "" }: HeatmapProps) {
  return (
    <div className={className}>
      <div className="flex gap-1.5">
        <div className="flex flex-col justify-around pb-4 text-[9px] text-fg-faint">
          {weekdays.map((day) => (
            <span key={day} className="h-3.5 leading-[14px]">
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            {matrix.map((row, rowIndex) => (
              <div key={weekdays[rowIndex]} className="flex gap-1">
                {row.map((value, columnIndex) => (
                  <div
                    key={buckets[columnIndex]}
                    className="h-3.5 flex-1 rounded-[3px]"
                    style={{ background: "var(--danger)", opacity: 0.06 + value * 0.94 }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1 text-[9px] text-fg-faint">
            {buckets.map((bucket) => (
              <span key={bucket} className="flex-1 text-center">
                {bucket}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ranked bars — a table that happens to be a chart.
// ─────────────────────────────────────────────────────────────────────────────

interface RankedBarsProps {
  items: ReadonlyArray<{ name: string; valueLabel: string; width: number }>;
  className?: string;
}

export function RankedBars({ items, className = "" }: RankedBarsProps) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <li key={item.name} className="flex items-center gap-2 text-[10px]">
          <span className="w-3 shrink-0 text-fg-faint">{index + 1}</span>
          <span className="w-20 shrink-0 truncate text-fg-muted">{item.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${item.width}%`,
                backgroundImage:
                  "linear-gradient(to left, var(--chart-1), color-mix(in oklab, var(--chart-1) 40%, transparent))",
              }}
            />
          </span>
          <span className="w-10 shrink-0 text-left font-mono text-fg" dir="ltr">
            {item.valueLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 100 % share bar — cause attribution in one line.
// ─────────────────────────────────────────────────────────────────────────────

interface ShareBarProps {
  items: ReadonlyArray<{ label: string; share: number; color: string }>;
  className?: string;
}

export function ShareBar({ items, className = "" }: ShareBarProps) {
  return (
    <div className={className}>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.share}%`, background: item.color }}
            className="h-full"
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            <span className="text-fg-muted">{item.label}</span>
            <span className="ms-auto font-mono text-fg">{item.share}٪</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
