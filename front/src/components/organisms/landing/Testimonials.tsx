import React from "react";

const testimonials = [
  {
    id: 1,
    content:
      "سرعت پردازش داده‌ها در سامانه مرصاد بی‌نظیر است. به لطف معماری قدرتمند فریم‌ورک لسان (Lesan)، گزارش‌گیری و تحلیل میلیون‌ها رکورد تصادف در کسری از ثانیه و بدون هیچ‌گونه افت عملکردی انجام می‌شود.",
    author: "سرهنگ محمدی",
    role: "رئیس پلیس راهور استان",
    avatarColor: "bg-blue-500",
    initials: "س.م",
  },
  {
    id: 2,
    content:
      "پایداری و دقت سیستم در تحلیل‌های پیچیده مکانی به ما کمک کرد تا نقاط حادثه‌خیز را با خطای صفر شناسایی کنیم. مرصاد با رابط کاربری زیبا و عملکرد بی‌نقص خود، یک تحول بزرگ در مدیریت ترافیک ایجاد کرده است.",
    author: "مهندس رضایی",
    role: "مدیر مرکز کنترل ترافیک",
    avatarColor: "bg-cyan-500",
    initials: "م.ر",
  },
  {
    id: 3,
    content:
      "یکپارچگی داده‌ها و داشبوردهای روان، تصمیم‌گیری را برای مدیران ارشد بسیار ساده کرده است. پایداری و سرعت پاسخگویی فریم‌ورک لسان در بک‌اند سامانه، حتی در ساعات اوج ترافیک داده، واقعاً جای تحسین دارد.",
    author: "دکتر احمدی",
    role: "معاون حمل و نقل و ترافیک",
    avatarColor: "bg-indigo-500",
    initials: "د.ا",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 min-h-screen flex flex-col justify-center bg-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            اعتماد سازمان‌ها به{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              قدرت و پایداری مرصاد
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            نظرات مدیران و متخصصانی که روزانه برای حفظ ایمنی راه‌ها و تحلیل داده‌های کلان ترافیکی به
            سامانه مرصاد تکیه می‌کنند.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative p-8 rounded-3xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-2xl flex flex-col h-full"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-blue-500/20 group-hover:text-blue-500/30 transition-colors duration-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-12 h-12"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10 flex-grow mb-8 pt-4">
                <p className="text-slate-300 leading-loose text-justify">{testimonial.content}</p>
              </div>

              {/* Author Info */}
              <div className="relative z-10 flex items-center gap-4 pt-6 border-t border-white/10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${testimonial.avatarColor}`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base">{testimonial.author}</h4>
                  <p className="text-slate-400 text-sm mt-1">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
