import React from "react";

const FEATURES = [
  {
    icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
    title: "سازمان‌دهی سلسله‌مراتبی",
    description:
      "فیلتر بر اساس استان، شهرستان، شهر، منطقه شهرداری و محور مواصلاتی — تا دقیق‌ترین لایه داده را ببینید.",
    tint: "tint-brand",
  },
  {
    icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
    title: "انتخاب محدوده با چندضلعی",
    description:
      "با ابزار رسم، محدوده دلخواه را روی نقشه بکشید تا فقط رخدادهای همان ناحیه شمرده و تحلیل شوند.",
    tint: "tint-cyan",
  },
];

export const MapFeaturePreview = () => {
  return (
    <section id="map" className="relative overflow-hidden bg-surface py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-brand/5 blur-[150px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1240px] px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="w-full space-y-7 lg:w-1/2">
            <div className="tint-brand inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-soft px-4 py-2 text-sm font-medium text-tint-fg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              تحلیل دقیق مکانی
            </div>

            <h2 className="text-3xl font-bold leading-tight text-fg md:text-4xl lg:text-[2.6rem] lg:leading-[1.35]">
              جغرافیا را به{" "}
              <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                لایه تصمیم
              </span>{" "}
              تبدیل کنید
            </h2>

            <p className="text-base leading-8 text-fg-muted md:text-lg">
              نقشه تعاملی، داده‌های تصادفات را با دقت مکانی نشان می‌دهد: از انتخاب سلسله‌مراتبی مناطق
              تا رسم آزاد روی نقشه. هر تغییر فیلتر، بلافاصله روی همان نمای مقابل بازتاب پیدا می‌کند.
            </p>

            <div className="space-y-5 pt-1">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div
                    className={`${feature.tint} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tint-border bg-tint-soft text-tint-fg`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-base font-semibold text-fg">{feature.title}</h3>
                    <p className="text-sm leading-7 text-fg-muted">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="border-t border-line pt-4 text-[11px] text-fg-faint">
              سه منبع نقشه پایه (OSM، Map.ir و نشان) قابل انتخاب است — چون دسترسی به هر منبع در هر
              شبکه‌ای یکسان نیست.
            </p>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-surface-sunken/80 shadow-2xl backdrop-blur-xl sm:aspect-[4/3]">
              {/* A picture of a dark map plate — fixed, like the hero mockup. */}
              <div className="absolute inset-0 bg-[#0f172a]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40" />

                <svg
                  className="absolute inset-0 h-full w-full opacity-30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M-10,40 Q30,60 50,40 T110,50" fill="none" stroke="#475569" strokeWidth="0.5" />
                  <path d="M20,-10 Q40,40 30,80 T40,110" fill="none" stroke="#475569" strokeWidth="0.5" />
                  <path d="M60,-10 Q50,30 70,60 T60,110" fill="none" stroke="#475569" strokeWidth="0.5" />
                </svg>
              </div>

              <svg
                className="absolute inset-0 z-10 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points="30,30 70,20 80,60 40,80 20,50"
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="animate-[pulse_4s_ease-in-out_infinite]"
                />
                <circle cx="30" cy="30" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="70" cy="20" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="80" cy="60" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="40" cy="80" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="20" cy="50" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
              </svg>

              <div className="absolute start-[40%] top-[35%] z-20 h-3 w-3 animate-bounceIn rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]" />
              <div
                className="absolute start-[60%] top-[45%] z-20 h-4 w-4 animate-bounceIn rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)]"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="absolute start-[45%] top-[60%] z-20 h-2.5 w-2.5 animate-bounceIn rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]"
                style={{ animationDelay: "0.4s" }}
              />
              <div
                className="absolute start-[65%] top-[30%] z-20 h-3 w-3 animate-bounceIn rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,1)]"
                style={{ animationDelay: "0.6s" }}
              />

              <div className="absolute start-[20%] top-[20%] z-10 h-2 w-2 rounded-full bg-line-strong opacity-50" />
              <div className="absolute start-[80%] top-[70%] z-10 h-2 w-2 rounded-full bg-line-strong opacity-50" />
              <div className="absolute start-[30%] top-[80%] z-10 h-2 w-2 rounded-full bg-line-strong opacity-50" />

              <div className="absolute end-4 top-4 z-30 flex flex-col gap-2">
                <div className="overflow-hidden rounded-lg border border-line bg-surface-sunken/90 shadow-lg backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center border-b border-line text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-line bg-surface-sunken/90 shadow-lg backdrop-blur-md">
                  <div className="tint-brand flex h-8 w-8 items-center justify-center bg-tint-soft text-tint-fg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 start-6 end-6 z-30 rounded-xl border border-line bg-surface-sunken/90 p-4 shadow-2xl backdrop-blur-md transition-all duration-500 sm:end-auto sm:w-64">
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="text-sm font-medium text-fg">محدوده انتخاب‌شده</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-fg-muted">مساحت:</span>
                    <span className="font-mono text-brand-fg" dir="ltr">
                      12.5 km²
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-fg-muted">تصادفات:</span>
                    <span className="font-mono text-danger-fg">۴ مورد</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
