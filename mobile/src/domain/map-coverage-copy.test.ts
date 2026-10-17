import { describe, expect, it } from 'vitest';

import { coverageFromZooms } from './map-coverage';
import { coverageBadgeCopy } from './map-coverage-copy';

const base = coverageFromZooms(4, 10);
const deep = coverageFromZooms(4, 17);

describe('coverage badge copy', () => {
  it('does not claim offline readiness while online at an uncovered zoom', () => {
    // The device complaint: online, z17, z4..z10 pack -> "آفلاین آماده: تا بزرگنمایی ۱۰".
    const copy = coverageBadgeCopy({ coverage: base, covered: false, offline: false });
    expect(copy.tone).not.toBe('success');
    expect(copy.label).not.toContain('آفلاین آماده');
    expect(copy.label).toMatch(/آنلاین/);
  });

  it('still names the depth an officer would get offline while online', () => {
    const copy = coverageBadgeCopy({ coverage: base, covered: false, offline: false });
    expect(copy.label).toContain('۱۰');
  });

  it('confirms readiness when offline at a covered zoom', () => {
    const copy = coverageBadgeCopy({ coverage: deep, covered: true, offline: true });
    expect(copy.tone).toBe('success');
    expect(copy.label).toMatch(/آفلاین آماده/);
    expect(copy.label).toContain('۱۷');
  });

  it('warns when offline above the downloaded depth', () => {
    const copy = coverageBadgeCopy({ coverage: base, covered: false, offline: true });
    expect(copy.tone).toBe('warning');
    expect(copy.label).toMatch(/پوشش آفلاین/);
  });

  it('says plainly that nothing is downloaded', () => {
    const copy = coverageBadgeCopy({ coverage: null, covered: false, offline: false });
    expect(copy.tone).toBe('info');
    expect(copy.label).toMatch(/آماده نیست/);
  });

  it('renders every depth in Persian numerals', () => {
    for (const coverage of [coverageFromZooms(4, 10), deep, coverageFromZooms(4, 19)]) {
      const copy = coverageBadgeCopy({ coverage, covered: true, offline: true });
      expect(copy.label).toContain(coverage!.zoomMax.toLocaleString('fa-IR'));
      expect(copy.label).not.toMatch(/\d\d/);
    }
  });

  it('never produces an empty label', () => {
    const states = [
      { coverage: null, covered: true, offline: true },
      { coverage: null, covered: false, offline: false },
      { coverage: base, covered: true, offline: false },
      { coverage: base, covered: false, offline: false },
      { coverage: base, covered: true, offline: true },
      { coverage: base, covered: false, offline: true },
    ];
    for (const state of states) {
      expect(coverageBadgeCopy(state).label.length).toBeGreaterThan(0);
    }
  });
});