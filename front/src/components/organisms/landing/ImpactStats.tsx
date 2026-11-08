"use client";

import React, { useEffect, useState } from "react";

interface CounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const Counter: React.FC<CounterProps> = ({ end, duration = 1800, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // easeOutExpo — fast arrival, soft landing.
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString("fa-IR")}
      {suffix}
    </span>
  );
};

const STATS = [
  {
    id: "reports",
    end: 52800,
    prefix: "+",
    label: "گزارش ثبت‌شده",
    note: "تصادف، خرابی، مانع و سایر",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
      />
    ),
  },
  {
    id: "provinces",
    end: 31,
    prefix: "",
    label: "استان پوشش‌داده‌شده",
    note: "از استان تا محور و باند",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
      />
    ),
  },
  {
    id: "panels",
    end: 7,
    prefix: "",
    label: "پنل نقش‌محور",
    note: "هر نقش، ابزار خودش",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    ),
  },
  {
    id: "incidents",
    end: 4,
    prefix: "",
    label: "نوع گزارش",
    note: "تصادف، خرابی، مانع، سایر",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    ),
  },
];

export const ImpactStats = () => {
  return (
    <section className="relative z-10 border-y border-line bg-canvas py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.id}
              className="group flex flex-col rounded-2xl border border-line bg-surface-sunken p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-line-strong"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-fg transition group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  {stat.icon}
                </svg>
              </div>
              <div className="text-3xl font-bold text-fg md:text-4xl" dir="ltr">
                <Counter end={stat.end} prefix={stat.prefix} />
              </div>
              <div className="mt-1.5 text-sm font-medium text-fg">{stat.label}</div>
              <div className="mt-1 text-[11px] text-fg-faint">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
