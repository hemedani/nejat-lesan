"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AllChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static sample data
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_SERIES = [12480, 47230, 5640];
const SEVERITY_LABELS = ["فوتی", "جرحی", "خسارتی"];
const SEVERITY_COLORS = ["#ef4444", "#f59e0b", "#3b82f6"];

const MONTHLY_SERIES = [
  {
    name: "تصادفات فوتی",
    data: [320, 290, 355, 410, 380, 445, 520, 495, 430, 370, 310, 285],
  },
  {
    name: "تصادفات جرحی",
    data: [1850, 1720, 2010, 2340, 2180, 2560, 2890, 2750, 2430, 2100, 1920, 1680],
  },
];

const HOURLY_SERIES = [
  {
    name: "میانگین تصادفات",
    data: [
      18, 12, 8, 6, 9, 14, 28, 65, 78, 55, 42, 48, 62, 58, 45, 52, 74, 95, 88, 72, 60, 48, 35, 25,
    ],
  },
];

const PROVINCE_SERIES = [
  {
    name: "تعداد تصادفات",
    data: [4850, 3920, 3580, 3120, 2870, 2640, 2310, 1980, 1750, 1520],
  },
];
const PROVINCE_CATEGORIES = [
  "تهران",
  "اصفهان",
  "خراسان رضوی",
  "فارس",
  "آذربایجان شرقی",
  "مازندران",
  "گیلان",
  "کرمان",
  "البرز",
  "خوزستان",
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared dark-theme ApexCharts base options
// Cast via unknown to avoid version-specific ApexChart property mismatches
// ─────────────────────────────────────────────────────────────────────────────
const darkBaseOptions = {
  chart: {
    background: "transparent",
    fontFamily: "Vazir, sans-serif",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, easing: "easeinout", speed: 800 },
  },
  theme: { mode: "dark" },
  grid: {
    borderColor: "rgba(255,255,255,0.05)",
    strokeDashArray: 4,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } },
  },
  tooltip: {
    theme: "dark",
    style: { fontSize: "13px", fontFamily: "Vazir, sans-serif" },
  },
} as unknown as ApexOptions;

