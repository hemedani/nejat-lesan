"use client";

import React, { useState } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";

// Get enabled filters for yearly trend analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("YEARLY_TREND_ANALYTICS");

const YearlyTrendPage = () => {
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
      <ChartNavigation currentSection="trend" currentChart="yearly-trend" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای روند سالانه"
              description="فیلترهای مربوط به تحلیل روند سالانه تصادفات"
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
                  روند سالانه تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل تغییرات بلندمدت در آمار تصادفات و بررسی روندهای چندساله
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
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-8 mb-8 border border-indigo-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-indigo-600"
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
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                این بخش در حال توسعه می‌باشد
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                سیستم تحلیل روند سالانه تصادفات به زودی در دسترس خواهد بود. این
                ابزار شامل تحلیل‌های عمیق بلندمدت، مقایسه عملکرد سال‌ها و
                پیش‌بینی روندهای آتی خواهد بود.
              </p>
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">
                  در مرحله طراحی نمودارهای بلندمدت
                </span>
              </div>
            </div>
          </div>

          {/* Preview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Multi-Year Trend Chart Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 نمودار روند چندساله
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Simulated multi-year chart */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 300 200"
                >
                  <defs>
                    <linearGradient
                      id="yearlyGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#6366F1", stopOpacity: 0.3 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#6366F1", stopOpacity: 0 }}
                      />
                    </linearGradient>
                  </defs>
                  {/* Main trend line */}
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="3"
                    points="20,160 60,140 100,130 140,110 180,100 220,90 260,85"
                  />
                  <polyline
                    fill="url(#yearlyGradient)"
                    points="20,160 60,140 100,130 140,110 180,100 220,90 260,85 260,180 20,180"
                  />
                  {/* Secondary trend line */}
                  <polyline
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    points="20,120 60,115 100,105 140,95 180,88 220,82 260,78"
                  />
                  {/* Data points */}
                  <circle cx="60" cy="140" r="4" fill="#6366F1" />
                  <circle cx="100" cy="130" r="4" fill="#6366F1" />
                  <circle cx="140" cy="110" r="4" fill="#6366F1" />
                  <circle cx="180" cy="100" r="4" fill="#6366F1" />
                  <circle cx="220" cy="90" r="4" fill="#6366F1" />
                  <circle cx="260" cy="85" r="4" fill="#6366F1" />
                </svg>
                <div className="relative z-10 text-center bg-white bg-opacity-80 rounded-lg p-2">
                  <p className="text-gray-600 text-sm font-medium">
                    روند ۱۰ ساله پیش‌نمایش
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                نمایش روند بلندمدت تصادفات با خط روند و نوار اطمینان آماری
              </p>
            </div>

            {/* Growth Rate Analysis Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📈 تحلیل نرخ رشد
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex flex-col justify-center p-4 mb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      نرخ رشد سالانه
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-10 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        -2.3%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      نرخ رشد ۵ ساله
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-6 h-2 bg-yellow-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-bold text-yellow-600">
                        -1.1%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      نرخ رشد ۱۰ ساله
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        -3.7%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      📉 روند کلی کاهشی است که نشان‌دهنده بهبود ایمنی جاده‌ای
                      می‌باشد
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                محاسبه نرخ تغییرات سالانه و تحلیل اتجاه کلی آمار
              </p>
            </div>
          </div>

          {/* Yearly Statistics Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
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
              </div>
              <p className="text-2xl font-bold text-indigo-600">--</p>
              <p className="text-sm text-gray-600">سال‌های بررسی</p>
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-600">بهترین سال</p>
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
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600">--</p>
              <p className="text-sm text-gray-600">بدترین سال</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-orange-600"
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
              <p className="text-2xl font-bold text-orange-600">--%</p>
              <p className="text-sm text-gray-600">تغییر کلی</p>
            </div>
          </div>

          {/* Decade Comparison */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              📊 مقایسه دهه‌ای
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">📉</div>
                <h4 className="font-bold text-lg text-blue-900 mb-2">
                  دهه ۱۳۹۰
                </h4>
                <p className="text-3xl font-bold text-blue-600 mb-2">--</p>
                <p className="text-sm text-blue-700">میانگین سالانه</p>
                <div className="mt-3 text-xs text-blue-600">
                  روند کاهشی ۵.۲٪
                </div>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-bold text-lg text-purple-900 mb-2">
                  دهه ۱۴۰۰
                </h4>
                <p className="text-3xl font-bold text-purple-600 mb-2">--</p>
                <p className="text-sm text-purple-700">میانگین سالانه</p>
                <div className="mt-3 text-xs text-purple-600">
                  روند کاهشی ۳.۱٪
                </div>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-bold text-lg text-green-900 mb-2">
                  پیش‌بینی
                </h4>
                <p className="text-3xl font-bold text-green-600 mb-2">--</p>
                <p className="text-sm text-green-700">هدف ۱۴۰۵</p>
                <div className="mt-3 text-xs text-green-600">
                  کاهش ۱۰٪ نسبت به ۱۴۰۰
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Features */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ویژگی‌های پیشرفته در نظر گرفته شده
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  🔬 تحلیل‌های آماری
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        تحلیل رگرسیون
                      </p>
                      <p className="text-xs text-gray-600">
                        بررسی عوامل مؤثر بر روند سالانه
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        آزمون معنی‌داری
                      </p>
                      <p className="text-xs text-gray-600">
                        بررسی آماری معناداری تغییرات
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        تحلیل چرخه‌ای
                      </p>
                      <p className="text-xs text-gray-600">
                        شناسایی چرخه‌های بلندمدت
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  🎯 پیش‌بینی و برنامه‌ریزی
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-orange-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        پیش‌بینی ۵ ساله
                      </p>
                      <p className="text-xs text-gray-600">
                        مدل‌سازی روندهای آتی
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        تعیین اهداف
                      </p>
                      <p className="text-xs text-gray-600">
                        تنظیم اهداف کاهش تصادفات
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-teal-600"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                      >
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        سناریوسازی
                      </p>
                      <p className="text-xs text-gray-600">
                        بررسی اثر مداخلات مختلف
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Research Insights */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  🔍 مبانی علمی تحلیل روند سالانه
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  این سیستم بر اساس مدل‌های آماری پیشرفته شامل ARIMA، رگرسیون
                  چندمتغیره و تحلیل سری زمانی برای ارائه تحلیل‌های دقیق روندهای
                  بلندمدت طراحی شده است.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Time Series Analysis
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ARIMA Modeling
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Trend Detection
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Long-term Forecasting
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyTrendPage;
