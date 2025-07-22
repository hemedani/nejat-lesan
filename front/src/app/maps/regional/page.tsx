"use client";

import React from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";

const RegionalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-100">
      {/* Navigation */}
      <ChartNavigation />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-6 shadow-lg">
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              تحلیل منطقه‌ای تصادفات
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              تجزیه و تحلیل جامع تصادفات بر اساس تقسیمات جغرافیایی و منطقه‌ای
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    در حال توسعه
                  </h2>
                  <p className="text-emerald-100 mt-1">
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
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  {/* Floating region elements */}
                  <div className="absolute -top-4 -right-4">
                    <div
                      className="w-5 h-5 bg-emerald-400 rounded-lg animate-float"
                      style={{ animationDelay: "0s" }}
                    ></div>
                  </div>
                  <div className="absolute -bottom-3 -left-4">
                    <div
                      className="w-4 h-4 bg-teal-400 rounded-lg animate-float"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                  <div className="absolute top-1 -left-2">
                    <div
                      className="w-3 h-3 bg-emerald-300 rounded-lg animate-float"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                  <div className="absolute -top-1 right-2">
                    <div
                      className="w-2 h-2 bg-teal-300 rounded-lg animate-float"
                      style={{ animationDelay: "1.5s" }}
                    ></div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  در حال حاضر به این نقشه دسترسی ندارید
                </h3>

                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  سیستم تحلیل منطقه‌ای برای بررسی الگوهای تصادفات در سطوح مختلف
                  جغرافیایی در دست توسعه است
                </p>

                {/* Regional Levels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">
                      شهری
                    </h4>
                    <p className="text-gray-600 text-xs">تحلیل در سطح شهرها</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">
                      استانی
                    </h4>
                    <p className="text-gray-600 text-xs">
                      تحلیل در سطح استان‌ها
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">
                      منطقه‌ای
                    </h4>
                    <p className="text-gray-600 text-xs">تحلیل در سطح مناطق</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">
                      کشوری
                    </h4>
                    <p className="text-gray-600 text-xs">تحلیل در سطح کشور</p>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
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
                      مقایسه آماری
                    </h4>
                    <p className="text-gray-600 text-sm">
                      مقایسه آمار تصادفات بین مناطق مختلف
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
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      رتبه‌بندی مناطق
                    </h4>
                    <p className="text-gray-600 text-sm">
                      رتبه‌بندی بر اساس شاخص‌های ایمنی
                    </p>
                  </div>

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
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      شاخص‌های کلیدی
                    </h4>
                    <p className="text-gray-600 text-sm">
                      محاسبه KPI های ایمنی ترافیک
                    </p>
                  </div>
                </div>

                {/* Administrative Divisions */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-8 border border-emerald-100">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    تقسیمات جغرافیایی پشتیبانی شده
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-emerald-700 mb-1">
                        31 استان
                      </div>
                      <div className="text-gray-600">تحلیل استانی</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-teal-700 mb-1">
                        +400 شهرستان
                      </div>
                      <div className="text-gray-600">تحلیل شهرستانی</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-emerald-700 mb-1">
                        +1000 شهر
                      </div>
                      <div className="text-gray-600">تحلیل شهری</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-teal-700 mb-1">
                        مناطق کلان‌شهری
                      </div>
                      <div className="text-gray-600">تحلیل کلان‌شهری</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-emerald-700 mb-1">
                        مناطق شهری
                      </div>
                      <div className="text-gray-600">تحلیل محلات</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-teal-700 mb-1">
                        جاده‌های ارتباطی
                      </div>
                      <div className="text-gray-600">تحلیل محورهای ترافیکی</div>
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
                className="w-5 h-5 text-emerald-500"
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

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RegionalPage;
