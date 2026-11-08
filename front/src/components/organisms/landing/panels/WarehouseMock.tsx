import React from "react";
import { MockFrame, StatusPill } from "./MockFrame";

const ROWS = [
  { name: "چراغ خطر مثلثی", stock: "۲۴", reorder: "۲۰", tone: "success" as const, status: "کافی" },
  { name: "بنزین — گالن ۲۰ لیتری", stock: "۸", reorder: "۲۵", tone: "danger" as const, status: "کمبود" },
  { name: "نوار شبرنگ ۵۰ متری", stock: "۳۲", reorder: "۳۰", tone: "warning" as const, status: "نزدیک سفارش" },
  { name: "دستکش ایمنی", stock: "۱۲۰", reorder: "۵۰", tone: "success" as const, status: "کافی" },
];

const FLOW = ["درخواست", "تأیید", "صدور", "دریافت"];

/** A still frame of `/warehouse`: stock against reorder points, plus the request chain. */
export function WarehouseMock() {
  return (
    <MockFrame title="انبار و موجودی" badge="UnitHead">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-[1.4fr_0.6fr_1.2fr] gap-2 border-b border-line bg-surface-sunken px-3 py-2 text-[9px] text-fg-faint sm:grid-cols-[1.5fr_0.6fr_0.7fr_1.2fr]">
          <span>کالا</span>
          <span className="text-center">موجودی</span>
          <span className="hidden text-center sm:block">سفارش</span>
          <span className="text-center">وضعیت</span>
        </div>
        <ul>
          {ROWS.map((row) => (
            <li
              key={row.name}
              className="grid grid-cols-[1.4fr_0.6fr_1.2fr] items-center gap-2 border-b border-line/60 px-3 py-2 last:border-0 sm:grid-cols-[1.5fr_0.6fr_0.7fr_1.2fr]"
            >
              <span className="truncate text-[10px] text-fg">{row.name}</span>
              <span className="text-center font-mono text-[10px] text-fg">{row.stock}</span>
              <span className="hidden text-center font-mono text-[10px] text-fg-faint sm:block">
                {row.reorder}
              </span>
              <span className="flex justify-center">
                <StatusPill tone={row.tone}>{row.status}</StatusPill>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning-border bg-warning-soft px-3 py-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-3.5 w-3.5 shrink-0 text-warning-fg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <span className="text-[10px] text-warning-fg">
          ۲ قلم به نقطه سفارش رسیده — پیش از اتمام موجودی هشدار داده شد.
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        {FLOW.map((step, index) => (
          <React.Fragment key={step}>
            <span className="flex-1 rounded-lg border border-line bg-surface px-1 py-1.5 text-center text-[10px] text-fg-muted">
              {step}
            </span>
            {index < FLOW.length - 1 ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
                className="h-3 w-3 shrink-0 text-fg-faint"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </MockFrame>
  );
}
