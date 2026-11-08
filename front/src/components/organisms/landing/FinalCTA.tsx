import React from "react";
import { HeroChartButtons } from "@/components/organisms/HeroChartButtons";

export const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden bg-canvas pb-20 pt-4 md:pb-28">
      <div className="mx-auto max-w-[1240px] px-4">
        <div
          className="relative overflow-hidden rounded-[32px] border border-line px-6 py-14 text-center md:px-12"
          style={{ backgroundImage: "var(--hero-gradient)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, var(--brand-soft), transparent 62%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold leading-9 text-fg md:text-3xl md:leading-[1.4]">
              از داده خام تا تصمیم اجرایی، در یک سامانه
            </h2>
            <p className="mt-4 text-sm leading-8 text-fg-muted md:text-base">
              گزارش را در صحنه ثبت کنید، در سازمان تأیید بگیرید و روی همان داده تحلیل کنید. برای
              دیدن نسخه واقعی، وارد شوید یا نقشه تعاملی را باز کنید.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <HeroChartButtons />
            </div>

            <p className="mt-5 text-[11px] text-fg-faint">
              دسترسی هر کاربر بر پایه نقش و سازمان او تعیین می‌شود.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
