import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { coverageFromZooms, isOfflineReadyAt, tileZoomFor } from '@/domain/map-coverage';

/**
 * The generated map document is a plain string of JS, so it cannot import
 * `tileZoomFor`. That makes the clamp a hand-copied second implementation and
 * the most likely place for the offline bug to come back.
 *
 * These tests read the real document body out of `buildMapHtml` and evaluate its
 * `baseZoom()` against a mock `state`, so the shipped HTML — not a paraphrase of
 * it — is what gets asserted.
 */

const html = readMapHtml();

/**
 * The document source is read as text rather than imported: the module pulls in
 * `expo-file-system`, which has no Node implementation.
 */
function readSource(): string {
  return readFileSync(
    fileURLToPath(new URL('../services/map-web-html.ts', import.meta.url)),
    'utf8',
  );
}

function readMapHtml(): string {
  const match = readSource().match(/function buildMapHtml[\s\S]*?\n}\n/);
  if (!match) {
    throw new Error('buildMapHtml not found in map-web-html.ts');
  }
  return match[0];
}

/** Evaluates the document's own `baseZoom()` against a mock state. */
function baseZoomFor(
  zoom: number,
  coverage: { zoomMin: number; zoomMax: number } | null,
  offline = false,
): number {
  const body = html.match(/function baseZoom\(\) \{[\s\S]*?\n  \}/)?.[0];
  if (!body) {
    throw new Error('baseZoom() not found in the generated document');
  }
  const coverageLiteral = coverage
    ? `({ zoomMin: ${coverage.zoomMin}, zoomMax: ${coverage.zoomMax} })`
    : 'null';
  const evaluate = new Function(
    'coverage',
    `var MAX_ZOOM = 19;
     var state = { zoom: ${zoom}, coverage: coverage, offline: ${offline} };
     ${body}
     return baseZoom();`,
  );
  return evaluate(coverage) as number;
}

/** Evaluates the document's own `isOfflineReady()` against a mock state. */
function isOfflineReadyFor(
  zoom: number,
  coverage: { zoomMin: number; zoomMax: number } | null,
): boolean {
  const body = html.match(/function isOfflineReady\(zoom\) \{[\s\S]*?\n  \}/)?.[0];
  if (!body) {
    throw new Error('isOfflineReady() not found in the generated document');
  }
  const coverageLiteral = coverage
    ? `({ zoomMin: ${coverage.zoomMin}, zoomMax: ${coverage.zoomMax} })`
    : 'null';
  const evaluate = new Function(
    'coverage',
    `var state = { coverage: coverage };
     ${body}
     return isOfflineReady(${zoom});`,
  );
  return evaluate(coverage) as boolean;
}

/**
 * Runs the document's real `emitMoveEnd()` and reads back the `covered` flag it
 * puts on the bridge, so the assertion is about the shipped payload rather than
 * about a helper that may or may not be the one being called.
 */
function moveEndCovered(
  zoom: number,
  coverage: { zoomMin: number; zoomMax: number } | null,
): boolean | undefined {
  const body = html.match(/function emitMoveEnd\(\) \{[\s\S]*?\n  \}/)?.[0];
  const ready = html.match(/function isOfflineReady\(zoom\) \{[\s\S]*?\n  \}/)?.[0];
  const base = html.match(/function baseZoom\(\) \{[\s\S]*?\n  \}/)?.[0];
  if (!body || !ready || !base) {
    throw new Error('emitMoveEnd/isOfflineReady/baseZoom not found in the generated document');
  }
  const coverageLiteral = coverage
    ? `({ zoomMin: ${coverage.zoomMin}, zoomMax: ${coverage.zoomMax} })`
    : 'null';
  let sent: string | null = null;
  const evaluate = new Function(
    'coverage',
    `var MAX_ZOOM = 19;
     var state = { zoom: ${zoom}, coverage: coverage, offline: true,
                   lat: 31.3, lng: 48.6 };
     var captured = null;
     var window = { ReactNativeWebView: { postMessage: function (m) { captured = m; } } };
     ${ready}
     ${base}
     ${body}
     emitMoveEnd();
     return captured;`,
  );
  sent = evaluate(coverage) as string | null;
  return sent ? (JSON.parse(sent).covered as boolean | undefined) : undefined;
}

