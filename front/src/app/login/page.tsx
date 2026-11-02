"use client";

import LoginForm from "@/components/organisms/login/LoginForm";

const Login = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden bg-canvas">
      {/* Background Decorative Elements — the ambient glow is carried by these
          blurs, not by a page gradient. The old `via-blue-950` ramp turned into
          a navy-to-white sandwich in light mode. */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-cyan-500/10 blur-[80px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl mx-auto">
          {/* Text Content */}
          <div className="flex flex-col items-start text-right space-y-6 animate-slide-down">
            <div className="tint-brand inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tint-soft border border-tint-border text-tint-fg text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
              </span>
              سامانه هوشمند مدیریت ترافیک
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-fg leading-[1.4]">
              خوش آمدید به{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-fg to-brand">
                مرصاد
              </span>
            </h1>

            <p className="text-lg text-fg-muted max-w-xl leading-relaxed">
              با ورود به حساب کاربری خود، به نقشه‌های تعاملی تصادفات، داشبوردهای تحلیلی و ابزارهای
              مدیریتی دسترسی خواهید داشت.
            </p>

            <div className="flex items-center gap-6 pt-2 text-sm text-fg-muted">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-brand-fg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                تحلیل پیشرفته تصادفات
              </div>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-brand-fg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                نقشه‌های تعاملی
              </div>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-brand-fg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                مدیریت یکپارچه کاربران
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="animate-fade-in-delay">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 rounded-3xl blur-lg opacity-70"></div>
              <div className="relative bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-8 sm:p-10 shadow-2xl">
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl tint-brand bg-tint-strong border border-tint-border flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 text-brand-fg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-fg">ورود به حساب کاربری</h2>
                  <p className="text-sm text-fg-muted mt-2">
                    ایمیل و رمز عبور خود را وارد کنید
                  </p>
                </div>

                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;