"use client";

import React, { useState } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import ChartNavigation from "@/components/navigation/ChartNavigation";

const TemporalChartsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [, setIsLoading] = useState(false);

  // Handle filter submission (placeholder)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFilterSubmit = async (filters: RoadDefectsFilterState) => {
    setIsLoading(true);
    // TODO: Implement temporal analytics API calls
    setTimeout(() => setIsLoading(false), 1000);
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
      <ChartNavigation currentSection="temporal" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleFilterSubmit}
              config={getFilterConfig()}
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
                  مقایسه زمانی
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی تصادفات و مقایسه در بازه‌های مختلف
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

          {/* Content */}
          <div className="space-y-6">
            {/* Quick Navigation to Temporal Charts */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                تحلیل‌های زمانی
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <a
                  href="/charts/temporal/time-series"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
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
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">سری زمانی</h3>
                      <p className="text-sm text-gray-600">
                        تحلیل روند تصادفات در طول زمان
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/temporal/seasonal"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">تحلیل فصلی</h3>
                      <p className="text-sm text-gray-600">
                        بررسی الگوهای فصلی تصادفات
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/temporal/count-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
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
                    <div>
                      <h3 className="font-medium text-gray-900">
                        شمار تصادفات
                      </h3>
                      <p className="text-sm text-gray-600">
                        مقایسه زمانی تعداد تصادفات
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/temporal/severity-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        سهم تصادفات فوتی از شدید
                      </h3>
                      <p className="text-sm text-gray-600">
                        تحلیل زمانی درصد تصادفات فوتی
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/charts/temporal/night-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
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
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        تصادفات در شب
                      </h3>
                      <p className="text-sm text-gray-600">
                        مقایسه تصادفات شبانه با/بدون روشنایی
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-600"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  تحلیل‌های زمانی
                </h3>
                <p className="text-gray-600">
                  تحلیل‌های مقایسه زمانی در حال توسعه می‌باشد.
                  <br />
                  شامل نمودارهای سری زمانی، تحلیل روند، و مقایسه‌های دوره‌ای
                  خواهد بود.
                </p>
              </div>
            </div>

            {/* Features Coming Soon */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-800 mb-3">
                ویژگی‌های در دست توسعه
              </h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  نمودار سری زمانی تصادفات روزانه، هفتگی و ماهانه
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  تحلیل فصلی و الگوهای تکراری
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  مقایسه بازه‌های زمانی مختلف
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  پیش‌بینی روند آتی
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalChartsPage;
