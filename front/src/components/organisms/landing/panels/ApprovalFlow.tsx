import React from "react";

const STEPS = [
  {
    step: "۱",
    title: "ثبت افسر گشت",
    description: "گزارش با شناسه یکتا، موقعیت دقیق و مستندات ساخته می‌شود.",
  },
  {
    step: "۲",
    title: "بررسی سرپرست واحد",
    description: "صحت اطلاعات، خودروها و کروکی بازبینی و تأیید می‌شود.",
  },
  {
    step: "۳",
    title: "تصمیم سرپرست سازمان",
    description: "تأیید نهایی یا بازگشت به واحد با دلیل ثبت‌شده.",
  },
  {
    step: "۴",
    title: "بایگانی و تحلیل",
    description: "گزارش وارد آمار سازمان و تحلیل ملی می‌شود.",
  },
];

/** The report approval chain — the part of the org panel a screenshot cannot explain. */
export function ApprovalFlow() {
  return (
    <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {STEPS.map((item) => (
        <li
          key={item.step}
          className="relative rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong"
        >
          <span className="tint-brand flex h-7 w-7 items-center justify-center rounded-full border border-tint-border bg-tint-soft text-[11px] font-bold text-tint-fg">
            {item.step}
          </span>
          <h4 className="mt-2.5 text-[12px] font-semibold leading-5 text-fg">{item.title}</h4>
          <p className="mt-1 text-[10px] leading-5 text-fg-muted">{item.description}</p>
        </li>
      ))}
    </ol>
  );
}
