import { describe, expect, it } from 'vitest';

import {
  coverageFromZooms,
  isOfflineReadyAt,
  tileZoomFor,
} from './map-coverage';

/**
 * Regression guard for a defect this module itself introduced: coverage was
 * applied to *every* tile request, not just offline ones, so an officer with a
 * network connection saw the z4–10 pack blown up to 128x and reported a blurred
 * map at z17 while online.
 */
describe('tileZoomFor — online must never be clamped', () => {
  const base = coverageFromZooms(4, 10);

  it('requests the full zoom when the network can serve it', () => {
    expect(tileZoomFor(17, base, { offline: false })).toBe(17);
    expect(tileZoomFor(15, base, { offline: false })).toBe(15);
    expect(tileZoomFor(19, base, { offline: false })).toBe(19);
  });

  it('still clamps when the network cannot be relied on', () => {
    expect(tileZoomFor(17, base, { offline: true })).toBe(10);
    expect(tileZoomFor(15, base, { offline: true })).toBe(10);
  });

  it('defaults to online, because that is the state a fresh install is in', () => {
    expect(tileZoomFor(17, base)).toBe(17);
  });

  it('is unaffected by coverage while online, including a null coverage', () => {
    expect(tileZoomFor(17, null, { offline: false })).toBe(17);
    expect(tileZoomFor(17, null, { offline: true })).toBe(17);
  });

  it('does not clamp a zoom the coverage does cover', () => {
    const deep = coverageFromZooms(4, 17);
    expect(tileZoomFor(15, deep, { offline: false })).toBe(15);
    expect(tileZoomFor(15, deep, { offline: true })).toBe(15);
  });
});

describe('isOfflineReadyAt — the badge must stop lying', () => {
  it('is false above the downloaded depth, even though the map is displaying something', () => {
    // The clamp means tiles are *drawn* at z10 while the officer is at z17.
    // Reporting "covered" there is exactly the lie the user reported.
    const base = coverageFromZooms(4, 10);
    expect(isOfflineReadyAt(base, 17)).toBe(false);
    expect(isOfflineReadyAt(base, 15)).toBe(false);
    expect(isOfflineReadyAt(base, 10)).toBe(true);
    expect(isOfflineReadyAt(base, 7.4)).toBe(true);
  });

  it('is false when nothing is downloaded', () => {
    expect(isOfflineReadyAt(null, 10)).toBe(false);
  });

  it('is true only inside the range, not merely under the ceiling', () => {
    const area = coverageFromZooms(13, 17);
    expect(isOfflineReadyAt(area, 9)).toBe(false);
    expect(isOfflineReadyAt(area, 17)).toBe(true);
    expect(isOfflineReadyAt(area, 18)).toBe(false);
  });
});