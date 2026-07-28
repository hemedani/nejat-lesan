"use client";

import React, { useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { getSectionCharts, isChartAccessible } from "@/utils/chartNavigation";
import { useAuth } from "@/context/AuthContext";

const temporalCharts = [
  {
    title: "شمار تصادفات",
    description: "تحلیل روند تعداد تصادفات در بازه‌های زمانی مختلف و شناسایی الگوهای زمانی",
    href: "/charts/temporal/count-analytics",
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
    title: "سهم تصادفات فوتی از شدید",
    description: "تحلیل روند درصد تصادفات فوتی در بین تصادفات شدید در بازه‌های زمانی مختلف",
    href: "/charts/temporal/severity-analytics",
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
  },
  {
    title: "تصادفات در شب",
    description: "تحلیل مقایسه‌ای تصادفات شبانه بر اساس شرایط روشنایی محل حادثه",
    href: "/charts/temporal/night-analytics",
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
  },
  {
    title: "مقایسه زمانی صدمات",
    description: "تحلیل درصد سهم صدمات انتخابی از کل تصادفات در بازه‌های زمانی مختلف",
    href: "/charts/temporal/damage-analytics",
    icon: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconBg: "bg-red-100",
  },
  {
    title: "نحوه و نوع برخورد",
    description: "تحلیل روند زمانی انواع مختلف برخورد و مقایسه آن‌ها در بازه‌های مختلف",
    href: "/charts/temporal/collision-analytics",
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
    title: "علت تامه",
    description: "تحلیل روند زمانی ۱۰ علت برتر تصادفات و مقایسه آن‌ها در طول زمان",
    href: "/charts/temporal/total-reason-analytics",
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconBg: "bg-indigo-100",
  },
  {
    title: "کاربران فاقد گواهینامه",
    description: "تحلیل روند زمانی تصادفات ناشی از رانندگان فاقد گواهینامه معتبر",
    href: "/charts/temporal/unlicensed-drivers-analytics",
    icon: (
      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    iconBg: "bg-teal-100",
  },
];

const temporalInsights = [
  {
    title: "روند فصلی",
    description: "تصادفات در فصل تابستان بیشترین میزان را دارند",
  },
  {
    title: "کاهش تصادفات",
    description: "در سال ۱۴۰۲ کاهش کلی تصادفات مشاهده شده است",
  },
  {
    title: "تحلیل عمقی",
    description: "برای تحلیل دقیق‌تر از چارت‌های تخصصی استفاده کنید",
  },
  {
    title: "فیلترهای پیشرفته",
    description: "از فیلترهای کناری برای تحلیل هدفمند استفاده کنید",
  },
];

// Map chart href to metadata (icons, colors)
const temporalChartMeta: Record<string, (typeof temporalCharts)[0]> = {};
temporalCharts.forEach((chart) => {
  temporalChartMeta[chart.href] = chart;
});

const TemporalChartsPage = () => {
  const { userLevel, enterpriseSettings } = useAuth();

  const visibleCharts = useMemo(() => {
    const navCharts = getSectionCharts("temporal");
    return navCharts.filter((navChart) =>
      isChartAccessible(navChart.id, userLevel, enterpriseSettings),
    );
  }, [userLevel, enterpriseSettings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ChartNavigation currentSection="temporal" />

      <div className="flex">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مقایسه زمانی</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی تصادفات و مقایسه در بازه‌های مختلف
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-800 mb-4">تحلیل‌های موجود</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCharts.map((navChart) => {
                  const meta = temporalChartMeta[navChart.href];
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
              <h3 className="font-medium text-green-800 mb-3">چرا تحلیل زمانی؟</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {temporalInsights.map((insight) => (
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

export default TemporalChartsPage;
