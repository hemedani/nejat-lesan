/**
 * Sample series for the landing page.
 *
 * These are *illustrative*, and every card that renders them says so. They mirror
 * the figures used by `AllChartsModal` so a visitor who opens the catalogue does
 * not see two different stories about the same dataset.
 *
 * Display strings are pre-formatted with Persian digits on purpose: the landing
 * page is server-rendered, and running `toLocaleString("fa-IR")` at render time
 * would make the markup depend on the Node ICU build and risk a hydration
 * mismatch on a page that has no reason to carry one.
 */

/** Month names, فروردین → اسفند. */
export const MONTH_LABELS = [
  "فرو",
  "ارد",
  "خرد",
  "تیر",
  "مرد",
  "شهر",
  "مهر",
  "آبا",
  "آذر",
  "دی",
  "بهم",
  "اسف",
] as const;

/** جرحی / فوتی per month — the summer peak is the story this chart tells. */
export const MONTHLY_INJURY = [1850, 1720, 2010, 2340, 2180, 2560, 2890, 2750, 2430, 2100, 1920, 1680];
export const MONTHLY_FATAL = [320, 290, 355, 410, 380, 445, 520, 495, 430, 370, 310, 285];

/** 24 hourly averages — two commuter peaks, a quiet 03:00 trough. */
export const HOURLY_LABELS = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
  "۱۰",
  "۱۱",
  "۱۲",
  "۱۳",
  "۱۴",
  "۱۵",
  "۱۶",
  "۱۷",
  "۱۸",
  "۱۹",
  "۲۰",
  "۲۱",
  "۲۲",
  "۲۳",
] as const;

export const HOURLY = [
  18, 12, 8, 6, 9, 14, 28, 65, 78, 55, 42, 48, 62, 58, 45, 52, 74, 95, 88, 72, 60, 48, 35, 25,
];

/**
 * Severity split, in shares only.
 *
 * Deliberately no absolute total: the page states the real catalogue size
 * (52,800+) in the hero, and a sample total here would contradict it. The share
 * is the message anyway.
 */
export const SEVERITY_SPLIT = [
  { label: "خسارتی", share: 9, color: "var(--chart-1)" },
  { label: "جرحی", share: 72, color: "var(--chart-4)" },
  { label: "فوتی", share: 19, color: "var(--danger)" },
] as const;

/** Weekday × 3-hour bucket intensity, 0…1. پنجشنبه ۱۸–۲۱ is the dark red cell. */
export const WEEKDAY_LABELS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"] as const;

export const HOUR_BUCKETS = ["۰–۳", "۳–۶", "۶–۹", "۹–۱۲", "۱۲–۱۵", "۱۵–۱۸", "۱۸–۲۱", "۲۱–۲۴"] as const;

export const WEEK_HEATMAP: number[][] = [
  [0.05, 0.05, 0.35, 0.3, 0.25, 0.45, 0.6, 0.3],
  [0.05, 0.06, 0.4, 0.3, 0.25, 0.5, 0.65, 0.32],
  [0.04, 0.05, 0.38, 0.28, 0.24, 0.48, 0.62, 0.3],
  [0.05, 0.05, 0.42, 0.3, 0.26, 0.52, 0.68, 0.34],
  [0.06, 0.06, 0.45, 0.32, 0.3, 0.58, 0.75, 0.4],
  [0.08, 0.08, 0.4, 0.35, 0.4, 0.7, 0.95, 0.6],
  [0.1, 0.08, 0.2, 0.25, 0.3, 0.45, 0.55, 0.35],
];

/** Top provinces by report count; widths are relative to the largest. */
export const PROVINCE_RANK = [
  { name: "تهران", valueLabel: "۴٬۸۵۰", width: 100 },
  { name: "اصفهان", valueLabel: "۳٬۹۲۰", width: 81 },
  { name: "خراسان رضوی", valueLabel: "۳٬۵۸۰", width: 74 },
  { name: "فارس", valueLabel: "۳٬۱۲۰", width: 64 },
  { name: "آذربایجان شرقی", valueLabel: "۲٬۸۷۰", width: 59 },
  { name: "مازندران", valueLabel: "۲٬۶۴۰", width: 54 },
] as const;

/** Contributing-cause share, used by the stacked bar. */
export const CAUSE_SPLIT = [
  { label: "عامل انسانی", share: 61, color: "var(--danger)" },
  { label: "خودرو", share: 24, color: "var(--chart-4)" },
  { label: "راه و محیط", share: 15, color: "var(--chart-1)" },
] as const;
