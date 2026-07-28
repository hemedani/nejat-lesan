"use client";

import React, { useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { getSectionCharts, isChartAccessible } from "@/utils/chartNavigation";
import { useAuth } from "@/context/AuthContext";

const overallCharts = [
  {
    title: "سهم شدت تصادفات",
    description: "توزیع تصادفات بر اساس سطوح شدت شامل فوتی، جرحی و خسارتی — نمای کلی از شدت حوادث رانندگی",
    icon: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconBg: "bg-red-100",
  },
  {
    title: "تحلیل انواع برخورد",
    description: "بررسی جامع انواع برخورد وسایل نقلیه شامل برخورد اصلی، تصادفات تک‌وسیله‌ای و سایر انواع",
    icon: (
      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
  },
  {
    title: "نقش مؤثر نقص راه",
    description: "تحلیل تأثیر نقص‌های راه بر تصادفات — توزیع تصادفات دارای و فاقد نقص مؤثر راه به تفکیک نوع نقص",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    title: "تحلیل ماهانه تعطیلات",
    description: "مقایسه تعداد تصادفات در روزهای تعطیل و غیرتعطیل به تفکیک ماه — شناسایی الگوهای فصلی تأثیر تعطیلات",
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
  },
  {
    title: "تحلیل ساعتی روز هفته",
    description: "نقشه حرارتی توزیع تصادفات بر اساس ساعت شبانه‌روز و روز هفته — شناسایی ساعات و روزهای پرخطر",
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
  },
  {
    title: "علل تامه تصادفات",
    description: "نمودار درختی از مهم‌ترین علل تامه تصادفات شدید — ترکیب عوامل انسانی، وسیله نقلیه، راه و محیط",
    icon: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
  },
  {
    title: "عوامل انسانی مؤثر",
    description: "توزیع عوامل انسانی مؤثر در تصادفات مانند عدم توجه به جلو، سرعت غیرمجاز و فاصله نامناسب",
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  {
    title: "سهم تصادفات به تفکیک کاربری محل",
    description: "تحلیل سهم تصادفات به تفکیک نوع کاربری محل (مسکونی، تجاری، صنعتی، آموزشی و ...)",
    icon: (
      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    iconBg: "bg-pink-100",
  },
  {
    title: "توزیع عامل وسیله نقلیه",
    description: "تحلیل عوامل مرتبط با وسیله نقلیه شامل نقص فنی موتور، ترمز، لاستیک و سایر اجزاء",
    icon: (
      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 000 6h6a3 3 0 000-6H9zm0 0V6a3 3 0 016 0v6m-6 0H6a3 3 0 00-3 3v3a3 3 0 003 3h12a3 3 0 003-3v-3a3 3 0 00-3-3h-3" />
      </svg>
    ),
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    iconBg: "bg-teal-100",
  },
];

const overallInsights = [
  {
    title: "تحلیل یکپارچه",
    description: "همه تحلیل‌ها در یک نما — بدون نیاز به جابجایی بین صفحات مختلف",
  },
  {
    title: "فیلترهای پیشرفته",
    description: "اعمال فیلترهای ترکیبی بر روی همه نمودارها به صورت همزمان",
  },
  {
    title: "بصری‌سازی متنوع",
    description: "انواع نمودارها شامل میله‌ای، دایره‌ای، درختی، حرارتی و حبابی برای تحلیل جامع",
  },
  {
    title: "تصمیم‌گیری داده‌محور",
    description: "داده‌های تحلیلی دقیق برای برنامه‌ریزی و بهبود ایمنی راه‌ها",
  },
];

// Map chart IDs (from nav config) to their metadata (icons, colors)
const chartIdToMeta: Record<string, (typeof overallCharts)[0]> = {};
overallCharts.forEach((chart, i) => {
  const navCharts = getSectionCharts("overall");
  if (navCharts[i]) chartIdToMeta[navCharts[i].id] = chart;
});

const OverallChartsPage = () => {
  const { userLevel, enterpriseSettings } = useAuth();

  const visibleCharts = useMemo(() => {
    const navCharts = getSectionCharts("overall");
    return navCharts.filter((navChart) =>
      isChartAccessible(navChart.id, userLevel, enterpriseSettings),
    );
  }, [userLevel, enterpriseSettings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ChartNavigation currentSection="overall" />

      <div className="flex">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">دید کلی</h1>
                <p className="text-sm text-gray-600 mt-1">
                  نمای کلی از تحلیل‌های تصادفات — هر بخش یک جنبه خاص از داده‌ها را بررسی می‌کند
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-800 mb-4">تحلیل‌های موجود</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCharts.map((navChart) => {
                  const meta = chartIdToMeta[navChart.id];
                  return (
                    <a
                      key={navChart.id}
                      href={navChart.href}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${meta?.borderColor || "border-gray-200"} ${meta?.bgColor || "bg-gray-50"} hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta?.iconBg || "bg-gray-100"}`}>
                        {meta?.icon || (
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{navChart.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{meta?.description || ""}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-medium text-green-800 mb-3">چرا دید کلی؟</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {overallInsights.map((insight) => (
                  <div key={insight.title} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-green-800">{insight.title}</p>
                      <p className="text-green-700">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallChartsPage;
