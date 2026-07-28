"use client";

import React, { useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { getSectionCharts, isChartAccessible } from "@/utils/chartNavigation";
import { useAuth } from "@/context/AuthContext";

const spatialChartMeta: Record<string, { title: string; description: string; icon: React.ReactNode; bgColor: string; borderColor: string; iconBg: string }> = {
  "/charts/spatial/severity-analytics": {
    title: "سهم شدت تصادفات",
    description: "مقایسه مکانی سهم تصادفات بر اساس سطوح شدت در مناطق مختلف",
    icon: (
      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
  },
  "/charts/spatial/light-analytics": {
    title: "وضعیت روشنایی",
    description: "مقایسه مکانی وضعیت روشنایی در محل تصادفات در مناطق مختلف",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
  },
  "/charts/spatial/collision-analytics": {
    title: "نحوه و نوع برخورد",
    description: "مقایسه مکانی نحوه و نوع برخورد تصادفات در مناطق مختلف",
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
  },
};

const spatialInsights = [
  {
    title: "تحلیل منطقه‌ای",
    description: "بررسی توزیع و الگوهای تصادفات در مناطق مختلف شهری",
  },
  {
    title: "شناسایی نقاط پرخطر",
    description: "تعیین مکان‌هایی با بالاترین نرخ تصادف برای اقدامات پیشگیرانه",
  },
  {
    title: "مقایسه شاخص‌ها",
    description: "مقایسه شاخص‌های شدت، روشنایی و نوع برخورد در سراسر شهر",
  },
  {
    title: "تصمیم‌گیری مکان‌محور",
    description: "داده‌های مکانی دقیق برای برنامه‌ریزی و بهبود زیرساخت‌های ترافیکی",
  },
];

const SpatialChartsPage = () => {
  const { userLevel, enterpriseSettings } = useAuth();

  const visibleCharts = useMemo(() => {
    const navCharts = getSectionCharts("spatial");
    return navCharts.filter((navChart) =>
      isChartAccessible(navChart.id, userLevel, enterpriseSettings),
    );
  }, [userLevel, enterpriseSettings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ChartNavigation currentSection="spatial" />

      <div className="flex">
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مقایسه مکانی</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل جغرافیایی تصادفات و شناسایی الگوهای مکانی
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-medium text-purple-800 mb-4">تحلیل‌های موجود</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCharts.map((navChart) => {
                  const meta = spatialChartMeta[navChart.href];
                  return (
                    <a
                      key={navChart.id}
                      href={navChart.href}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${meta?.borderColor || "border-gray-200"} ${meta?.bgColor || "bg-gray-50"} hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${meta?.iconBg || "bg-gray-100"}`}>
                        {meta?.icon || (
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بینش‌های جغرافیایی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {spatialInsights.map((insight) => (
                  <div key={insight.title} className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                    <svg
                      className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0"
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

export default SpatialChartsPage;
