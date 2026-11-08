import React from "react";
import { MockFrame, StatusPill } from "./MockFrame";

const TREE = [
  { depth: 0, kind: "page", label: "صفحه ۱ — اطلاعات پایه" },
  { depth: 1, kind: "section", label: "بخش: مشخصات حادثه" },
  { depth: 2, kind: "field", label: "شدت حادثه", type: "انتخاب یکی", active: true },
  { depth: 2, kind: "field", label: "تعداد فوتی", type: "عدد" },
  { depth: 1, kind: "section", label: "بخش: خودروها" },
  { depth: 2, kind: "repeat", label: "کارت خودرو (تکرارشونده)", type: "۳ ردیف" },
];

const PALETTE = ["متن", "عدد", "تاریخ", "پلاک", "فایل", "موقعیت", "فهرست مرجع"];

/** A still frame of `/forms`: the definition tree, the selected field, and a rule read back in Persian. */
export function FormsMock() {
  return (
    <MockFrame title="فرم‌ساز — ویرایش فرم تصادف" badge="OrgHead">
      <div className="rounded-xl border border-line bg-surface p-2">
        <ul className="space-y-0.5">
          {TREE.map((node) => (
            <li
              key={node.label}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] ${
                node.active
                  ? "tint-brand border border-tint-border bg-tint-soft text-tint-fg"
                  : "text-fg-muted"
              }`}
              style={{ paddingInlineStart: `${8 + node.depth * 12}px` }}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  node.kind === "page"
                    ? "bg-brand"
                    : node.kind === "section"
                      ? "bg-info"
                      : node.kind === "repeat"
                        ? "bg-warning"
                        : "bg-line-strong"
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{node.label}</span>
              {node.type ? (
                <span className="ms-auto shrink-0 text-[9px] text-fg-faint">{node.type}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-brand-border bg-brand-soft p-3">
        <div className="flex items-center gap-2">
          <StatusPill tone="info">قاعده شرطی</StatusPill>
          <span className="text-[9px] text-fg-faint">خوانش خودکار</span>
        </div>
        <p className="mt-2 text-[11px] leading-6 text-fg">
          اگر «شدت حادثه» برابر با «فوتی» باشد، آنگاه «کروکی» الزامی است.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PALETTE.map((item) => (
          <span
            key={item}
            className="rounded-md border border-line bg-surface px-2 py-1 text-[9px] text-fg-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </MockFrame>
  );
}