// ─────────────────────────────────────────────────────────────────────────────
// Chart 1 – Accident Severity Donut
// ─────────────────────────────────────────────────────────────────────────────
const severityChartOptions: ApexOptions = {
  ...darkBaseOptions,
  chart: { ...darkBaseOptions.chart, type: "donut" },
  colors: SEVERITY_COLORS,
  labels: SEVERITY_LABELS,
  legend: {
    position: "bottom",
    fontSize: "14px",
    fontFamily: "Vazir, sans-serif",
    labels: { colors: "#94a3b8" },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "مجموع",
            fontSize: "15px",
            fontFamily: "Vazir, sans-serif",
            fontWeight: 600,
            color: "#94a3b8",
            formatter: () => "۶۵,۳۵۰",
          },
          value: {
            show: true,
            fontSize: "26px",
            fontFamily: "Vazir, sans-serif",
            fontWeight: 700,
            color: "#f1f5f9",
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}٪`,
    style: { fontSize: "12px", fontFamily: "Vazir, sans-serif", fontWeight: "600", colors: ["#fff"] },
    dropShadow: { enabled: true, opacity: 0.4 },
  },
  stroke: { width: 2, colors: ["#0f172a"] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart 2 – Monthly Trend (area)
// ─────────────────────────────────────────────────────────────────────────────
const monthlyChartOptions: ApexOptions = {
  ...darkBaseOptions,
  chart: { ...darkBaseOptions.chart, type: "area" },
  colors: ["#ef4444", "#3b82f6"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 95],
    },
  },
  stroke: { curve: "smooth", width: 2 },
  xaxis: {
    categories: [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ],
    labels: { style: { colors: "#64748b", fontFamily: "Vazir, sans-serif", fontSize: "11px" } },
    axisBorder: { color: "rgba(255,255,255,0.06)" },
    axisTicks: { color: "rgba(255,255,255,0.06)" },
  },
  yaxis: {
    labels: { style: { colors: "#64748b", fontFamily: "Vazir, sans-serif", fontSize: "11px" } },
  },
  legend: {
    position: "top",
    horizontalAlign: "right",
    fontFamily: "Vazir, sans-serif",
    fontSize: "13px",
    labels: { colors: "#94a3b8" },
  },
  markers: { size: 4, strokeWidth: 0 },
  tooltip: {
    ...darkBaseOptions.tooltip,
    x: { show: true },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart 3 – Hourly Distribution (bar)
// ─────────────────────────────────────────────────────────────────────────────
const hourlyChartOptions: ApexOptions = {
  ...darkBaseOptions,
  chart: { ...darkBaseOptions.chart, type: "bar" },
  colors: ["#3b82f6"],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: "60%",
      colors: {
        ranges: [
          { from: 80, to: 100, color: "#ef4444" },
          { from: 60, to: 79, color: "#f59e0b" },
          { from: 0, to: 59, color: "#3b82f6" },
        ],
      },
    },
  },
  xaxis: {
    categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    labels: {
      style: { colors: "#64748b", fontFamily: "Vazir, sans-serif", fontSize: "10px" },
      rotate: -45,
    },
    axisBorder: { color: "rgba(255,255,255,0.06)" },
    axisTicks: { color: "rgba(255,255,255,0.06)" },
  },
  yaxis: {
    labels: { style: { colors: "#64748b", fontFamily: "Vazir, sans-serif", fontSize: "11px" } },
  },
  legend: { show: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart 4 – Top Provinces (horizontal bar)
// ─────────────────────────────────────────────────────────────────────────────
const provinceChartOptions: ApexOptions = {
  ...darkBaseOptions,
  chart: { ...darkBaseOptions.chart, type: "bar" },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      barHeight: "55%",
      distributed: true,
    },
  },
  colors: [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#ef4444",
    "#f97316",
    "#f59e0b",
  ],
  xaxis: {
    categories: PROVINCE_CATEGORIES,
    labels: { style: { colors: "#64748b", fontFamily: "Vazir, sans-serif", fontSize: "11px" } },
    axisBorder: { color: "rgba(255,255,255,0.06)" },
    axisTicks: { color: "rgba(255,255,255,0.06)" },
  },
  yaxis: {
    labels: { style: { colors: "#94a3b8", fontFamily: "Vazir, sans-serif", fontSize: "12px" } },
  },
  legend: { show: false },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val.toLocaleString("fa-IR"),
    style: { fontSize: "11px", fontFamily: "Vazir, sans-serif", colors: ["#fff"] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Section separator component
// ─────────────────────────────────────────────────────────────────────────────
function SectionDivider() {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export const AllChartsModal: React.FC<AllChartsModalProps> = ({ isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* ── Backdrop ── */
    <div
      dir="rtl"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[10000] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Container ── */}
      <div className="max-w-6xl w-full h-[90vh] bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_80px_rgba(59,130,246,0.1)]">
        {/* ── Sticky Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Decorative icon */}
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
                کاتالوگ جامع تحلیل‌ها و هوش بصری
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سامانه مرصاد — نمای کامل داده‌های تصادفات
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="بستن"
            className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span>بستن</span>
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
        >
          <div className="flex flex-col gap-24 p-8 md:p-12">
            {/* ════════════════════════════════════════════════════════
                SECTION 1 — Accident Severity
            ════════════════════════════════════════════════════════ */}
            <section>
              {/* Section badge */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  تحلیل شدت
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-blue-500/20" />
              </div>

              {/* Chart card */}
              <div className="rounded-2xl bg-slate-800/40 border border-white/8 p-6 md:p-8 mb-8 hover:border-blue-500/20 transition-colors duration-500">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">سهم شدت تصادفات</h3>
                    <p className="text-sm text-slate-400">توزیع درصدی بر اساس نوع شدت حادثه</p>
                  </div>
                  {/* Summary chips */}
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> فوتی — ۱۲,۴۸۰
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> جرحی — ۴۷,۲۳۰
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> خسارتی — ۵,۶۴۰
                    </span>
                  </div>
                </div>

                <div className="h-[380px]">
                  <Chart
                    options={severityChartOptions}
                    series={SEVERITY_SERIES}
                    type="donut"
                    height="100%"
                  />
                </div>
              </div>

              {/* Strategic insight block */}
              <div className="space-y-5">
                {/* Headline */}
                <h4 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  بینش استراتژیک: چرا توزیع شدت تصادفات اهمیت دارد؟
                </h4>

                {/* Description paragraphs */}
                <div className="text-slate-300 leading-8 text-base space-y-3">
                  <p>
                    داده‌های سامانه مرصاد نشان می‌دهد که تصادفات جرحی با سهم ۷۲٪ بیشترین حجم را در میان
                    حوادث ترافیکی به خود اختصاص می‌دهند، که این رقم هشداری جدی برای سیاست‌گذاران حوزه
                    ایمنی ترافیک محسوب می‌شود.
                  </p>
                  <p>
                    وجود ۱۲,۴۸۰ تصادف فوتی در یک دوره سالانه، معادل میانگین ۳۴ فوتی در روز است و ضرورت
                    تمرکز منابع امدادی و اجرای قوانین سخت‌گیرانه‌تر در نقاط حادثه‌خیز را دوچندان
                    می‌کند.
                  </p>
                  <p>
                    نسبت پایین تصادفات خسارتی (۸٪) نسبت به مجموع حوادث، حاکی از آن است که اکثریت
                    تصادفات ثبت‌شده منجر به آسیب جانی شده‌اند و نظام پاسخ‌گویی اضطراری باید متناسب با
                    این ترکیب طراحی شود.
                  </p>
                  <p>
                    تحلیل روند سه‌ساله این اعداد نشان می‌دهد که اجرای طرح‌های کنترل سرعت و نصب
                    دوربین‌های هوشمند در کریدورهای پرخطر، کاهش ۱۴٪ در شاخص فوتی ایجاد کرده است.
                  </p>
                </div>

                {/* Actionable outcome box */}
                <div className="mt-6 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-blue-300 font-bold text-base mb-3">
                        دستاوردهای عملیاتی برای مدیریت ترافیک
                      </h5>
                      <ul className="space-y-2.5 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            تخصیص هدفمند آمبولانس‌ها و تیم‌های فوری در محورهایی با بالاترین نسبت
                            فوتی-جرحی
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            بازطراحی مهندسی ترافیک در تقاطع‌هایی که شاخص تبدیل «خسارتی به فوتی» بالاست
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            طراحی کمپین‌های آموزشی متمرکز بر کاهش شدت حوادث از طریق استفاده از کمربند
                            ایمنی و کاهش سرعت
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            پیش‌بینی بودجه سالانه درمان و پزشکی قانونی بر اساس نسبت واقعی شدت تصادفات
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* ════════════════════════════════════════════════════════
                SECTION 2 — Monthly Trend
            ════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  روند ماهانه
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-cyan-500/20" />
              </div>

              <div className="rounded-2xl bg-slate-800/40 border border-white/8 p-6 md:p-8 mb-8 hover:border-cyan-500/20 transition-colors duration-500">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">روند ماهانه تصادفات در طول سال</h3>
                  <p className="text-sm text-slate-400">مقایسه تصادفات فوتی و جرحی به تفکیک ماه</p>
                </div>
                <div className="h-[340px]">
                  <Chart
                    options={monthlyChartOptions}
                    series={MONTHLY_SERIES}
                    type="area"
                    height="100%"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                  بینش استراتژیک: فصلی‌بودن حوادث و اثر آن بر برنامه‌ریزی
                </h4>
                <div className="text-slate-300 leading-8 text-base space-y-3">
                  <p>
                    نمودار روند ماهانه به وضوح نشان می‌دهد که ماه‌های مهر و آبان اوج تصادفات را در پی
                    دارند که با آغاز فصل سرما، کاهش دید و افزایش ترافیک همزمان می‌شود.
                  </p>
                  <p>
                    فصل تابستان با وجود مسافرت‌های نوروزی، شاخص تصادفات جرحی را به بالاترین نقطه سال
                    می‌رساند و مدیریت ترافیک بین‌شهری را در این بازه حیاتی می‌کند.
                  </p>
                  <p>
                    کاهش قابل توجه تصادفات در ماه‌های اسفند و بهمن با کاهش ترافیک اداری و فعالیت‌های
                    روزمره همخوانی دارد و بیانگر اثر مستقیم حجم ترافیک بر میزان حوادث است.
                  </p>
                  <p>
                    تحلیل دقیق‌تر این روند در مقیاس ساعتی و روزانه این داده را قابل اجرا برای تنظیم
                    شیف‌های گشت پلیس و تعدیل برنامه اورژانس جاده‌ای می‌کند.
                  </p>
                </div>
                <div className="mt-6 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-cyan-300 font-bold text-base mb-3">
                        دستاوردهای عملیاتی برای برنامه‌ریزی فصلی
                      </h5>
                      <ul className="space-y-2.5 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            افزایش موقت نیروهای گشت جاده‌ای در ماه‌های اوج (مهر–آبان) بر اساس پیش‌بینی
                            داده‌محور
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            برگزاری کمپین‌های فصلی ایمنی پیش از ماه‌های پرریسک برای آمادگی رانندگان
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            تنظیم تامین بودجه تعمیر و نگهداری جاده‌ها قبل از ماه‌های سرد و بارش زیاد
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* ════════════════════════════════════════════════════════
                SECTION 3 — Hourly Distribution
            ════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  توزیع ساعتی
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/20" />
              </div>

              <div className="rounded-2xl bg-slate-800/40 border border-white/8 p-6 md:p-8 mb-8 hover:border-amber-500/20 transition-colors duration-500">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">
                    توزیع تصادفات بر اساس ساعت شبانه‌روز
                  </h3>
                  <p className="text-sm text-slate-400">
                    <span className="text-red-400 font-medium">قرمز:</span> ساعات بحرانی &nbsp;|&nbsp;
                    <span className="text-amber-400 font-medium">نارنجی:</span> ساعات پرخطر
                    &nbsp;|&nbsp;
                    <span className="text-blue-400 font-medium">آبی:</span> ساعات عادی
                  </p>
                </div>
                <div className="h-[320px]">
                  <Chart
                    options={hourlyChartOptions}
                    series={HOURLY_SERIES}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  بینش استراتژیک: ساعت‌های طلایی کنترل ترافیک
                </h4>
                <div className="text-slate-300 leading-8 text-base space-y-3">
                  <p>
                    نمودار ساعتی دو پیک مشخص را نمایش می‌دهد: پیک صبح (۷ تا ۹) مرتبط با ترافیک تردد
                    اداری، و پیک عصر (۱۷ تا ۱۹) که خطرناک‌ترین بازه زمانی با بالاترین تعداد تصادفات
                    است.
                  </p>
                  <p>
                    ساعات شب (۲۲ تا ۴ بامداد) علی‌رغم حجم پایین ترافیک، نسبت شدت تصادفات بالاتری دارند
                    که با خستگی رانندگان، کاهش دید و احتمال رانندگی پس از مصرف الکل مرتبط است.
                  </p>
                  <p>
                    بازه ۱۲ تا ۱۴ (استراحت ناهار) یک پیک کوچک‌تر اما معنادار نشان می‌دهد که نیاز به
                    حضور کافی در نقاط تجمع کارمندان و مراکز تجاری را آشکار می‌سازد.
                  </p>
                  <p>
                    این الگو امکان طراحی سیستم تخصیص پویای نیروی پلیس را فراهم می‌کند که هزینه اجرایی
                    را بدون کاهش پوشش ایمنی، تا ۲۲٪ کاهش می‌دهد.
                  </p>
                </div>
                <div className="mt-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-amber-300 font-bold text-base mb-3">
                        دستاوردهای عملیاتی برای مدیریت زمانی
                      </h5>
                      <ul className="space-y-2.5 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            برنامه‌ریزی شیفت‌های پلیس بر اساس پیک‌های ساعتی برای حداکثر حضور در
                            بازه‌های بحرانی
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            فعال‌سازی سیستم‌های هوشمند تنظیم چراغ‌های راهنمایی در ساعات اوج برای کاهش
                            تراکم
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            ارسال هوشمند هشدار به رانندگان از طریق اپلیکیشن در ساعات پرخطر شناسایی‌شده
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* ════════════════════════════════════════════════════════
                SECTION 4 — Top Provinces
            ════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  تحلیل استانی
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-500/20" />
              </div>

              <div className="rounded-2xl bg-slate-800/40 border border-white/8 p-6 md:p-8 mb-8 hover:border-purple-500/20 transition-colors duration-500">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">۱۰ استان با بیشترین تصادفات</h3>
                  <p className="text-sm text-slate-400">
                    رتبه‌بندی استان‌ها بر اساس تعداد کل حوادث ثبت‌شده
                  </p>
                </div>
                <div className="h-[400px]">
                  <Chart
                    options={provinceChartOptions}
                    series={PROVINCE_SERIES}
                    type="bar"
                    height="100%"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  بینش استراتژیک: چرخه جغرافیایی تصادفات در ایران
                </h4>
                <div className="text-slate-300 leading-8 text-base space-y-3">
                  <p>
                    استان تهران با اختلافی چشمگیر در صدر جدول تصادفات قرار دارد که ناشی از تراکم
                    جمعیتی، حجم بالای ترافیک شهری و پیچیدگی شبکه معابر است.
                  </p>
                  <p>
                    استان‌های اصفهان، خراسان رضوی و فارس در رتبه‌های بعدی قرار دارند که بازتاب وزن
                    جمعیتی و نقش محوری‌شان در شبکه لجستیک کشور است.
                  </p>
                  <p>
                    تحلیل نسبت تصادفات به جمعیت (نه عدد مطلق) در برخی استان‌های کم‌جمعیت‌تر مانند کرمان
                    و مازندران، شاخص ریسک بالاتری نشان می‌دهد که نیاز به توجه ویژه‌تر دارد.
                  </p>
                  <p>
                    توزیع جغرافیایی تصادفات یک پارامتر راهنمای کلیدی برای تخصیص بودجه اعتبارات ایمنی
                    راه‌ها در سطح ملی است و این داده باید در تهیه بودجه‌های سالانه لحاظ شود.
                  </p>
                </div>
                <div className="mt-6 p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-purple-300 font-bold text-base mb-3">
                        دستاوردهای عملیاتی برای مدیریت استانی
                      </h5>
                      <ul className="space-y-2.5 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            وزن‌دهی منطقه‌محور به توزیع بودجه ایمنی راه با اولویت استان‌های پرریسک
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            طراحی پروتکل‌های هماهنگی بین‌استانی برای محورهای مرزی با بار ترافیکی مشترک
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            تسهیم بهترین‌شیوه‌ها از استان‌های موفق در کاهش تصادفات با سایر استان‌ها از
                            طریق داشبوردهای مقایسه‌ای
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="flex-shrink-0 px-8 py-4 bg-white/3 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-500">
            داده‌های نمایش‌داده‌شده نمونه آموزشی هستند. برای داده زنده وارد داشبورد شوید.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllChartsModal;
