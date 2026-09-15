export function unwrapApiResponse<T>(response: unknown): T {
  const value = response as { success?: boolean; body?: T & { message?: string } };
  if (!value?.success) throw new Error(value?.body?.message || "خطا در دریافت اطلاعات");
  return value.body as T;
}

/**
 * Lesan `get` actions resolve to a one-element array (`aggregation().toArray()`),
 * while the UI consumes a single record (mirrors the `getUser` action which
 * already returns the item directly). Normalize the raw response body to its
 * first item, preserving `success` and error payloads untouched.
 */
export function asSingleItemResponse(response: unknown): unknown {
  const value = response as { success?: boolean; body?: unknown };
  if (value?.success && Array.isArray(value.body)) {
    return { ...value, body: value.body[0] ?? null };
  }
  return response;
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
