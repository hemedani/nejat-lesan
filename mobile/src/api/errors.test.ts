import { describe, expect, it } from 'vitest';

import { ApiError, translateApiError } from './errors';

describe('translateApiError', () => {
  it('translates every known error code to Persian', () => {
    const codes = [
      'offline',
      'timeout',
      'cancelled',
      'unauthorized',
      'forbidden',
      'validation',
      'server',
      'invalid_response',
      'unknown',
    ] as const;
    for (const code of codes) {
      const message = translateApiError(new ApiError('raw', code));
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toBe('raw');
    }
  });

  it('maps exact backend messages to friendly Persian text', () => {
    expect(
      translateApiError(
        new ApiError('raw', 'validation', undefined, { message: 'ایمیل یا رمز عبور صحیح نیست' }),
      ),
    ).toBe('ایمیل یا رمز عبور صحیح نیست.');
    expect(
      translateApiError(
        new ApiError('raw', 'validation', undefined, {
          message: 'نشست این دستگاه باطل شده است',
        }),
      ),
    ).toBe('نشست این دستگاه باطل شده است.');
  });

  it('passes through other backend messages for validation failures without leaking details objects', () => {
    const message = translateApiError(
      new ApiError('raw', 'validation', undefined, { message: 'شما فقط به گزارش‌های خودتان می‌توانید فایل اضافه کنید' }),
    );
    expect(message).toContain('گزارش‌های خودتان');
  });

  it('falls back to a category message when no backend message exists', () => {
    expect(translateApiError(new ApiError('raw', 'timeout'))).not.toContain('raw');
    expect(translateApiError(new Error('socket hang up'))).toBeTruthy();
  });
});
