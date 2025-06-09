"use client";
import React from "react";
import Link from "next/link";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">درباره ما</h3>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              این پلتفرم با هدف تحلیل و بررسی علمی تصادفات رانندگی راه‌اندازی شده است. ما تلاش می‌کنیم با بهره‌گیری از داده‌های واقعی، بهبود ایمنی جاده‌ای و کاهش تلفات را با کمک تحلیل‌های هوشمند محقق کنیم.
            </p>
            <div className="flex justify-end space-x-4 space-x-reverse mt-4">
              {/* شبکه‌های اجتماعی (در صورت نیاز می‌توانید حذف کنید) */}
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="فیسبوک">
                {/* آیکن‌ها */}
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="توییتر">
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="اینستاگرام">
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">امکانات</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/search" className="text-gray-300 hover:text-white transition flex items-center">
                  <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>جستجوی پیشرفته تصادفات</span>
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-gray-300 hover:text-white transition flex items-center">
                  <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                  </svg>
                  <span>گزارش‌های تحلیلی</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition flex items-center">
                  <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0v2a2 2 0 002 2h2a2 2 0 002-2v-2m-6 0h6" />
                  </svg>
                  <span>داشبورد ایمنی جاده‌ها</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">منابع مفید</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://www.traffic-police.ir" target="_blank" className="text-gray-300 hover:text-white transition">سایت پلیس راهور</a>
              </li>
              <li>
                <a href="https://www.who.int/roadsafety" target="_blank" className="text-gray-300 hover:text-white transition">ایمنی جاده‌ای سازمان جهانی بهداشت</a>
              </li>
              <li>
                <a href="/faq" className="text-gray-300 hover:text-white transition">سؤالات متداول</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">تماس با ما</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>ایمیل: info@accident-analysis.ir</li>
              <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
              <li>ساعات پاسخگویی: شنبه تا چهارشنبه، ۹ الی ۱۶</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          © {currentYear} تحلیل تصادفات رانندگی | تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
};
