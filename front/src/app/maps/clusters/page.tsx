"use client";

import React from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";

const ClustersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-100">
      {/* Navigation */}
      <ChartNavigation />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              تحلیل خوشه‌ای تصادفات
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              شناسایی و تحلیل خوشه‌های تصادفات با استفاده از الگوریتم‌های هوش
              مصنوعی
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    در حال توسعه
                  </h2>
                  <p className="text-purple-100 mt-1">
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  {/* Floating elements animation */}
                  <div className="absolute -top-3 -right-3">
                    <div className="w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
                  </div>
                  <div className="absolute -bottom-1 -left-3">
                    <div
                      className="w-3 h-3 bg-pink-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                  <div className="absolute top-2 -left-1">
                    <div
                      className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"
                      style={{ animationDelay: "0.7s" }}
                    ></div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  در حال حاضر به این نقشه دسترسی ندارید
                </h3>

                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  سیستم تحلیل خوشه‌ای برای گروه‌بندی هوشمند تصادفات و شناسایی
                  الگوهای پنهان در دست توسعه است
                </p>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
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
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">هوش مصنوعی</h4>
                    <p className="text-gray-600 text-sm">
                      استفاده از الگوریتم‌های پیشرفته ML
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      گروه‌بندی هوشمند
                    </h4>
                    <p className="text-gray-600 text-sm">
                      خوشه‌بندی بر اساس ویژگی‌های مختلف
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      تحلیل آماری
                    </h4>
                    <p className="text-gray-600 text-sm">
                      ارائه آمار دقیق هر خوشه
                    </p>
                  </div>
                </div>

                {/* Algorithm Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-100">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
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
                    الگوریتم‌های پیشرفته
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-purple-700">K-Means</div>
                      <div className="text-gray-600">
                        خوشه‌بندی مبتنی بر فاصله
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-pink-700">DBSCAN</div>
                      <div className="text-gray-600">تشخیص خوشه‌های چگال</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-indigo-700">
                        Hierarchical
                      </div>
                      <div className="text-gray-600">
                        خوشه‌بندی سلسله‌مراتبی
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-700">
                        Gaussian
                      </div>
                      <div className="text-gray-600">مدل‌های احتمالاتی</div>
                    </div>
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
                className="w-5 h-5 text-purple-500"
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

export default ClustersPage;
