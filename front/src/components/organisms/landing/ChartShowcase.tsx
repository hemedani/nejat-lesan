"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { SectionHeading } from "./SectionHeading";
import {
  HourTrend,
  MonthColumns,
  RankedBars,
  SeverityDonut,
  ShareBar,
  WeekHeatmap,
} from "./charts/MiniCharts";
import {
  CAUSE_SPLIT,
  HOURLY,
  HOUR_BUCKETS,
  MONTH_LABELS,
  MONTHLY_FATAL,
  MONTHLY_INJURY,
  PROVINCE_RANK,
  SEVERITY_SPLIT,
  WEEKDAY_LABELS,
  WEEK_HEATMAP,
} from "./charts/chart-samples";

/**
 * The catalogue is a 986-line component that pulls in ApexCharts. Importing it
 * statically put that whole payload on the first screen for a button most
 * visitors never press, so it is split out and mounted only on click.
 */
const AllChartsModal = dynamic(
  () => import("./AllChartsModal").then((module) => module.AllChartsModal),
  { ssr: false },
);

const ICON = {
  trend:
    "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  grid: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
  map: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z",
  bolt: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
} as const;

function CardIcon({ path }: { path: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.6}
      stroke="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function Legend({ items }: { items: ReadonlyArray<{ label: string; color: string }> }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-fg-muted">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

interface ChartCard {
  key: string;
  tint: string;
  icon: string;
  kicker: string;
  title: string;
  /** What the visitor is looking at, in one sentence. */
  reading: string;
  /** What a manager does differently because of it. */
  decision: string;
  visual: React.ReactNode;
}

const cards: ChartCard[] = [
  {
    key: "monthly",
    tint: "tint-blue",
    icon: ICON.trend,
    kicker: "روند فصلی",
    title: "تصادفات در طول سال",
    reading:
      "حجم تصادفات جرحی از خرداد بالا می‌رود و در شهریور به اوج می‌رسد؛ سهم فوتی هم دقیقاً در همان بازه بیشترین است.",
    decision: "تقویم گشت و کمپین‌های ایمنی را با اوج تابستان هم‌تراز کنید.",
    visual: (
      <>
        <MonthColumns
          months={MONTH_LABELS}
          injury={MONTHLY_INJURY}
          fatal={MONTHLY_FATAL}
          className="w-full"
        />
        <Legend
          items={[
            { label: "جرحی", color: "var(--chart-1)" },
            { label: "فوتی", color: "var(--danger)" },
          ]}
        />
      </>
    ),
  },
  {
    key: "hourly",
    tint: "tint-cyan",
    icon: ICON.clock,
    kicker: "الگوی ساعتی",
    title: "ساعت وقوع در شبانه‌روز",
    reading:
      "دو قله روشن وجود دارد: ۷ تا ۹ صبح و ۱۷ تا ۲۰ عصر. بین ۲ تا ۵ بامداد کمترین میزان رخداد ثبت می‌شود.",
    decision: "شیفت‌ها را روی قله‌ها بچینید، نه یکنواخت در کل شبانه‌روز.",
    visual: (
      <div className="w-full">
        <div className="h-28 w-full">
          <HourTrend id="landing-hourly" data={HOURLY} peaks={[7, 17, 18]} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-fg-faint">
          {["۰", "۶", "۱۲", "۱۸", "۲۳"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "severity",
    tint: "tint-rose",
    icon: ICON.grid,
    kicker: "شدت",
    title: "سهم شدت حوادث",
    reading:
      "بیشترین سهم از آنِ تصادفات جرحی است (۷۲٪)؛ فوتی ۱۹٪ و خسارتی ۹٪. یعنی بیشتر رخدادها به آسیب جانی می‌رسند.",
    decision: "اولویت آمبولانس و تیم امداد را با نسبت فوتی به جرحی تعیین کنید.",
    visual: (
      <div className="flex w-full items-center gap-4">
        <SeverityDonut
          items={SEVERITY_SPLIT}
          centerValue="۷۲٪"
          centerLabel="جرحی"
        />
        <ul className="flex-1 space-y-2.5">
          {SEVERITY_SPLIT.map((item) => (
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
    ),
  },
  {
    key: "heatmap",
    tint: "tint-amber",
    icon: ICON.grid,
    kicker: "زمان و مکان",
    title: "نقشه حرارتی هفته",
    reading:
      "تیره‌ترین خانه، پنجشنبه ۱۸ تا ۲۱ است؛ جمعه صبح روشن‌ترین. الگو در همه استان‌ها تکرار می‌شود.",
    decision: "گشت هدفمند و کنترل سرعت را برای همان بازه بچینید.",
    visual: (
      <WeekHeatmap
        weekdays={WEEKDAY_LABELS}
        buckets={HOUR_BUCKETS}
        matrix={WEEK_HEATMAP}
        className="w-full"
      />
    ),
  },
  {
    key: "provinces",
    tint: "tint-violet",
    icon: ICON.map,
    kicker: "مکانی",
    title: "رتبه‌بندی استان‌ها",
    reading:
      "شش استان نخست نزدیک به ۶۰٪ کل گزارش‌ها را تشکیل می‌دهند؛ تهران با اختلاف در صدر است.",
    decision: "بودجه ایمن‌سازی و نیروی گشت را بر پایه بار حادثه توزیع کنید.",
    visual: <RankedBars items={PROVINCE_RANK} className="w-full" />,
  },
  {
    key: "causes",
    tint: "tint-emerald",
    icon: ICON.bolt,
    kicker: "علت‌شناسی",
    title: "سهم عوامل مؤثر",
    reading:
      "۶۱٪ عامل انسانی، ۲۴٪ خودرو و ۱۵٪ راه و محیط. سهم راه کوچک است اما بیشترین اثر را با کمترین هزینه دارد.",
    decision: "برای سهم راه، مداخله مهندسی؛ برای سهم انسانی، آموزش و اجرای قانون.",
    visual: <ShareBar items={CAUSE_SPLIT} className="w-full" />,
  },
];

export const ChartShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="analytics" className="relative overflow-hidden bg-canvas py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -start-32 top-1/4 h-80 w-80 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute -end-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4">
        <SectionHeading
          eyebrow="تحلیل داده"
          title={
            <>
              هر نمودار، یک{" "}
              <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                تصمیم
              </span>
            </>
          }
          description="داده خام تصمیم نمی‌سازد. شش نمای زیر همان کاری را نشان می‌دهند که سامانه با ۵۲ هزار گزارش انجام می‌دهد: الگو را پیدا می‌کند، آن را به زبان ساده می‌گوید و اقدام بعدی را مشخص می‌کند."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.key}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-2xl"
            >
              <header className="flex items-start gap-3">
                <span
                  className={`${card.tint} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tint-border bg-tint-soft text-tint-fg`}
                >
                  <CardIcon path={card.icon} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-6 text-fg">{card.title}</h3>
                  <p className="mt-0.5 text-[11px] text-fg-faint">{card.kicker}</p>
                </div>
              </header>

              <div className="mt-5 flex h-[200px] items-center rounded-2xl border border-line bg-surface-sunken p-4">
                {card.visual}
              </div>

              <p className="mt-4 text-sm leading-7 text-fg-muted">{card.reading}</p>

              <div className="mt-auto flex items-start gap-2 border-t border-line pt-4 text-xs leading-6 text-fg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICON.bolt} />
                </svg>
                <span>{card.decision}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-5">
          <ul className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-fg-muted">
            {[
              "فیلتر مشترک روی همه نمودارها",
              "تقویم شمسی",
              "خروجی گرفتن از داده",
              "نمونه نمایشی — داده واقعی پس از ورود",
            ].map((item) => (
              <li
                key={item}
                className="rounded-full border border-line bg-surface px-3 py-1.5"
              >
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-on-brand shadow-[0_0_24px_rgba(37,99,235,0.28)] transition hover:bg-brand-hover hover:shadow-[0_0_32px_rgba(37,99,235,0.45)]"
          >
            <span>کاتالوگ کامل تحلیل‌ها</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <AllChartsModal isOpen onClose={() => setIsModalOpen(false)} />
      ) : null}
    </section>
  );
};
