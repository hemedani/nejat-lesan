"use client";

import React, { useRef, useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { AdminMock } from "./panels/AdminMock";
import { ApprovalFlow } from "./panels/ApprovalFlow";
import { FormsMock } from "./panels/FormsMock";
import { OrgMock } from "./panels/OrgMock";
import { WarehouseMock } from "./panels/WarehouseMock";

interface Feature {
  title: string;
  description: string;
}

interface TourTab {
  key: string;
  label: string;
  hint: string;
  title: string;
  description: string;
  features: Feature[];
  access: string;
  visual: React.ReactNode;
  /** Rendered full-width under the panel — used by the approval chain. */
  extra?: React.ReactNode;
}

const TABS: TourTab[] = [
  {
    key: "admin",
    label: "مدیریت سامانه",
    hint: "کاربران، نقش‌ها، مجوزها",
    title: "کنترل کامل سامانه، بدون یک خط کد",
    description:
      "مدیر سامانه کاربران، نقش‌ها و کاتالوگ‌های مرجع را می‌گرداند و مجوز هر ماژول را برای هر سازمان جداگانه روشن یا خاموش می‌کند.",
    features: [
      { title: "هفت نقش، هفت سطح دسترسی", description: "از مدیر سامانه تا افسر گشت؛ هر نقش فقط ابزارهای خودش را می‌بیند." },
      { title: "کاتالوگ‌های مرجع در یک جا", description: "استان، شهر، منطقه، محور، نوع تصادف، شدت، عیب راه و ده‌ها فهرست دیگر." },
      { title: "مجوز ماژول برای هر سازمان", description: "تحلیل، گشت، فرم‌ساز و انبار مستقل از هم فعال می‌شوند." },
      { title: "ویرایش و پیگیری داده", description: "اصلاح رکوردها، مدیریت فایل‌ها و پیگیری رخدادهای سامانه." },
    ],
    access: "مدیر سامانه · مدیر · ویرایشگر",
    visual: <AdminMock />,
  },
  {
    key: "org",
    label: "سازمان و تأیید گزارش",
    hint: "چرخه بررسی دو مرحله‌ای",
    title: "چرخه تأیید گزارش، از صحنه تا بایگانی",
    description:
      "گزارش گشت به واحد می‌رسد، سرپرست واحد صحت آن را بررسی می‌کند و سرپرست سازمان تصمیم نهایی را می‌گیرد. هر تصمیم با نام، زمان و دلیل کنار همان گزارش می‌ماند.",
    features: [
      { title: "بررسی دو مرحله‌ای", description: "تأیید یا بازگشت با دلیل؛ تاریخچه کامل در همان صفحه گزارش." },
      { title: "چارت سازمانی و واحدها", description: "ساختار درخت‌واره با افراد، نقش‌ها و محدوده هر واحد." },
      { title: "محدوده دید خودکار", description: "هر سرپرست فقط گزارش‌های سازمان یا واحد خودش را می‌بیند." },
      { title: "داشبورد نظارتی", description: "صف گزارش‌های در انتظار بررسی و شاخص‌های هر واحد." },
    ],
    access: "سرپرست سازمان · سرپرست واحد · کارشناس",
    visual: <OrgMock />,
    extra: <ApprovalFlow />,
  },
  {
    key: "warehouse",
    label: "انبار و موجودی",
    hint: "موجودی، درخواست، گردش",
    title: "انبار، بدون کاغذ و بدون حدس",
    description:
      "موجودی هر قلم در هر واحد، نقطه سفارش، رسید کالا، درخواست، مصرف و گردش — یک جریان ثبت‌شده که مسئول هر مرحله را نگه می‌دارد.",
    features: [
      { title: "هشدار پیش از اتمام", description: "هر قلم نقطه سفارش دارد؛ کمبود پیش از بحران دیده می‌شود." },
      { title: "رسید با پذیرش و رد", description: "مقدار دریافت، پذیرفته و مردود جدا ثبت می‌شود." },
      { title: "درخواست تا تحویل", description: "ثبت، تأیید، صدور و دریافت با گردش کار مشخص." },
      { title: "گردش قابل ردیابی", description: "هر تغییر موجودی یک سند دارد؛ هیچ عددی بی‌منبع نیست." },
    ],
    access: "سرپرست سازمان · سرپرست واحد · کارشناس",
    visual: <WarehouseMock />,
  },
  {
    key: "forms",
    label: "فرم‌ساز",
    hint: "فرم اختصاصی هر سازمان",
    title: "فرم سازمان شما، نه فرم ما",
    description:
      "سازمان خودش فرم تصادف و فرم‌های رخداد را می‌سازد — صفحه، بخش، فیلد و قاعده شرطی. همان تعریفی که سرور در لحظه ثبت اعتبارسنجی می‌کند.",
    features: [
      { title: "۱۵ نوع فیلد آماده", description: "متن، عدد، تاریخ، پلاک، فایل، موقعیت نقشه و فهرست مرجع." },
      { title: "قاعده به زبان فارسی", description: "«اگر شدت فوتی است، کروکی الزامی است» — بدون کدنویسی." },
      { title: "تکرارشونده‌ها", description: "خودرو، سرنشین و خسارت به تعداد نامحدود در یک فرم." },
      { title: "پیش‌نمایش زنده و نسخه", description: "قبل از انتشار ببینید؛ بعد از انتشار نسخه را نگه دارید." },
    ],
    access: "مدیر سامانه · مدیر · سرپرست سازمان · سرپرست واحد",
    visual: <FormsMock />,
  },
];

export const PlatformTour = () => {
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = TABS.find((tab) => tab.key === activeKey) ?? TABS[0];

  /** RTL: ArrowLeft advances, ArrowRight goes back. */
  const move = (direction: 1 | -1) => {
    const index = TABS.findIndex((tab) => tab.key === activeKey);
    const next = TABS[(index + direction + TABS.length) % TABS.length];
    setActiveKey(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <section id="platform" className="relative overflow-hidden bg-canvas py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute end-0 top-0 h-72 w-72 rounded-full bg-brand/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1240px] px-4">
        <SectionHeading
          eyebrow="پنل‌ها"
          title={
            <>
              یک سامانه،{" "}
              <span className="bg-gradient-to-r from-brand-fg to-info bg-clip-text text-transparent">
                چهار دفتر کار
              </span>
            </>
          }
          description="هر نقش فقط ابزارهای خودش را می‌بیند. دسترسی از سازمان و واحد کاربر مشتق می‌شود، نه از آدرس صفحه — و همین است که یک سامانه می‌تواند هم‌زمان ستاد، سازمان و واحد را اداره کند."
        />

        <div
          role="tablist"
          aria-label="بخش‌های سامانه"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              move(-1);
            }
          }}
          className="mx-auto mt-10 flex max-w-3xl gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1"
        >
          {TABS.map((tab) => {
            const selected = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                ref={(node) => {
                  tabRefs.current[tab.key] = node;
                }}
                role="tab"
                id={`tour-tab-${tab.key}`}
                aria-selected={selected}
                aria-controls={`tour-panel-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveKey(tab.key)}
                className={`flex-1 shrink-0 rounded-xl px-4 py-2.5 text-center text-xs font-semibold transition ${
                  selected
                    ? "bg-brand text-on-brand shadow-[0_0_20px_rgba(37,99,235,0.35)]"
                    : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                }`}
              >
                <span className="block whitespace-nowrap">{tab.label}</span>
                <span
                  className={`mt-0.5 hidden whitespace-nowrap text-[10px] font-normal lg:block ${
                    selected ? "text-on-brand/75" : "text-fg-faint"
                  }`}
                >
                  {tab.hint}
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={active.key}
          role="tabpanel"
          id={`tour-panel-${active.key}`}
          aria-labelledby={`tour-tab-${active.key}`}
          className="animate-fade-in-fast mt-12"
        >
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h3 className="text-2xl font-bold leading-9 text-fg md:text-3xl md:leading-[1.35]">
                {active.title}
              </h3>
              <p className="mt-4 text-sm leading-8 text-fg-muted md:text-base">{active.description}</p>

              <ul className="mt-7 space-y-4">
                {active.features.map((feature) => (
                  <li key={feature.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-fg">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-fg">{feature.title}</h4>
                      <p className="mt-1 text-[13px] leading-6 text-fg-muted">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-t border-line pt-4 text-[11px] text-fg-faint">
                دسترسی: <span className="text-fg-muted">{active.access}</span>
              </p>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-[40px] bg-brand/10 blur-[80px]"
                aria-hidden="true"
              />
              {active.visual}
            </div>
          </div>

          {active.extra ? <div className="mt-10">{active.extra}</div> : null}
        </div>
      </div>
    </section>
  );
};
