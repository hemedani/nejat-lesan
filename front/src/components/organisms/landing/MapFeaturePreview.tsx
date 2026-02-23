import React from "react";

export const MapFeaturePreview = () => {
  return (
    <section className="py-24 min-h-screen flex flex-col justify-center bg-slate-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 start-0 w-full h-full bg-blue-900/10 blur-[150px] -translate-y-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              تحلیل دقیق مکانی
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              تسلط کامل بر جغرافیا با{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                ابزارهای پیشرفته نقشه
              </span>
            </h2>

            <p className="text-lg text-slate-300 leading-relaxed">
              سامانه مرصاد با ارائه یک نقشه تعاملی قدرتمند، به شما اجازه می‌دهد تا داده‌های تصادفات را
              با دقت بالا فیلتر و بررسی کنید. از انتخاب سلسله‌مراتبی مناطق تا رسم آزادانه روی نقشه، همه
              چیز برای تحلیل دقیق فراهم است.
            </p>

            <div className="space-y-6 pt-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-blue-400">
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
                      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">سازمان‌دهی سلسله‌مراتبی</h3>
                  <p className="text-slate-400 leading-relaxed">
                    فیلتر داده‌ها بر اساس استان، شهرستان، شهر، منطقه شهرداری و حتی محورهای مواصلاتی خاص
                    برای رسیدن به دقیق‌ترین نتایج.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    انتخاب محدوده با رسم چندضلعی (Polygon)
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    با ابزار رسم پیشرفته، محدوده دلخواه خود را به صورت آزادانه روی نقشه مشخص کنید تا
                    تنها تصادفات همان ناحیه تحلیل شوند.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Content */}
          <div className="w-full lg:w-1/2">
            <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl group">
              {/* Map Background Pattern */}
              <div className="absolute inset-0 bg-[#0f172a]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40"></div>

                {/* Abstract Map Paths */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M-10,40 Q30,60 50,40 T110,50"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M20,-10 Q40,40 30,80 T40,110"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="0.5"
                  />
                  <path
                    d="M60,-10 Q50,30 70,60 T60,110"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>

              {/* Drawn Polygon */}
              <svg
                className="absolute inset-0 w-full h-full z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points="30,30 70,20 80,60 40,80 20,50"
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="animate-[pulse_4s_ease-in-out_infinite]"
                />
                {/* Polygon Nodes */}
                <circle cx="30" cy="30" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="70" cy="20" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="80" cy="60" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="40" cy="80" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
                <circle cx="20" cy="50" r="1.5" fill="#fff" stroke="#3b82f6" strokeWidth="0.5" />
              </svg>

              {/* Markers Inside Polygon */}
              <div className="absolute top-[35%] start-[40%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] z-20 animate-bounceIn"></div>
              <div
                className="absolute top-[45%] start-[60%] w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] z-20 animate-bounceIn"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute top-[60%] start-[45%] w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)] z-20 animate-bounceIn"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <div
                className="absolute top-[30%] start-[65%] w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)] z-20 animate-bounceIn"
                style={{ animationDelay: "0.6s" }}
              ></div>

              {/* Markers Outside Polygon (Dimmed) */}
              <div className="absolute top-[20%] start-[20%] w-2 h-2 bg-slate-500 rounded-full opacity-50 z-10"></div>
              <div className="absolute top-[70%] start-[80%] w-2 h-2 bg-slate-500 rounded-full opacity-50 z-10"></div>
              <div className="absolute top-[80%] start-[30%] w-2 h-2 bg-slate-500 rounded-full opacity-50 z-10"></div>

              {/* Leaflet-like Controls Mockup */}
              <div className="absolute top-4 end-4 flex flex-col gap-2 z-30">
                <div className="bg-slate-800/90 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-lg">
                  <div className="w-8 h-8 flex items-center justify-center border-b border-white/10 text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </div>
                </div>
                <div className="bg-slate-800/90 border border-white/10 rounded-lg backdrop-blur-md overflow-hidden shadow-lg">
                  <div className="w-8 h-8 flex items-center justify-center text-blue-400 bg-blue-500/10 cursor-pointer">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.396c.339-.462.086-1.114-.46-1.211L8.25 9.5M11.42 15.17l-3.396 2.492c-.462.339-1.114.086-1.211-.46l-1.071-5.203m0 0L2.25 3.75m1.5 1.5L9.5 8.25m0 0l5.203 1.071"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Floating Info Card */}
              <div className="absolute bottom-6 start-6 end-6 sm:end-auto sm:w-64 bg-slate-800/90 border border-white/10 rounded-xl p-4 backdrop-blur-md shadow-2xl z-30 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-white">محدوده انتخاب شده</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">مساحت:</span>
                    <span className="text-blue-300 font-mono" dir="ltr">
                      12.5 km²
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">تعداد تصادفات:</span>
                    <span className="text-red-400 font-mono">۴ مورد</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
