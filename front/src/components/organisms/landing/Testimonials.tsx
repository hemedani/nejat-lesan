import React from "react";
import { SectionHeading } from "./SectionHeading";

const TESTIMONIALS = [
  {
    id: 1,
    content:
      "سرعت پردازش داده‌ها در مرصاد بی‌نظیر است. گزارش‌گیری و تحلیل میلیون‌ها رکورد تصادف در کسری از ثانیه انجام می‌شود، بدون افت عملکرد.",
    author: "سرهنگ محمدی",
    role: "رئیس پلیس راهور استان",
    plate: "bg-brand",
    initials: "س.م",
  },
  {
    id: 2,
    content:
      "تحلیل‌های مکانی کمک کرد نقاط حادثه‌خیز را با دقت پیدا کنیم. رابط کاربری روشن و عملکرد پایدار، کار روزمره تیم را ساده‌تر کرده است.",
    author: "مهندس رضایی",
    role: "مدیر مرکز کنترل ترافیک",
    plate: "bg-info",
    initials: "م.ر",
  },
  {
    id: 3,
    content:
      "یکپارچگی داده و داشبوردهای روان، تصمیم‌گیری را برای مدیران ارشد ساده کرده است. پایداری سامانه حتی در ساعات اوج ترافیک داده محسوس است.",
    author: "دکتر احمدی",
    role: "معاون حمل و نقل و ترافیک",
    plate: "bg-indigo-500",
    initials: "د.ا",
  },
];

export const Testimonials = () => {
  return (
    <section className="relative overflow-hidden bg-surface py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -end-[5%] -top-[10%] h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -start-[5%] h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4">
        <SectionHeading
          eyebrow="اعتماد سازمان‌ها"
          title={
            <>
              کسانی که هر روز با{" "}
              <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                این داده
              </span>{" "}
              تصمیم می‌گیرند
            </>
          }
          description="نظر مدیران و کارشناسانی که برای ایمنی راه‌ها به مرصاد تکیه می‌کنند."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="group relative flex h-full flex-col rounded-3xl border border-line bg-surface-sunken p-7 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-line-strong"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-brand/25 transition-colors group-hover:text-brand/40"
                aria-hidden="true"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <blockquote className="mt-4 flex-grow text-[13px] leading-7 text-fg-muted">
                {testimonial.content}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-on-brand ${testimonial.plate}`}
                >
                  {testimonial.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{testimonial.author}</div>
                  <div className="mt-0.5 truncate text-[11px] text-fg-faint">{testimonial.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
