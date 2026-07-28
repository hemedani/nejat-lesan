"use client";

import React, { useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { getSectionCharts, isChartAccessible } from "@/utils/chartNavigation";
import { useAuth } from "@/context/AuthContext";

const trendChartMeta: Record<string, { title: string; description: string; icon: React.ReactNode; bgColor: string; borderColor: string; iconBg: string }> = {
  "/charts/trend/severity-analytics": {
    title: "سهم شدت تصادفات",
    description: "مقایسه سهم تصادفات در رویداد با سایر ایام",
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
  },
  "/charts/trend/collision-analytics": {
    title: "نحوه و نوع برخورد",
    description: "مقایسه سهم نحوه و نوع برخورد در رویداد با سایر ایام",
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
  },
};

const trendInsights = [
  {
    title: "مقایسه رویداد با سایر ایام",
    description: "تحلیل تفاوت الگوهای تصادفات در ایام خاص نسبت به روزهای عادی",
  },
  {
    title: "شناسایی الگوهای تکراری",
    description: "کشف الگوهای تکراری در بازه‌های زمانی مختلف",
  },
  {
    title: "تحلیل تطبیقی",
    description: "مقایسه شاخص‌ها بین رویدادها و ایام عادی برای تصمیم‌گیری بهتر",
  },
  {
    title: "تصمیم‌گیری آگاهانه",
    description: "داده‌های تحلیلی دقیق برای برنامه‌ریزی اقدامات پیشگیرانه",
  },
];

const TrendChartsPage = () => {
  const { userLevel, enterpriseSettings } = useAuth();

  const visibleCharts = useMemo(() => {
    const navCharts = getSectionCharts("trend");
    return navCharts.filter((navChart) =>
      isChartAccessible(navChart.id, userLevel, enterpriseSettings),
    );
  }, [userLevel, enterpriseSettings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ChartNavigation currentSection="trend" />

      <div className="flex">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">روند رویداد</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند تصادفات در ایام خاص و رویدادها
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-medium text-orange-800 mb-4">تحلیل‌های موجود</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCharts.map((navChart) => {
                  const meta = trendChartMeta[navChart.href];
                  return (
                    <a
                      key={navChart.id}
                      href={navChart.href}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${meta?.borderColor || "border-gray-200"} ${meta?.bgColor || "bg-gray-50"} hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta?.iconBg || "bg-gray-100"}`}>
                        {meta?.icon || (
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بینش‌های روند</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {trendInsights.map((insight) => (
                  <div key={insight.title} className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                    <svg
                      className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0"
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
                      <p className="font-medium text-gray-900">{insight.title}</p>
                      <p className="text-gray-600">{insight.description}</p>
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

export default TrendChartsPage;
