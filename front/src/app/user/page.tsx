"use client";

import React, { useState } from "react";
import Link from "next/link";

const UserPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const user = {
    name: "احمد محمدی",
    email: "ahmad.mohammadi@example.com",
    role: "کاربر عادی",
    department: "پلیس راهور",
    joinDate: "۱۴۰۲/۰۳/۱۵",
    lastLogin: "۱۴۰۳/۰۸/۲۳ - ۱۴:۳۰",
  };

  const stats = {
    reportsViewed: 156,
    chartsAccessed: 89,
    mapsViewed: 234,
    timeSpent: "۱۲۳ ساعت",
  };

  const recentActivities = [
    {
      id: 1,
      action: "مشاهده نمودار تحلیل شدت تصادفات",
      time: "۲ ساعت پیش",
    },
    {
      id: 2,
      action: "دسترسی به نقشه تصادفات اهواز",
      time: "۵ ساعت پیش",
    },
    {
      id: 3,
      action: "صادرات گزارش ماهانه",
      time: "۱ روز پیش",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← بازگشت به داشبورد
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              پروفایل کاربری
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {user.name}
                </h2>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {user.role}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">بخش:</span>
                    <span className="font-medium text-gray-900">
                      {user.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">تاریخ عضویت:</span>
                    <span className="font-medium text-gray-900">
                      {user.joinDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">آخرین ورود:</span>
                    <span className="font-medium text-gray-900">
                      {user.lastLogin}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  ویرایش پروفایل
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8" dir="rtl">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "profile"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    اطلاعات کلی
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "activity"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    فعالیت‌های اخیر
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "profile" && (
                  <div>
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
                          📊
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.reportsViewed}
                        </p>
                        <p className="text-sm text-gray-600">
                          گزارش مشاهده شده
                        </p>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
                          📈
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.chartsAccessed}
                        </p>
                        <p className="text-sm text-gray-600">
                          نمودار بررسی شده
                        </p>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
                          🗺️
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats.mapsViewed}
                        </p>
                        <p className="text-sm text-gray-600">نقشه مشاهده شده</p>
                      </div>

                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-2xl">
                          ⏱️
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          {stats.timeSpent}
                        </p>
                        <p className="text-sm text-gray-600">زمان استفاده</p>
                      </div>
                    </div>

                    {/* Quick Access */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        دسترسی سریع
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                          href="/charts"
                          className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                              📊
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                نمودارها
                              </h4>
                              <p className="text-sm text-gray-600">
                                مشاهده نمودارهای تحلیلی
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          href="/maps"
                          className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                              🗺️
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                نقشه‌ها
                              </h4>
                              <p className="text-sm text-gray-600">
                                مشاهده نقشه‌های تعاملی
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          href="/admin"
                          className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                              ⚙️
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                مدیریت
                              </h4>
                              <p className="text-sm text-gray-600">
                                پنل مدیریت سیستم
                              </p>
                            </div>
                          </div>
                        </Link>

                        <Link
                          href="/chatbot"
                          className="block p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">
                              💬
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                چت‌بات
                              </h4>
                              <p className="text-sm text-gray-600">
                                پاسخ به سوالات شما
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      فعالیت‌های اخیر
                    </h3>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl">
                            📝
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
