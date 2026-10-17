/**
 * Persian wording for the map's coverage badge.
 *
 * Extracted from the component because the wording *is* the behaviour here: the
 * first version said "آفلاین آماده" whenever a clamp guaranteed something was
 * drawn, which told the officer a blurry z10 render was a usable z17 map while
 * they were online. Copy that overstates the offline story needs a test, not a
 * snapshot.
 */

import type { MapCoverage } from './map-coverage';

export type CoverageBadgeTone = 'success' | 'warning' | 'info' | 'neutral';

export type CoverageBadgeState = {
  coverage: MapCoverage | null;
  /** Whether the requested tile level is fully backed by disk. */
  covered: boolean;
  offline: boolean;
};

export type CoverageBadgeCopy = {
  label: string;
  tone: CoverageBadgeTone;
};

export function coverageBadgeCopy({ coverage, covered, offline }: CoverageBadgeState): CoverageBadgeCopy {
  if (!coverage) {
    return {
      label: 'نقشه آفلاین آماده نیست',
      tone: 'info',
    };
  }

  // Persian numerals: a Latin "17" in an RTL badge reads as noise to an officer.
  const depth = coverage.zoomMax.toLocaleString('fa-IR');

  if (offline) {
    return covered
      ? { label: `آفلاین آماده · تا بزرگ‌نمایی ${depth}`, tone: 'success' }
      : { label: `پوشش آفلاین: تا بزرگ‌نمایی ${depth}`, tone: 'warning' };
  }

  // Online: never promise offline readiness. Naming the depth the officer would
  // fall back to is still useful, but as information rather than a promise.
  return covered
    ? { label: `آنلاین · تا بزرگ‌نمایی ${depth} ذخیره شده`, tone: 'neutral' }
    : { label: `آنلاین · ذخیره تا بزرگ‌نمایی ${depth}`, tone: 'neutral' };
}