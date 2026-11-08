import React from "react";
import { MockFrame, StatusPill } from "./MockFrame";

const FACTS = [
  { label: "نوع", value: "تصادف جرحی" },
  { label: "واحد", value: "گشت محور تهران — قم" },
  { label: "افسر", value: "حسین نجفی" },
  { label: "زمان", value: "۱۴۰۵/۰۸/۱۷ — ۱۸:۴۲" },
];

/** A still frame of a report awaiting the organization head's decision. */
export function OrgMock() {
  return (
    <MockFrame title="کنسول سازمان — گزارش‌ها" badge="OrgHead">
      <div className="rounded-xl border border-line bg-surface p-3">
        <header className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-fg" dir="ltr">
            REP-2026-4423441
          </span>
          <StatusPill tone="warning">در انتظار بررسی سازمان</StatusPill>
        </header>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3">
          {FACTS.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-[9px] text-fg-faint">{fact.label}</dt>
              <dd className="mt-0.5 truncate text-[11px] text-fg">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-surface p-3">
        <h4 className="mb-2 text-[10px] font-semibold text-fg-faint">تاریخچه بررسی</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-[11px] text-fg-muted">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success-soft text-success-fg">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            ثبت گزارش توسط افسر گشت
          </li>
          <li className="flex items-center gap-2 text-[11px] text-fg-muted">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success-soft text-success-fg">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            تأیید سرپرست واحد — «مستندات کامل است»
          </li>
          <li className="flex items-center gap-2 text-[11px] text-fg">
            <span className="h-4 w-4 rounded-full border-2 border-warning bg-warning-soft" />
            تصمیم سرپرست سازمان
          </li>
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2 text-[11px] font-semibold text-on-brand">
          تأیید نهایی
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] font-medium text-fg">
          بازگشت با دلیل
        </span>
      </div>
    </MockFrame>
  );
}
