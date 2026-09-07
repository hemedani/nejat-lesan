export function unwrapApiResponse<T>(response: unknown): T {
  const value = response as { success?: boolean; body?: T & { message?: string } };
  if (!value?.success) throw new Error(value?.body?.message || "خطا در دریافت اطلاعات");
  return value.body as T;
}

export function getPatrolErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("ماژول")) return "این بخش برای این نصب/سازمان فعال نیست.";
  if (message.includes("اجازه") || message.includes("داشبورد")) return "شما به این بخش دسترسی ندارید.";
  if (message.includes("یافت نشد")) return "گزارش یافت نشد یا دسترسی ندارید.";
  if (message.includes("همگام")) return "گزارش باید ابتدا با موفقیت همگام‌سازی شود.";
  if (message.includes("دلیل")) return "برای برگشت گزارش، ثبت دلیل الزامی است.";
  if (message.includes("تغییر وضعیت")) return "وضعیت گزارش تغییر کرده است. اطلاعات را تازه‌سازی کنید.";
  return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
}
