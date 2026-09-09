import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  normalizeServerUrl,
  probeServerEndpoint,
  resolveEffectiveServerUrl,
} from './server-url';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('normalizeServerUrl', () => {
  it('appends /lesan to a bare http URL', () => {
    expect(normalizeServerUrl('http://46.245.98.207:1400')).toEqual({
      ok: true,
      url: 'http://46.245.98.207:1400/lesan',
    });
  });

  it('prepends http:// when the scheme is missing', () => {
    expect(normalizeServerUrl('46.245.98.207:1400')).toEqual({
      ok: true,
      url: 'http://46.245.98.207:1400/lesan',
    });
  });

  it('keeps an existing /lesan suffix', () => {
    expect(normalizeServerUrl('http://10.0.2.2:1404/lesan')).toEqual({
      ok: true,
      url: 'http://10.0.2.2:1404/lesan',
    });
  });

  it('strips trailing slashes and surrounding whitespace', () => {
    expect(normalizeServerUrl('  https://10.0.2.2:1404/lesan/  ')).toEqual({
      ok: true,
      url: 'https://10.0.2.2:1404/lesan',
    });
  });

  it('accepts a scheme-less host without a port', () => {
    expect(normalizeServerUrl('lesan.example')).toEqual({
      ok: true,
      url: 'http://lesan.example/lesan',
    });
  });

  it('rejects an empty value', () => {
    const result = normalizeServerUrl('');
    expect(result.ok).toBe(false);
  });

  it('rejects values containing whitespace', () => {
    const result = normalizeServerUrl('http://host:1400 /lesan');
    expect(result.ok).toBe(false);
  });

  it('rejects non-ASCII (Persian) input', () => {
    const result = normalizeServerUrl('آدرس سرور');
    expect(result.ok).toBe(false);
  });

  it('rejects unsupported schemes', () => {
    const result = normalizeServerUrl('ftp://host:1400');
    expect(result.ok).toBe(false);
  });

  it('rejects a missing host', () => {
    const result = normalizeServerUrl('http://');
    expect(result.ok).toBe(false);
  });

  it('rejects a path other than /lesan', () => {
    const result = normalizeServerUrl('http://host:1400/api');
    expect(result.ok).toBe(false);
  });
});

describe('resolveEffectiveServerUrl', () => {
  it('prefers the saved override', () => {
    expect(resolveEffectiveServerUrl('http://a:1/lesan', 'http://b:2/lesan')).toBe('http://a:1/lesan');
  });

  it('falls back to the default when saved is null', () => {
    expect(resolveEffectiveServerUrl(null, 'http://b:2/lesan')).toBe('http://b:2/lesan');
  });

  it('falls back to the default when saved is blank', () => {
    expect(resolveEffectiveServerUrl('   ', 'http://b:2/lesan')).toBe('http://b:2/lesan');
  });
});

describe('probeServerEndpoint', () => {
  it('reports reachable for a LESEN-style success envelope', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ success: false })));
    const result = await probeServerEndpoint('http://host:1400/lesan', 1000);
    expect(result.reachable).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://host:1400/lesan',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reports unreachable when the response is not JSON', async () => {
    globalThis.fetch = vi.fn(async () => new Response('<html>not a lesan server</html>'));
    const result = await probeServerEndpoint('http://host:1400/lesan', 1000);
    expect(result.reachable).toBe(false);
  });

  it('reports unreachable on a network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    });
    const result = await probeServerEndpoint('http://host:1400/lesan', 1000);
    expect(result.reachable).toBe(false);
  });
});
