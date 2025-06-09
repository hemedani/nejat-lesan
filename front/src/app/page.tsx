export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50 p-8 font-[family-name:var(--font-geist-sans)] selection:bg-sky-500 selection:text-white">
      <main className="flex flex-col items-center text-center gap-8 py-12 px-6 bg-slate-800/30 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl">
        {/* آیکون SVG سفارشی برای نمودار */}
        <div className="p-3">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-sky-400"
          >
            <path
              d="M3 20V10C3 9.44772 3.44772 9 4 9H6C6.55228 9 7 9.44772 7 10V20C7 20.5523 6.55228 21 6 21H4C3.44772 21 3 20.5523 3 20Z"
              className="fill-sky-500/70"
            />
            <path
              d="M10 20V4C10 3.44772 10.4477 3 11 3H13C13.5523 3 14 3.44772 14 4V20C14 20.5523 13.5523 21 13 21H11C10.4477 21 10 20.5523 10 20Z"
              className="fill-sky-400"
            />
            <path
              d="M17 20V14C17 13.4477 17.4477 13 18 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H18C17.4477 21 17 20.5523 17 20Z"
              className="fill-sky-500/70"
            />
            <path
              d="M2.5 19.5H21.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-sky-300/50"
            />
          </svg>
        </div>

        {/* عنوان اصلی */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
          پروژه تحلیل تصادفات ایران
        </h1>

        {/* پیام "به زودی" */}
        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
          به زودی در این صفحه، نمودارها و داده‌های تحلیلی دقیقی از تصادفات ایران به نمایش درخواهند آمد.
        </p>
        <p className="text-md text-slate-400">
          ما در حال کار بر روی جمع‌آوری و پردازش داده‌ها هستیم تا بهترین تجربه بصری و تحلیلی را برای شما فراهم کنیم.
        </p>

        {/* یک جداکننده ظریف */}
        <hr className="w-1/3 border-slate-700 my-4" />

        <p className="text-sm text-slate-500">
          از صبر و شکیبایی شما سپاسگزاریم.
        </p>
      </main>

      {/* فوتر ساده */}
      <footer className="absolute bottom-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} پروژه تحلیل تصادفات ایران. تمامی حقوق محفوظ است.</p>
      </footer>
    </div>
  );
}
