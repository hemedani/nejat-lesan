export type ApiErrorCode =
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'server'
  | 'invalid_response'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBackendMessage(details: unknown): string | null {
  if (!details || typeof details !== 'object' || !('message' in details)) {
    return null;
  }
  const message = details.message;
  return typeof message === 'string' && message.length > 0 ? message : null;
}

export function translateApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const backendMessage = getBackendMessage(error.details);
    if (backendMessage && (error.code === 'validation' || error.code === 'invalid_response')) {
      return backendMessage;
    }
    const messages: Record<ApiErrorCode, string> = {
      offline: 'اتصال اینترنت برقرار نیست. اطلاعات شما پس از اتصال همگام می‌شود.',
      timeout: 'پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.',
      unauthorized: 'نشست شما منقضی شده است. دوباره وارد شوید.',
      forbidden: 'شما مجوز انجام این عملیات را ندارید.',
      validation: 'اطلاعات واردشده را بررسی کنید.',
      server: 'ارتباط با سرور با مشکل روبه‌رو شد.',
      invalid_response: 'پاسخ سرور قابل شناسایی نیست.',
      unknown: 'خطای پیش‌بینی‌نشده‌ای رخ داد.',
    };
    return messages[error.code];
  }
  return 'خطای پیش‌بینی‌نشده‌ای رخ داد.';
}