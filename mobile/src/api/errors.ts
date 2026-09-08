export type ApiErrorCode =
  | 'offline'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'server'
  | 'invalid_response'
  | 'unknown';

const BACKEND_MESSAGES = {
  invalidCredentials: 'ایمیل یا رمز عبور صحیح نیست',
  inactiveAccount: 'حساب کاربری غیرفعال است',
  patrolAccess: 'این حساب اجازه استفاده از اپ مأمور گشت را ندارد',
  revokedDevice: 'نشست این دستگاه باطل شده است',
  noActiveShift: 'شیفت فعالی یافت نشد',
  moduleDisabledInstall: 'این ماژول برای این نصب فعال نیست',
  moduleDisabledOrg: 'این ماژول برای این سازمان فعال نیست',
  orgMembershipNotFound: 'سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید',
} as const;

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
    if (backendMessage === BACKEND_MESSAGES.invalidCredentials) {
      return 'ایمیل یا رمز عبور صحیح نیست.';
    }
    if (backendMessage === BACKEND_MESSAGES.inactiveAccount) {
      return 'حساب کاربری غیرفعال است.';
    }
    if (backendMessage === BACKEND_MESSAGES.patrolAccess) {
      return 'این حساب اجازه استفاده از اپ مأمور گشت را ندارد.';
    }
    if (backendMessage === BACKEND_MESSAGES.revokedDevice) {
      return 'نشست این دستگاه باطل شده است.';
    }
    if (backendMessage === BACKEND_MESSAGES.noActiveShift) {
      return 'در حال حاضر شیفت فعالی ندارید.';
    }
    if (
      backendMessage === BACKEND_MESSAGES.moduleDisabledInstall ||
      backendMessage === BACKEND_MESSAGES.moduleDisabledOrg ||
      backendMessage === BACKEND_MESSAGES.orgMembershipNotFound
    ) {
      // Module-licensing and org-membership messages are user-facing Persian
      // already; surface them verbatim (backend-v2 brief) — never fabricate.
      return backendMessage;
    }
    if (backendMessage && (error.code === 'validation' || error.code === 'invalid_response')) {
      return backendMessage;
    }
    const messages: Record<ApiErrorCode, string> = {
      offline: 'اتصال اینترنت برقرار نیست. اطلاعات شما پس از اتصال همگام می‌شود.',
      timeout: 'پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.',
      cancelled: 'ارتباط با سرور قطع شد. دوباره تلاش کنید.',
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