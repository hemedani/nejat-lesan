import React from "react";
import { HeroChartButtons } from "@/components/organisms/HeroChartButtons";

const FACTS = [
  { value: "۵۲٬۸۰۰+", label: "گزارش ثبت‌شده" },
  { value: "۳۱", label: "استان" },
  { value: "۷", label: "پنل نقش‌محور" },
  { value: "۴", label: "نوع رخداد" },
];

export const Hero = () => {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-canvas">
      {/* Ambient glow — the only decorative paint on the first screen, kept to three blurs. */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -start-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-brand/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -end-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute left-[60%] top-[40%] h-[20%] w-[20%] rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* Text */}
          <div className="animate-slide-down flex flex-col items-start space-y-6 text-right">
            <div className="tint-brand inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-soft px-4 py-2 text-sm font-medium text-tint-fg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
              نسخه جدید: گزارش چندنوعی و فرم‌ساز سازمانی
            </div>

            <h1 className="text-4xl font-bold leading-[1.45] text-fg md:text-5xl md:leading-[1.3] lg:text-[3.4rem]">
              سامانه هوشمند مدیریت ترافیک و{" "}
              <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                تحلیل تصادفات
              </span>
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-fg-muted md:text-xl md:leading-9">
              از ثبت گزارش در صحنه تا تأیید سازمانی و تحلیل ملی؛ یک زنجیره داده یکپارچه برای ایمنی
              راه‌ها. گزارش، مستند، تصمیم — همه در یک جا.
            </p>

            <div className="flex w-full flex-col items-center gap-4 pt-2 sm:w-auto sm:flex-row">
              <HeroChartButtons />
            </div>

            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
              {FACTS.map((fact) => (
                <div key={fact.label}>
                  <div className="text-xl font-bold text-fg md:text-2xl">{fact.value}</div>
                  <div className="mt-1 text-[11px] text-fg-faint">{fact.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product picture */}
          <div className="perspective-[2000px] relative flex min-h-[360px] animate-fade-in-delay items-center justify-center">
            <div
              className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-2xl backdrop-blur-xl transition-transform duration-700 ease-out hover:rotate-0"
              style={{ transform: "rotateX(8deg) rotateY(-12deg) rotateZ(2deg)" }}
            >
              <div className="flex h-10 items-center gap-2 border-b border-line bg-surface-sunken/80 px-4">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <div className="ms-auto font-mono text-xs text-fg-muted">mersad-map-dashboard</div>
              </div>

              {/* A picture of a dark dashboard, not a themed surface — see front/AGENTS.md. */}
              <div className="relative h-[calc(100%-2.5rem)] w-full overflow-hidden bg-[#0f172a]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50" />

                <svg
                  className="absolute inset-0 h-full w-full opacity-30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M10,50 Q30,20 50,50 T90,50" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                  <path d="M20,80 Q40,40 70,70 T100,30" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                </svg>

                <div className="absolute left-[40%] top-[30%] h-4 w-4 animate-pulse rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                <div
                  className="absolute left-[20%] top-[60%] h-3 w-3 animate-pulse rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                  style={{ animationDelay: "0.5s" }}
                />
                <div
                  className="absolute left-[70%] top-[45%] h-5 w-5 animate-pulse rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.9)]"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="absolute left-[65%] top-[75%] h-3 w-3 animate-pulse rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                  style={{ animationDelay: "0.2s" }}
                />

                <div className="absolute end-4 top-4 h-24 w-32 rounded-lg border border-line bg-surface-sunken/90 p-3 shadow-lg backdrop-blur-md">
                  <div className="mb-2 h-2 w-full rounded bg-surface-hover" />
                  <div className="mb-4 h-2 w-3/4 rounded bg-surface-hover" />
                  <div className="flex h-8 items-end gap-1">
                    <div className="h-[40%] w-1/4 rounded-t-sm bg-brand" />
                    <div className="h-[70%] w-1/4 rounded-t-sm bg-brand" />
                    <div className="h-[50%] w-1/4 rounded-t-sm bg-brand" />
                    <div className="h-[90%] w-1/4 rounded-t-sm bg-brand" />
                  </div>
                </div>

                <div className="absolute bottom-4 start-4 flex h-16 w-40 items-center gap-3 rounded-lg border border-line bg-surface-sunken/90 p-3 shadow-lg backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-brand-soft">
                    <div className="h-3 w-3 rounded-full bg-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 h-2 w-full rounded bg-surface-hover" />
                    <div className="h-2 w-1/2 rounded bg-surface-hover" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-600/10 to-cyan-400/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
