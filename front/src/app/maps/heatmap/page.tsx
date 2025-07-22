"use client";

import React from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";

const HeatmapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <ChartNavigation />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              نقشه حرارتی تصادفات
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              تحلیل چگالی و شدت تصادفات با استفاده از نقشه‌های حرارتی پیشرفته
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-lg p-3 ml-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    در حال توسعه
                  </h2>
                  <p className="text-orange-100 mt-1">
                    این بخش به زودی در دسترس خواهد بود
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              <div className="text-center">
                {/* Animated Icon */}
                <div className="relative inline-block mb-8">
                  <div className="animate-pulse">
                    <svg
                      className="w-24 h-24 text-gray-300 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  {/* Floating dots animation */}
                  <div className="absolute -top-2 -right-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
                  </div>
                  <div className="absolute -bottom-2 -left-2">
                    <div
                      className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  در حال حاضر به این نقشه دسترسی ندارید
                </h3>

                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  نقشه حرارتی تصادفات برای نمایش چگالی و الگوهای مکانی حوادث در
                  دست توسعه می‌باشد
                </p>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">تحلیل سریع</h4>
                    <p className="text-gray-600 text-sm">
                      شناسایی سریع نقاط پرحادثه و الگوهای مکانی
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 12l3-3 3 3 4-4"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      تصویرسازی پیشرفته
                    </h4>
                    <p className="text-gray-600 text-sm">
                      نمایش بصری چگالی تصادفات با گرادیان حرارتی
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 px-6 py-3 rounded-xl cursor-not-allowed">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="font-medium">به زودی فعال می‌شود</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 text-gray-600 border border-white/50 shadow-sm">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                برای دریافت اطلاعات بیشتر با تیم توسعه در تماس باشید
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;
