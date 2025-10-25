"use client";

import React, { useState } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";

// Get enabled filters for monthly trend analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("MONTHLY_TREND_ANALYTICS");

const MonthlyTrendPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);

  // Handle filter submission (placeholder)
  const handleFilterSubmit = async (filters: ChartFilterState) => {
    console.log("Filters applied:", filters);
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="trend" currentChart="monthly-trend" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای روند ماهانه"
              description="فیلترهای مربوط به تحلیل روند ماهانه تصادفات"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  روند ماهانه تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل تغییرات ماهانه در آمار تصادفات و شناسایی الگوهای فصلی
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  {showFilterSidebar ? "مخفی کردن فیلتر" : "نمایش فیلتر"}
                </button>
              </div>
            </div>
          </div>

          {/* Under Development Message */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-8 mb-8 border border-orange-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                این بخش در حال توسعه می‌باشد
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                سیستم تحلیل روند ماهانه تصادفات به زودی در دسترس خواهد بود. این
                ابزار شامل نمودارهای تعاملی، تحلیل الگوهای فصلی و پیش‌بینی آماری
                روندهای آتی خواهد بود.
              </p>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">
                  در حال توسعه نمودارهای ماهانه
                </span>
              </div>
            </div>
          </div>

          {/* Preview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Line Chart Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📈 نمودار خطی روند ماهانه
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Simulated line chart */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 300 200"
                >
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#3B82F6", stopOpacity: 0.3 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#3B82F6", stopOpacity: 0 }}
                      />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    points="20,150 50,120 80,140 110,100 140,110 170,80 200,90 230,70 260,85"
                  />
                  <polyline
                    fill="url(#gradient)"
                    points="20,150 50,120 80,140 110,100 140,110 170,80 200,90 230,70 260,85 260,180 20,180"
                  />
                  {/* Data points */}
                  <circle cx="50" cy="120" r="4" fill="#3B82F6" />
                  <circle cx="110" cy="100" r="4" fill="#3B82F6" />
                  <circle cx="170" cy="80" r="4" fill="#3B82F6" />
                  <circle cx="230" cy="70" r="4" fill="#3B82F6" />
                </svg>
                <div className="relative z-10 text-center">
                  <p className="text-gray-500 text-sm font-medium">
                    نمودار روند پیش‌نمایش
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                نمایش تغییرات ماهانه تعداد تصادفات با قابلیت مقایسه سال‌های
                مختلف
              </p>
            </div>

            {/* Seasonal Pattern Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🍂 الگوهای فصلی
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex flex-col justify-center p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-100 rounded-lg">
                    <div className="text-2xl mb-1">❄️</div>
                    <p className="text-sm font-medium text-blue-800">زمستان</p>
                    <p className="text-xs text-blue-600">کاهش 15%</p>
                  </div>
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <div className="text-2xl mb-1">🌱</div>
                    <p className="text-sm font-medium text-green-800">بهار</p>
                    <p className="text-xs text-green-600">افزایش 8%</p>
                  </div>
                  <div className="text-center p-3 bg-orange-100 rounded-lg">
                    <div className="text-2xl mb-1">☀️</div>
                    <p className="text-sm font-medium text-orange-800">
                      تابستان
                    </p>
                    <p className="text-xs text-orange-600">اوج +25%</p>
                  </div>
                  <div className="text-center p-3 bg-amber-100 rounded-lg">
                    <div className="text-2xl mb-1">🍁</div>
                    <p className="text-sm font-medium text-amber-800">پاییز</p>
                    <p className="text-xs text-amber-600">کاهش 5%</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                تحلیل تأثیر فصول مختلف بر میزان وقوع تصادفات
              </p>
            </div>
          </div>

          {/* Monthly Statistics Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-600">--</p>
              <p className="text-sm text-gray-600">میانگین ماهانه</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-600">حداکثر ماهانه</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600">--</p>
              <p className="text-sm text-gray-600">حداقل ماهانه</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-600">--%</p>
              <p className="text-sm text-gray-600">تغییر نسبی</p>
            </div>
          </div>

          {/* Upcoming Features */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ویژگی‌های در نظر گرفته شده
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    نمودارهای تعاملی
                  </h4>
                  <p className="text-sm text-gray-600">
                    نمودارهای قابل تعامل با قابلیت زوم و انتخاب بازه زمانی
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">تحلیل فصلی</h4>
                  <p className="text-sm text-gray-600">
                    شناسایی الگوهای فصلی و تأثیر آب و هوا بر تصادفات
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    پیش‌بینی روند
                  </h4>
                  <p className="text-sm text-gray-600">
                    پیش‌بینی آماری روندهای ماهانه با استفاده از مدل‌های پیشرفته
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    مقایسه سال‌ها
                  </h4>
                  <p className="text-sm text-gray-600">
                    مقایسه آمار ماهانه در سال‌های مختلف
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    تحلیل انحراف
                  </h4>
                  <p className="text-sm text-gray-600">
                    شناسایی ماه‌های غیرطبیعی و تحلیل عوامل مؤثر
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-teal-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    گزارش تخصصی
                  </h4>
                  <p className="text-sm text-gray-600">
                    تولید گزارش‌های تحلیلی ماهانه قابل صادرات
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📅 جدول زمانی توسعه
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    مرحله ۱: طراحی رابط کاربری
                  </p>
                  <p className="text-sm text-gray-600">✅ تکمیل شده</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    مرحله ۲: پیاده‌سازی API
                  </p>
                  <p className="text-sm text-gray-600">🔄 در حال انجام</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    مرحله ۳: نمودارهای تعاملی
                  </p>
                  <p className="text-sm text-gray-600">⏳ در انتظار</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    مرحله ۴: تست و بهینه‌سازی
                  </p>
                  <p className="text-sm text-gray-600">⏳ در انتظار</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendPage;
