"use client";

/**
 * راه‌اندازی یک‌باره‌ی Leaflet.
 *
 * دو چیز اینجا جمع شده که قبلاً در هر فرم جدا تکرار می‌شد:
 *
 * 1. **رفع باگ آیکن پیش‌فرض.** بدون `delete _getIconUrl` هر `<Marker>` خام
 *    اسپرایتِ شکسته نشان می‌دهد، چون آدرسش نسبت به خروجیِ باندلر حساب می‌شود
 *    و ۴۰۴ می‌دهد.
 *
 * 2. **CSS.** عملاً دیگر لازم نیست: `globals.css` از قبل
 *    `@import "leaflet/dist/leaflet.css"` دارد. تزریقِ `<link>` در هر فرم هم
 *    تکراری بود و هم هنگام unmount کل CSS را از `<head>` می‌کند — از جمله
 *    وقتی فرم دیگری در همان صفحه هنوز به آن نیاز دارد.
 */

let iconFixPromise: Promise<void> | null = null;

/** ایمن برای صدا زدن چندباره: کارِ واقعی فقط بار اول انجام می‌شود. */
export const ensureLeafletIcons = (): Promise<void> => {
  if (iconFixPromise) return iconFixPromise;

  iconFixPromise = import("leaflet").then((L) => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  });

  return iconFixPromise;
};
