"use client";

import React, { useState } from "react";
import { AllChartsModal } from "./AllChartsModal";

export const AnalyticsShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-24 min-h-[calc(100vh-64px)] flex flex-col justify-center bg-slate-950 relative overflow-hidden">
      {/* Modal */}
      <AllChartsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            تصمیم‌گیری مبتنی بر داده برای{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              ارتقای ایمنی ترافیک
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            سامانه مرصاد با ارائه داشبوردهای تحلیلی پیشرفته، امکان بررسی دقیق الگوهای تصادفات را در
            ابعاد مختلف فراهم می‌کند تا مدیران بتوانند با دیدی روشن‌تر برای ایمن‌سازی راه‌ها اقدام
            کنند.
          </p>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Temporal Analytics */}
          <div className="group relative p-8 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/30 transition-colors duration-500"></div>

            <div className="mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">روند زمانی تصادفات</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                بررسی الگوهای وقوع تصادفات در ساعات، روزها و ماه‌های مختلف سال برای تخصیص بهینه‌تر
                منابع و نیروهای امدادی.
              </p>
            </div>

            {/* Mock Chart: Bar/Line Chart */}
            <div className="mt-auto pt-6 relative z-10">
              <div className="h-32 w-full flex items-end justify-between gap-2 border-b border-slate-700/50 pb-2 relative">
                {/* Line overlay */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10"
                    fill="none"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="2"
                    className="drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  />
                </svg>
                {/* Bars */}
                {[40, 60, 45, 80, 65, 90, 55].map((height, i) => (
                  <div
                    key={i}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t-sm relative group/bar"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                      {height * 12}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                <span>شنبه</span>
                <span>دوشنبه</span>
                <span>چهارشنبه</span>
                <span>جمعه</span>
              </div>
            </div>
          </div>

          {/* Card 2: Spatial Analytics */}
          <div className="group relative p-8 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/30 transition-colors duration-500"></div>

            <div className="mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">نقشه‌های حرارتی و مکانی</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                شناسایی نقاط حادثه‌خیز و تحلیل پراکندگی جغرافیایی تصادفات در سطح معابر شهری و محورهای
                مواصلاتی.
              </p>
            </div>

            {/* Mock Chart: Heatmap/Spatial */}
            <div className="mt-auto pt-6 relative z-10">
              <div className="h-32 w-full bg-slate-900/50 rounded-xl border border-slate-700/50 relative overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30"></div>

                {/* Heat spots */}
                <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-red-500/40 rounded-full blur-xl animate-pulse"></div>
                <div
                  className="absolute top-1/2 left-1/3 w-12 h-12 bg-orange-500/40 rounded-full blur-lg animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute bottom-1/4 right-1/3 w-20 h-20 bg-yellow-500/30 rounded-full blur-xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute top-1/3 right-1/4 w-10 h-10 bg-red-600/50 rounded-full blur-md animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>

                {/* Map path mock */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-50"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M10,90 Q40,50 90,10"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <path d="M10,10 Q50,50 90,90" fill="none" stroke="#64748b" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Severity Analytics */}
          <div className="group relative p-8 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/30 transition-colors duration-500"></div>

            <div className="mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تحلیل شدت و خسارات</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                ارزیابی میزان شدت تصادفات (جرحی، فوتی، خسارتی) و شناسایی عوامل موثر بر افزایش شدت حوادث
                ترافیکی.
              </p>
            </div>

            {/* Mock Chart: Donut Chart */}
            <div className="mt-auto pt-6 relative z-10 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
                  {/* Segment 1 (Khodro - 60%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="100.48"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Segment 2 (Jorhi - 25%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="188.4"
                    className="transition-all duration-1000 ease-out"
                    style={{ transformOrigin: "center", transform: "rotate(216deg)" }}
                  />
                  {/* Segment 3 (Foti - 15%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="213.52"
                    className="transition-all duration-1000 ease-out"
                    style={{ transformOrigin: "center", transform: "rotate(306deg)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">۱۴۰۳</span>
                  <span className="text-[10px] text-slate-400">سال جاری</span>
                </div>
              </div>

              {/* Legend */}
              <div className="ml-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-300">خسارتی (۶۰٪)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-slate-300">جرحی (۲۵٪)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-slate-300">فوتی (۱۵٪)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] transition-all duration-300 px-12 py-4 rounded-full text-white font-bold text-base overflow-hidden"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

            {/* Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>

            <span className="relative z-10">مشاهده کاتالوگ جامع تحلیل‌ها</span>

            {/* Arrow */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 relative z-10 group-hover:-translate-x-1 transition-transform duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
