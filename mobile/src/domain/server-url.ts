export const SERVER_URL_SETTING_KEY = 'lesen.server-url.v1';
export const SERVER_ENDPOINT_SUFFIX = '/lesan';

const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;

export type ServerUrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function invalidAddress(): ServerUrlValidationResult {
  return { ok: false, error: 'آدرس سرور معتبر نیست؛ نمونه: http://46.245.98.207:1400' };
}

export function normalizeServerUrl(raw: string): ServerUrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'آدرس سرور را وارد کنید.' };
  }
  if (/\s/.test(trimmed)) {
    return { ok: false, error: 'آدرس سرور نباید شامل فاصله باشد.' };
  }
  if (/[^\x20-\x7E]/.test(trimmed)) {
    return { ok: false, error: 'آدرس سرور باید فقط با نویسه‌های لاتین وارد شود.' };
  }

  const withScheme = SCHEME_PATTERN.test(trimmed) ? trimmed : `http://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return invalidAddress();
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'فقط پروتکل http یا https پشتیبانی می‌شود.' };
  }
  if (!parsed.hostname || parsed.search || parsed.hash) {
    return invalidAddress();
  }

  const base = withScheme.replace(/\/+$/, '');
  const path = parsed.pathname.replace(/\/+$/, '');
  if (path && path !== SERVER_ENDPOINT_SUFFIX) {
    return {
      ok: false,
      error: `مسیر سرویس فقط ${SERVER_ENDPOINT_SUFFIX} است؛ نمونه: http://host:1400${SERVER_ENDPOINT_SUFFIX}`,
    };
  }
  const url = base.endsWith(SERVER_ENDPOINT_SUFFIX) ? base : `${base}${SERVER_ENDPOINT_SUFFIX}`;
  return { ok: true, url };
}

export function resolveEffectiveServerUrl(savedUrl: string | null, defaultUrl: string): string {
  return savedUrl && savedUrl.trim().length > 0 ? savedUrl : defaultUrl;
}

export type ServerProbeResult = { reachable: boolean; message: string };

/**
 * Best-effort reachability probe against the given /lesan endpoint. It posts a
 * deliberately empty `user.login` (fails server validation before it can touch
 * any account) and treats any parsed `{ success }` envelope as proof that the
 * address points at a LESEN backend. This is intentionally a raw connectivity
 * probe, not a typed act call.
 */
export async function probeServerEndpoint(url: string, timeoutMs = 8000): Promise<ServerProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        service: 'main',
        model: 'user',
        act: 'login',
        details: { set: { email: '', password: '' }, get: { token: 1 } },
      }),
    });
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        reachable: false,
        message: 'به این آدرس سرویس لسن پاسخ نمی‌دهد؛ مسیر /lesan را بررسی کنید.',
      };
    }
    if (!payload || typeof payload !== 'object' || !('success' in payload)) {
      return {
        reachable: false,
        message: 'به این آدرس سرویس لسن پاسخ نمی‌دهد؛ مسیر /lesan را بررسی کنید.',
      };
    }
    return { reachable: true, message: 'ارتباط با سرور برقرار است.' };
  } catch {
    return {
      reachable: false,
      message: 'برقراری ارتباط با سرور ممکن نشد؛ آدرس و اتصال اینترنت را بررسی کنید.',
    };
  } finally {
    clearTimeout(timer);
  }
}
