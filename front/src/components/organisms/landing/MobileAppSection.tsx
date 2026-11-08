import React from "react";
import { PhoneMockup } from "./PhoneMockup";
import { SectionHeading } from "./SectionHeading";

const FEATURES = [
  {
    icon: "M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925-3.547 5.975 5.975 0 0 0-9.995 2.55 4.5 4.5 0 0 0-4.325 4.465Z",
    title: "آفلاین، به‌معنای واقعی",
    description:
      "یک بار ورود با شبکه، بعد از آن ثبت، ویرایش و صف ارسال بدون اینترنت کار می‌کند. پیش‌نویس‌ها در حافظه محلی می‌مانند؛ حتی اگر گوشی خاموش شود.",
  },
  {
    icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12",
    title: "ویزارد هفت‌مرحله‌ای",
    description:
      "اطلاعات پایه، طبقه‌بندی، پلیس و کروکی، خودروها، افراد، محیط و راه، خسارت تأسیسات — هر مرحله جدا ذخیره می‌شود.",
  },
  {
    icon: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm4.5 0c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
    title: "موقعیت دقیق، نه تقریبی",
    description:
      "موقعیت افسر از نقطه حادثه جدا نگه داشته می‌شود؛ گزارش به محور وصل می‌شود و کیلومتر، متر، جهت و باند را ثبت می‌کند.",
  },
  {
    icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99",
    title: "همگام‌سازی بدون تکرار",
    description:
      "هر پیش‌نویس یک شناسه یکتا دارد؛ ارسال دوباره گزارش تکراری نمی‌سازد. مستندات تا تأیید سرور روی دستگاه می‌مانند.",
  },
];

const PIPELINE = [
  { label: "پیش‌نویس", note: "روی دستگاه" },
  { label: "در صف", note: "بدون شبکه" },
  { label: "در حال ارسال", note: "شبکه برگشت" },
  { label: "همگام‌شده", note: "شناسه سرور" },
];

const CHIPS = ["۴ نوع رخداد", "۵ تب اصلی", "نقشه آفلاین", "اندروید و iOS"];

export const MobileAppSection = () => {
  return (
    <section id="mobile" className="relative bg-canvas py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-4">
        <div
          className="relative overflow-hidden rounded-[32px] border border-line p-6 md:p-12"
          style={{ backgroundImage: "var(--hero-gradient)" }}
        >
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <SectionHeading
                align="start"
                tint="tint-cyan"
                eyebrow="اپلیکیشن گشت"
                title={
                  <>
                    ثبت گزارش در صحنه،{" "}
                    <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                      حتی بدون اینترنت
                    </span>
                  </>
                }
                description="افسر گشت با یک گوشی کار می‌کند: ثبت موقعیت، خودرو، افراد و مستندات، و ارسال وقتی شبکه برگشت. هیچ گزارش ثبت‌شده‌ای به‌خاطر قطعی شبکه از دست نمی‌رود."
              />

              <ul className="mt-8 space-y-5">
                {FEATURES.map((feature) => (
                  <li key={feature.title} className="flex gap-3.5">
                    <span className="tint-cyan flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-tint-border bg-tint-soft text-tint-fg">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth={1.7}
                        stroke="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-fg">{feature.title}</h3>
                      <p className="mt-1 text-[13px] leading-7 text-fg-muted">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <ul className="mt-7 flex flex-wrap gap-2">
                {CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-line bg-surface/60 px-3 py-1.5 text-[11px] text-fg-muted backdrop-blur-sm"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <PhoneMockup />
          </div>

          <div className="mt-12 border-t border-line pt-8">
            <p className="text-[11px] text-fg-faint">
              چرخه وضعیت گزارش روی دستگاه — سرور وضعیت خودش را جدا ثبت می‌کند
            </p>
            <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              {PIPELINE.map((step, index) => (
                <React.Fragment key={step.label}>
                  <li className="flex-1 rounded-xl border border-line bg-surface/70 px-3 py-2.5 backdrop-blur-sm">
                    <span className="block text-[12px] font-semibold text-fg">{step.label}</span>
                    <span className="mt-0.5 block text-[10px] text-fg-faint">{step.note}</span>
                  </li>
                  {index < PIPELINE.length - 1 ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="hidden h-4 w-4 shrink-0 text-fg-faint sm:block"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  ) : null}
                </React.Fragment>
              ))}
            </ol>
            <p className="mt-4 text-[11px] leading-6 text-fg-faint">
              اگر سرور گزارشی را نپذیرد، به وضعیت «بازگشتی» می‌رود و دلیلش برای افسر نمایش داده
              می‌شود — گزارش حذف نمی‌شود.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
