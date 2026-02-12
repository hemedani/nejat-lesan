"use client";

import React, { useState } from "react";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { useAuth } from "@/context/AuthContext";

const HotspotsAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for hotspots analytics considering enterprise settings
  const ENABLED_FILTERS = getEnabledFiltersForChartWithPermissions(
    "HOTSPOTS_ANALYTICS",
    userLevel === "Enterprise" ? enterpriseSettings : undefined,
  );

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
      <ChartNavigation currentSection="spatial" currentChart="hotspots" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
              title="فیلترهای نقاط داغ"
              description="فیلترهای مربوط به شناسایی نقاط پرخطر"
              enabledFilters={ENABLED_FILTERS}
              enterpriseSettings={enterpriseSettings}
              activeAdvancedFilters={true}
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
                  نقاط داغ تصادفات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  شناسایی و تحلیل مکان‌های پرخطر و نقاط بحرانی شهر
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
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 mb-8 border border-red-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                این بخش در حال توسعه می‌باشد
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                سیستم شناسایی نقاط داغ تصادفات به زودی در دسترس خواهد بود. این
                ابزار قدرتمند برای شناسایی دقیق مکان‌های پرخطر، ارزیابی ریسک و
                ارائه راهکارهای بهبود ایمنی طراحی شده است.
              </p>
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">در مرحله تحلیل و طراحی</span>
              </div>
            </div>
          </div>

          {/* Preview Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Heatmap Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔥 نقشه حرارتی نقاط داغ
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 opacity-30"></div>
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-red-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-8 h-8 text-red-600"
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
                  <p className="text-gray-600 text-sm font-medium">
                    نقشه حرارتی پیش‌نمایش
                  </p>
                </div>
                {/* Simulate hotspot markers */}
                <div className="absolute top-8 left-12 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute top-16 right-20 w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-12 left-16 w-5 h-5 bg-red-600 rounded-full animate-pulse delay-700"></div>
              </div>
              <p className="text-sm text-gray-600">
                نمایش رنگی شدت تجمع تصادفات با قابلیت تنظیم آستانه‌های مختلف خطر
              </p>
            </div>

            {/* Risk Assessment Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ ارزیابی سطح خطر
              </h3>
              <div className="bg-gray-50 rounded-lg h-64 flex flex-col justify-center p-4 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">خطر بالا</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      75%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">خطر متوسط</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full w-1/2"></div>
                    </div>
                    <span className="text-sm font-medium text-orange-600">
                      50%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">خطر پایین</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      25%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                طبقه‌بندی خودکار نقاط بر اساس میزان خطر و تراکم تصادفات
              </p>
            </div>
          </div>

          {/* Statistics Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600">--</p>
              <p className="text-sm text-gray-600">نقاط پرخطر</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-orange-600">--</p>
              <p className="text-sm text-gray-600">نقاط متوسط</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-yellow-600">--</p>
              <p className="text-sm text-gray-600">نقاط فعال</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-600">نقاط ایمن</p>
            </div>
          </div>

          {/* Upcoming Features */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ویژگی‌های پیشرفته در نظر گرفته شده
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  🎯 الگوریتم‌های تشخیص
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
                        الگوریتم کرنل گاوسین
                      </p>
                      <p className="text-xs text-gray-600">
                        برای تشخیص تجمع نقاط تصادف
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
                        تحلیل فضایی خودکار
                      </p>
                      <p className="text-xs text-gray-600">
                        شناسایی الگوهای پنهان در داده‌ها
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
                        ارزیابی آماری معنی‌داری
                      </p>
                      <p className="text-xs text-gray-600">
                        تایید علمی وجود نقاط داغ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  📊 گزارش‌گیری هوشمند
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
                        رتبه‌بندی خطر
                      </p>
                      <p className="text-xs text-gray-600">
                        اولویت‌بندی نقاط برای مداخله
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
                        پیش‌بینی توسعه
                      </p>
                      <p className="text-xs text-gray-600">
                        پیش‌بینی تغییر شدت نقاط داغ
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
                        راهکارهای بهبود
                      </p>
                      <p className="text-xs text-gray-600">
                        پیشنهاد اقدامات کاهش خطر
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  🔬 اطلاعات فنی پروژه
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  این سیستم با استفاده از الگوریتم‌های پیشرفته GIS و تحلیل‌های
                  آماری فضایی برای شناسایی دقیق نقاط داغ تصادفات طراحی شده است.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    تحلیل فضایی
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Machine Learning
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    آمار پیشرفته
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    GIS Analytics
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

export default HotspotsAnalyticsPage;
