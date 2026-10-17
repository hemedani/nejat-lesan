import { describe, expect, it } from 'vitest';

import type { RoadLabel } from './org-road';
import { roadLabelFeature, roadLabelText, roadLineGeoJSON } from './road-overlay';

const LINE_A: [number, number][] = [
  [48.6, 31.3],
  [48.7, 31.32],
  [48.8, 31.34],
];

describe('road overlay geometry', () => {
  it('keeps coordinates in [lng, lat] order', () => {
    const collection = roadLineGeoJSON([LINE_A]);
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.coordinates[0]).toEqual([48.6, 31.3]);
  });

  it('drops lines too short to draw', () => {
    const collection = roadLineGeoJSON([[[48.6, 31.3]], []]);
    expect(collection.features).toHaveLength(0);
  });

  it('produces one feature per drawable line', () => {
    const collection = roadLineGeoJSON([LINE_A, LINE_A]);
    expect(collection.features).toHaveLength(2);
    expect(collection.features.every(f => f.geometry.type === 'LineString')).toBe(true);
  });
});

describe('road overlay label', () => {
  it('joins the name with the endpoints and length on a second line', () => {
    const label: RoadLabel = {
      name: 'بزرگراه شهید',
      origin: 'اهواز',
      destination: 'اندیمشک',
      totalLengthMeters: 116_000,
    };
    const text = roadLabelText(label);
    expect(text.startsWith('بزرگراه شهید\n')).toBe(true);
    expect(text).toContain('اهواز ← اندیمشک');
    expect(text).toContain('کیلومتر');
  });

  it('omits the arrow line when only one end is known', () => {
    expect(roadLabelText({ name: 'راه', origin: 'اهواز' })).toBe('راه');
  });

  it('writes the name alone when there is no detail', () => {
    expect(roadLabelText({ name: 'راه اصلی' })).toBe('راه اصلی');
  });

  it('returns no feature for a road with no name', () => {
    expect(roadLabelFeature([LINE_A], { name: '' })).toBeNull();
    expect(roadLabelFeature([LINE_A], null)).toBeNull();
  });

  it('places the label at the middle of the longest line', () => {
    const feature = roadLabelFeature([LINE_A], { name: 'راه' });
    expect(feature?.geometry.coordinates).toEqual([48.7, 31.32]);
    expect(feature?.properties?.title).toBe('راه');
  });
});