describe('generated map document — coverage clamping', () => {
  it('reproduces tileZoomFor exactly for every case the domain module covers', () => {
    const cases: { zoom: number; coverage: { zoomMin: number; zoomMax: number } | null }[] = [
      { coverage: null, zoom: 17 },
      { coverage: null, zoom: 3 },
      { coverage: coverageFromZooms(4, 12), zoom: 17 },
      { coverage: coverageFromZooms(4, 12), zoom: 15 },
      { coverage: coverageFromZooms(4, 12), zoom: 19 },
      { coverage: coverageFromZooms(4, 17), zoom: 17 },
      { coverage: coverageFromZooms(4, 17), zoom: 12.7 },
      { coverage: coverageFromZooms(14, 17), zoom: 9 },
      { coverage: coverageFromZooms(14, 17), zoom: 17 },
    ];
    for (const { zoom, coverage } of cases) {
      // Offline: the clamp applies.
      expect(baseZoomFor(zoom, coverage, true)).toBe(tileZoomFor(zoom, coverage, { offline: true }));
      // Online: the clamp must NOT apply, or a working map renders blurred.
      expect(baseZoomFor(zoom, coverage, false)).toBe(tileZoomFor(zoom, coverage, { offline: false }));
    }
  });

  it('never asks for a tile level the offline cache does not hold, while offline', () => {
    // The original defect, stated as a guard: the picker opens at z17 while a
    // base pack stops at z12, so the document used to request z17, every
    // file:// load failed, and the map rendered its bare background.
    const coverage = coverageFromZooms(4, 12);
    expect(baseZoomFor(17, coverage, true)).toBeLessThanOrEqual(12);
  });

  it('requests the full zoom while online, so the network can serve it', () => {
    // Regression guard: clamping unconditionally scaled the z4..z10 pack up to
    // the z17 the officer was viewing, producing a blur on a working network.
    const coverage = coverageFromZooms(4, 10);
    expect(baseZoomFor(17, coverage, false)).toBe(17);
    expect(baseZoomFor(15, coverage, false)).toBe(15);
  });

  it('reports offline readiness from the requested zoom, not the clamped one', () => {
    const coverage = coverageFromZooms(4, 10);
    expect(isOfflineReadyFor(17, coverage)).toBe(isOfflineReadyAt(coverage, 17));
    expect(isOfflineReadyFor(10, coverage)).toBe(isOfflineReadyAt(coverage, 10));
    expect(isOfflineReadyFor(17, null)).toBe(isOfflineReadyAt(null, 17));
  });

  it('actually sends that value in the moveend payload', () => {
    // Evaluating isOfflineReady() on its own proves nothing about what the
    // bridge emits: the original bug was emitMoveEnd comparing the *clamped*
    // tile level to the clamp bound, a tautology that is true at every zoom.
    const cases: { zoom: number; coverage: { zoomMin: number; zoomMax: number } | null }[] = [
      { coverage: coverageFromZooms(4, 10), zoom: 17 },
      { coverage: coverageFromZooms(4, 10), zoom: 10 },
      { coverage: coverageFromZooms(4, 17), zoom: 17 },
      { coverage: null, zoom: 17 },
    ];
    for (const { zoom, coverage } of cases) {
      expect(moveEndCovered(zoom, coverage)).toBe(isOfflineReadyAt(coverage, zoom));
    }
  });

  it('never claims offline readiness above the downloaded depth', () => {
    // The exact complaint from the device: z17 with a z4..z10 pack reported
    // "آفلاین آماده" even though nothing at z17 was on disk.
    expect(moveEndCovered(17, coverageFromZooms(4, 10))).toBe(false);
    expect(moveEndCovered(15, coverageFromZooms(4, 10))).toBe(false);
  });

  it('accepts an online flag over the bridge', () => {
    expect(html).toContain("data.type === 'online'");
    expect(html).toContain('state.offline');
  });
});

describe('generated map document — tile styling', () => {
  it('styles a tile before it loads, so a miss is never a bare page', () => {
    expect(html).toContain('#layer .tile');
    expect(html).toContain('#layer .tile.loading');
    expect(html).toContain('repeating-linear-gradient');
  });

  it('accepts a coverage message over the bridge', () => {
    expect(html).toContain("data.type === 'coverage'");
    expect(html).toContain('state.coverage');
  });

  it('clears the loading state once a tile resolves', () => {
    expect(html).toContain('img.onload');
    expect(html).toContain('img.onerror');
  });
});

describe('generated map document — version', () => {
  it('bumped to 4 so an existing device cannot keep running the broken tile logic', () => {
    const version = readSource().match(/HTML_FILE_VERSION = (\d+)/)?.[1];
    // The document is written once and never rewritten, so a stale file on the
    // device is the failure mode this constant exists to prevent. v5 added the
    // online gate that stopped coverage from blurring the online map.
    expect(Number(version)).toBeGreaterThanOrEqual(5);
  });
});