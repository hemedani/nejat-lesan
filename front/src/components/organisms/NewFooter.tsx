"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, userLevel, hasModule, orgHasModule, isOrgLeader } = useAuth();

  const adminRole = userLevel === "Ghost" || userLevel === "Manager" || userLevel === "Editor";
  const chartsEnabled = isAuthenticated && hasModule("charts");
  const patrolEnabled = isAuthenticated && orgHasModule("incident_patrol");

  const features: Array<{ href: string; label: string }> = [];
  if (chartsEnabled) {
    features.push({ href: "/charts/overall", label: "تحلیل و نمودارهای تصادفات" });
    features.push({ href: "/maps/accidents", label: "نقشه تصادفات" });
  }
  if (patrolEnabled && isOrgLeader) {
    features.push({ href: "/org", label: "داشبورد سازمان" });
  }
  if (patrolEnabled && (userLevel === "Ghost" || userLevel === "Manager")) {
    features.push({ href: "/patrol-manager/dashboard", label: "مرکز بررسی گشت" });
  }
  if (adminRole) {
    features.push({ href: "/admin", label: "پنل مدیریت سامانه" });
  }

  return (
    <footer className="bg-slate-950 text-white pt-12 pb-8 border-t border-white/10 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">درباره ما</h3>
            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
              این پلتفرم با هدف تحلیل و بررسی علمی تصادفات رانندگی راه‌اندازی شده است. ما تلاش می‌کنیم
              با بهره‌گیری از داده‌های واقعی، بهبود ایمنی جاده‌ای و کاهش تلفات را با کمک تحلیل‌های
              هوشمند محقق کنیم.
            </p>
            <div className="flex justify-end space-x-4 space-x-reverse mt-4">
              {/* شبکه‌های اجتماعی (در صورت نیاز می‌توانید حذف کنید) */}
              <a href="#" className="text-slate-400 hover:text-white transition" aria-label="فیسبوک">
                {/* آیکن‌ها */}
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition"
                aria-label="توییتر"
              ></a>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition"
                aria-label="اینستاگرام"
              ></a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">امکانات</h3>
            {features.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {features.map((feature) => (
                  <li key={feature.href}>
                    <Link href={feature.href} className="text-slate-300 hover:text-white transition flex items-center">
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-400/70" />
                      <span>{feature.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">پس از ورود به سامانه، امکانات در دسترس شما نمایش داده می‌شود.</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">منابع مفید</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.traffic-police.ir"
                  target="_blank"
                  className="text-slate-300 hover:text-white transition"
                >
                  سایت پلیس راهور
                </a>
              </li>
              <li>
                <a
                  href="https://www.who.int/roadsafety"
                  target="_blank"
                  className="text-slate-300 hover:text-white transition"
                >
                  ایمنی جاده‌ای سازمان جهانی بهداشت
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">تماس با ما</h3>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>ایمیل: info@accident-analysis.ir</li>
              <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
              <li>ساعات پاسخگویی: شنبه تا چهارشنبه، ۹ الی ۱۶</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm">
          © {currentYear} تحلیل تصادفات رانندگی | تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
};
