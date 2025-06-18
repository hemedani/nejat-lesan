'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set target date to September 1, 2025
  const targetDate = new Date('2025-09-01T00:00:00').getTime();

  useEffect(() => {
    setIsClient(true);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setEmail('');
    }, 1500);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-red-900 to-slate-800 flex items-center justify-center dir-rtl">
        <div className="text-center">
          <div className="loader"></div>
          <p className="text-white mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-red-900 to-slate-800 relative overflow-hidden dir-rtl pt-6 pb-2">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Static Orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main Headline */}
          <div className="animate-slide-up">
            <div className="flex justify-center mb-8">
              <div className="bg-red-500/20 p-4 rounded-full border-2 border-red-500/30">
                <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                سیستم تحلیل تصادفات ترافیکی
              </span>
              <br />
              <span className="text-white/90 text-3xl sm:text-4xl lg:text-5xl">
                به زودی راه‌اندازی می‌شود
              </span>
            </h1>
          </div>

          {/* Sub-headline */}
          <div className="animate-slide-up-delay-2">
            <p className="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              ما در حال توسعه یک سیستم پیشرفته برای تحلیل و پیش‌بینی تصادفات ترافیکی در ایران هستیم. این سیستم به کمک هوش مصنوعی و تحلیل داده‌ها، به کاهش تصادفات و افزایش ایمنی جاده‌ای کمک خواهد کرد.
            </p>
          </div>

          {/* Features */}
          <div className="animate-slide-up-delay-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-orange-400 text-3xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">تحلیل داده‌ها</h3>
                <p className="text-gray-300 text-sm">تحلیل جامع آمار تصادفات و شناسایی الگوهای خطرناک</p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-red-400 text-3xl mb-4">🚨</div>
                <h3 className="text-xl font-bold text-white mb-2">هشدار زودهنگام</h3>
                <p className="text-gray-300 text-sm">پیش‌بینی نقاط پرخطر و ارائه هشدارهای به‌موقع</p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-blue-400 text-3xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold text-white mb-2">راهکارهای ایمنی</h3>
                <p className="text-gray-300 text-sm">ارائه پیشنهادات عملی برای بهبود ایمنی جاده‌ها</p>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="animate-slide-up-delay-4">
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white/90 mb-8">
                زمان باقی‌مانده تا راه‌اندازی:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
                {[
                  { value: timeLeft.days, label: 'روز' },
                  { value: timeLeft.hours, label: 'ساعت' },
                  { value: timeLeft.minutes, label: 'دقیقه' },
                  { value: timeLeft.seconds, label: 'ثانیه' }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      {item.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-gray-300 text-sm sm:text-base">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Subscription */}
          <div className="animate-slide-up-delay-5">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                از آخرین تطورات با‌خبر شوید
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                ایمیل خود را وارد کنید تا از راه‌اندازی سیستم و آخرین به‌روزرسانی‌های مربوط به ایمنی ترافیک اطلاع پیدا کنید.
              </p>

              {!isSubmitted ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ایمیل خود را وارد کنید"
                      required
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm text-lg text-right"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                    <span className="relative flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <div className="loader ml-3"></div>
                          در حال ارسال...
                        </>
                      ) : (
                        'اطلاع‌رسانی به من'
                      )}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="animate-bounce-in">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 mb-6">
                    <div className="text-green-400 text-4xl mb-4">✓</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      با موفقیت ثبت شد!
                    </h3>
                    <p className="text-gray-300">
                      ایمیل شما دریافت شد. از آخرین تطورات سیستم تحلیل تصادفات ترافیکی مطلع خواهید شد.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="animate-slide-up-delay-6">
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">۱۷,۰۰۰+</div>
                <div className="text-gray-300 text-sm">تصادف ساليانه در ايران</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">۲۰,۰۰۰+</div>
                <div className="text-gray-300 text-sm">فوتی ساليانه ترافیکی</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">۳۰٪</div>
                <div className="text-gray-300 text-sm">هدف کاهش تصادفات</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="animate-slide-up-delay-7">
            <div className="mt-16 text-center">
              <p className="text-gray-400 text-sm">
                © ۱۴۰۴ - سیستم تحلیل تصادفات ترافیکی ایران | برای جاده‌های ایمن‌تر
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Static decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-2 h-2 bg-red-400/40 rounded-full"></div>
        <div className="absolute top-32 left-20 w-1 h-1 bg-orange-400/40 rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-2 h-2 bg-yellow-400/40 rounded-full"></div>
        <div className="absolute bottom-40 left-16 w-1 h-1 bg-red-400/40 rounded-full"></div>
        <div className="absolute top-48 right-64 w-1 h-1 bg-orange-400/40 rounded-full"></div>
      </div>
    </div>
  );
}
