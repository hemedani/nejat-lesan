import Link from "next/link";
import React from "react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen pt-16 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-cyan-500/10 blur-[80px]"></div>
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="flex flex-col items-start text-right space-y-6 animate-slide-down">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              نسخه جدید مرصاد منتشر شد
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.4] md:leading-[1.3]">
              سامانه هوشمند مدیریت ترافیک و{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                تحلیل تصادفات
              </span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl leading-relaxed">
              با بهره‌گیری از هوش مصنوعی و تحلیل پیشرفته داده‌های مکانی، الگوهای ترافیکی را کشف کنید،
              تصادفات را پیش‌بینی کرده و ایمنی راه‌های کشور را به سطح جدیدی ارتقا دهید.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
              <Link
                href="/map"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                  />
                </svg>
                ورود به نقشه تعاملی
              </Link>

              <Link
                href="/statistics"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
                مشاهده آمار
              </Link>
            </div>
          </div>

          {/* 3D Mockup / Visual */}
          <div className="relative w-full h-full min-h-[400px] flex items-center justify-center animate-fade-in-delay perspective-[2000px]">
            {/* Main Floating Card */}
            <div
              className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-transform duration-700 ease-out hover:rotate-0"
              style={{ transform: "rotateX(8deg) rotateY(-12deg) rotateZ(2deg)" }}
            >
              {/* Mac-like Header */}
              <div className="h-10 bg-slate-800/80 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-auto text-xs text-slate-400 font-mono">mersad-map-dashboard</div>
              </div>

              {/* Dashboard Body (Map Simulation) */}
              <div className="relative w-full h-[calc(100%-2.5rem)] bg-[#0f172a] overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50"></div>

                {/* Simulated Map Features */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M10,50 Q30,20 50,50 T90,50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M20,80 Q40,40 70,70 T100,30"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                  />
                </svg>

                {/* Glowing Accident Markers */}
                <div className="absolute top-[30%] left-[40%] w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
                <div
                  className="absolute top-[60%] left-[20%] w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute top-[45%] left-[70%] w-5 h-5 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.9)] animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute top-[75%] left-[65%] w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>

                {/* Floating UI Panels */}
                <div className="absolute top-4 right-4 w-32 h-24 bg-slate-800/90 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-lg">
                  <div className="w-full h-2 bg-slate-700 rounded mb-2"></div>
                  <div className="w-3/4 h-2 bg-slate-700 rounded mb-4"></div>
                  <div className="flex items-end gap-1 h-8">
                    <div className="w-1/4 bg-blue-500 h-[40%] rounded-t-sm"></div>
                    <div className="w-1/4 bg-blue-500 h-[70%] rounded-t-sm"></div>
                    <div className="w-1/4 bg-blue-500 h-[50%] rounded-t-sm"></div>
                    <div className="w-1/4 bg-blue-500 h-[90%] rounded-t-sm"></div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 w-40 h-16 bg-slate-800/90 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-slate-700 rounded mb-2"></div>
                    <div className="w-1/2 h-2 bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Glow behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-600/10 to-cyan-400/10 blur-3xl -z-10 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
