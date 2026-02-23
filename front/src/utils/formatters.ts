/**
 * Formats a file size in bytes to human-readable format (B, KB, MB)
 * @param bytes - File size in bytes
 * @returns Formatted file size with appropriate unit
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " بایت";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " کیلوبایت";
  const mb = kb / 1024;
  return mb.toFixed(1) + " مگابایت";
};

/**
 * Formats a date to Persian (Jalali) calendar format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in Persian format
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Formats a number with Persian digits
 * @param num - Number to format
 * @returns Formatted number with Persian digits
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("fa-IR");
};

/**
 * Formats a date to Persian (Jalali) calendar format with time
 * @param date - Date object
 * @returns Formatted date string in Persian format with time (e.g., "یکشنبه ۱۴ آبان ۱۴۰۳ - ۱۵:۳۰:۴۵")
 */
export const formatJalaliDateTime = (date: Date): string => {
  try {
    const dayName = date.toLocaleDateString("fa-IR", { weekday: "long" });
    const dateString = date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeString = date.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `${dayName} ${dateString} - ${timeString}`;
  } catch {
    return "";
  }
};
