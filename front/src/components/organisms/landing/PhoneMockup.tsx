import React from "react";

const TAB_ICONS: Record<string, React.ReactNode> = {
  reports: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  ),
  bell: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  ),
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
    />
  ),
  map: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
    />
  ),
  more: (
    <>
      <circle cx="6.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

const TABS = [
  { key: "reports", label: "گزارش‌ها" },
  { key: "bell", label: "اعلان‌ها" },
  { key: "home", label: "خانه" },
  { key: "map", label: "نقشه" },
  { key: "more", label: "بیشتر" },
];

const INCIDENT_TYPES = ["تصادف", "خرابی", "مانع", "سایر"];
const SEVERITIES = ["خسارتی", "جرحی", "فوتی"];

/**
 * A still frame of the patrol app.
 *
 * Every colour here is a token, so the phone follows the document theme like
 * every other surface on the page. The tab order and the seven-step wizard are
 * the real ones (`mobile/src/app/(tabs)` and the accident phases) — a landing
 * page that invents a different app is worse than no mockup.
 */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[286px]">
      <div className="relative rounded-[2.6rem] border border-line-strong bg-surface p-2 shadow-[0_40px_90px_-40px_rgba(2,6,23,0.75)]">
        <div className="relative flex h-[552px] flex-col overflow-hidden rounded-[2.1rem] border border-line bg-canvas">
          {/* Notch + status bar */}
          <div className="flex items-center justify-between px-5 pt-2.5 text-[10px] text-fg-faint">
            <span className="font-mono" dir="ltr">
              ۹:۴۱
            </span>
            <span className="h-1.5 w-16 rounded-full bg-line-strong" aria-hidden="true" />
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="h-1.5 w-1.5 rounded-full bg-fg-faint" />
            </span>
          </div>

          {/* Screen header */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-fg-muted"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <h3 className="text-[13px] font-bold text-fg">ثبت تصادف</h3>
              <span className="ms-auto text-[9px] text-fg-faint">مرحله ۳ از ۷</span>
            </div>
            <div className="mt-2.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1 flex-1 rounded-full ${index < 3 ? "bg-brand" : "bg-line"}`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-3 overflow-hidden px-4 pt-4">
            <div className="rounded-xl border border-line bg-surface p-3">
              <p className="text-[9px] text-fg-faint">نوع رخداد</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {INCIDENT_TYPES.map((type, index) => (
                  <span
                    key={type}
                    className={`rounded-md border px-2 py-1 text-[9px] ${
                      index === 0
                        ? "tint-brand border-tint-border bg-tint-soft text-tint-fg"
                        : "border-line text-fg-muted"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-3">
              <p className="text-[9px] text-fg-faint">شدت</p>
              <div className="mt-1.5 flex gap-1.5">
                {SEVERITIES.map((severity, index) => (
                  <span
                    key={severity}
                    className={`flex-1 rounded-md border py-1 text-center text-[9px] ${
                      index === 1
                        ? "tint-warning border-tint-border bg-tint-soft text-tint-fg"
                        : "border-line text-fg-muted"
                    }`}
                  >
                    {severity}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-start gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-fg"
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
                <div className="min-w-0">
                  <p className="text-[9px] text-fg-faint">موقعیت ثبت‌شده</p>
                  <p className="mt-0.5 truncate text-[10px] text-fg">
                    محور تهران — قم · کیلومتر ۱۲+۴۰۰
                  </p>
                  <p className="mt-0.5 text-[9px] text-fg-faint">دقت ۸ متر · باند شمالی</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-surface p-3">
              <p className="text-[9px] text-fg-faint">مستندات</p>
              <div className="mt-1.5 flex gap-1.5">
                {["پلاک", "بیمه", "کروکی"].map((label) => (
                  <span
                    key={label}
                    className="flex h-11 flex-1 items-center justify-center rounded-md border border-dashed border-line-strong text-[8px] text-fg-faint"
                  >
                    {label}
                  </span>
                ))}
                <span className="flex h-11 w-8 items-center justify-center rounded-md border border-line bg-surface-sunken text-[12px] text-fg-muted">
                  +
                </span>
              </div>
            </div>

            <div className="tint-warning flex items-center gap-2 rounded-xl border border-tint-border bg-tint-soft px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-[9px] text-tint-fg">
                آفلاین — گزارش در صف ارسال می‌ماند
              </span>
            </div>
          </div>

          {/* Tab bar — Reports, Announcements, Home, Map, More */}
          <div className="border-t border-line bg-surface px-2 pb-3 pt-2">
            <div className="flex items-end justify-between">
              {TABS.map((tab) => {
                const isHome = tab.key === "home";
                return (
                  <span
                    key={tab.key}
                    className={`flex flex-1 flex-col items-center gap-1 ${
                      isHome ? "text-brand-fg" : "text-fg-faint"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full ${
                        isHome ? "h-8 w-8 bg-brand text-on-brand shadow-[0_0_16px_rgba(37,99,235,0.5)]" : "h-5 w-5"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        {TAB_ICONS[tab.key]}
                      </svg>
                    </span>
                    <span className="text-[8px]">{tab.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-6 -bottom-6 -z-10 h-24 rounded-full bg-brand/25 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}
