import { describe, expect, it } from 'vitest';

import { projectPointToMultiLine } from './road-projection';

/**
 * These fixtures are chosen so the expected numbers fall out of the backend's
 * equirectangular method by hand: at the equator one degree of longitude is
 * `111320` m and one degree of latitude is `110574` m, so a segment from
 * `(0,0)` to `(0.001,0)` is 111.32 m long.
 */
describe('projectPointToMultiLine', () => {
  it('projects a point onto the middle of a segment', () => {
    const projection = projectPointToMultiLine([[ [0, 0], [0.001, 0] ]], [0.0005, 0.001]);

    expect(projection.nearest[0]).toBeCloseTo(0.0005, 9);
    expect(projection.nearest[1]).toBeCloseTo(0, 9);
    expect(projection.alongMeters).toBeCloseTo(55.66, 1);
    expect(projection.perpMeters).toBeCloseTo(110.574, 1);
    expect(projection.totalLengthMeters).toBeCloseTo(111.32, 1);
  });

  it('clamps a point past the end to the line end', () => {
    const projection = projectPointToMultiLine([[ [0, 0], [0.001, 0] ]], [0.002, 0]);

    expect(projection.nearest[0]).toBeCloseTo(0.001, 9);
    expect(projection.alongMeters).toBeCloseTo(111.32, 1);
    expect(projection.perpMeters).toBeCloseTo(111.32, 1);
  });

  it('keeps the nearest line and sums every line into the total length', () => {
    const far = [[0, 0], [0.001, 0]] as [number, number][];
    const near = [[0.0005, 0.001], [0.0015, 0.001]] as [number, number][];

    const projection = projectPointToMultiLine([far, near], [0.0005, 0.001]);

    // The point sits exactly on the second line's start, so the perpendicular
    // distance is zero and the near line wins regardless of the far one.
    expect(projection.nearest).toEqual([0.0005, 0.001]);
    expect(projection.perpMeters).toBeCloseTo(0, 6);
    expect(projection.totalLengthMeters).toBeCloseTo(222.64, 1);
  });

  it('orders `alongMeters` from the start of the whole multi-line', () => {
    // The second line's projection must be offset by the first line's length, or
    // a road split into segments would report a kilometre from the wrong origin.
    const first = [[0, 0], [0.001, 0]] as [number, number][];
    const second = [[0.001, 0], [0.002, 0]] as [number, number][];

    const projection = projectPointToMultiLine([first, second], [0.0015, 0]);

    expect(projection.nearest[0]).toBeCloseTo(0.0015, 9);
    expect(projection.alongMeters).toBeCloseTo(111.32 + 55.66, 1);
  });

  it('returns the point itself when there is no geometry to project onto', () => {
    const projection = projectPointToMultiLine([], [0.0005, 0.001]);

    expect(projection.nearest).toEqual([0.0005, 0.001]);
    expect(projection.perpMeters).toBe(Infinity);
    expect(projection.totalLengthMeters).toBe(0);
  });
});
