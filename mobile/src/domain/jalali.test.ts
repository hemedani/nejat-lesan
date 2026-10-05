import { describe, expect, it } from 'vitest';

import {
  addJalaliMonths,
  buildJalaliMonthGrid,
  buildJalaliMonthWeeks,
  formatJalaliClock,
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliLong,
  formatJalaliMonthTitle,
  isJalaliLeapYear,
  isSameJalaliDay,
  jalaliDayKey,
  jalaliMonthLength,
  jalaliToday,
  jalaliWeekdayIndex,
  toGregorianDate,
  toJalali,
  toPersianDigits,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_INITIALS,
  JALALI_WEEKDAY_NAMES,
} from './jalali';

const g = (year: number, month: number, day: number) => new Date(year, month - 1, day);
const j = (year: number, month: number, day: number) => ({ year, month, day });

/**
 * Run `body` as if the device sat in `timeZone`.
 *
 * Node re-reads `TZ` for every local-time `Date` operation, so this genuinely
 * changes the clock the conversion sees. The calendar must work off the
 * officer's local day, so a conversion that secretly used UTC would pass in
 * Tehran and fail here.
 */
const withTimeZone = <T>(timeZone: string, body: () => T): T => {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return body();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

/**
 * Conversions pinned against the official Iranian calendar rather than against
 * this implementation, so a bug in the arithmetic cannot validate itself.
 */
describe('toJalali — pinned reference dates', () => {
  it('converts the 1979 revolution, the millennium and a modern day', () => {
    expect(toJalali(g(1979, 2, 11))).toEqual(j(1357, 11, 22));
    expect(toJalali(g(2000, 1, 1))).toEqual(j(1378, 10, 11));
    expect(toJalali(g(2026, 10, 5))).toEqual(j(1405, 7, 13));
  });

  it('converts the first day of several years', () => {
    expect(toJalali(g(2020, 3, 20))).toEqual(j(1399, 1, 1));
    expect(toJalali(g(2021, 3, 21))).toEqual(j(1400, 1, 1));
    expect(toJalali(g(2024, 3, 20))).toEqual(j(1403, 1, 1));
    expect(toJalali(g(2026, 3, 21))).toEqual(j(1405, 1, 1));
  });

  it('converts the last day of a leap year and the day before Nowruz', () => {
    // 1399 is a leap year, so Esfand has 30 days and 20 March 2021 is its last.
    expect(toJalali(g(2021, 3, 20))).toEqual(j(1399, 12, 30));
    expect(toJalali(g(2021, 3, 21))).toEqual(j(1400, 1, 1));
  });
});

describe('toGregorianDate', () => {
  it('converts the same reference dates back', () => {
    expect(toGregorianDate(j(1357, 11, 22))).toEqual(g(1979, 2, 11));
    expect(toGregorianDate(j(1378, 10, 11))).toEqual(g(2000, 1, 1));
    expect(toGregorianDate(j(1405, 7, 13))).toEqual(g(2026, 10, 5));
  });

  it('builds a local midnight, not a UTC one', () => {
    // A UTC-midnight Date is what `new Date('2026-10-01')` yields, and it reads
    // back as the previous day west of Greenwich — the exact drift this avoids.
    const built = toGregorianDate(j(1405, 7, 13));
    expect(built.getHours()).toBe(0);
    expect(built.getDate()).toBe(5);
    expect(built.getMonth()).toBe(9);
  });
});

describe('round-trip and contiguity', () => {
  it('round-trips every day across sixteen years', () => {
    let cursor = g(2010, 1, 1);
    for (let index = 0; index < 6000; index += 1) {
      const back = toGregorianDate(toJalali(cursor));
      expect(back.getFullYear()).toBe(cursor.getFullYear());
      expect(back.getMonth()).toBe(cursor.getMonth());
      expect(back.getDate()).toBe(cursor.getDate());
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
  });

  it('advances one Jalali day per Gregorian day, with no gaps', () => {
    // This is what catches an off-by-one at a month or year boundary.
    const length = (date: Date) => {
      const { year, month, day } = toJalali(date);
      return { year, month, day };
    };
    let cursor = g(2026, 2, 25);
    for (let index = 0; index < 400; index += 1) {
      const today = length(cursor);
      const tomorrow = length(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1));
      const expected = advanceOneDay(today);
      expect(tomorrow).toEqual(expected);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
  });
});

/** The next Jalali day, computed independently of the module under test. */
const advanceOneDay = (date: { year: number; month: number; day: number }) => {
  const daysInMonth = monthLengthForTest(date.year, date.month);
  if (date.day < daysInMonth) return { ...date, day: date.day + 1 };
  if (date.month < 12) return { year: date.year, month: date.month + 1, day: 1 };
  return { year: date.year + 1, month: 1, day: 1 };
};

/**
 * The leap years this test walks through, taken from the official calendar
 * rather than from the module. Only the years the tests actually visit need to
 * be right; the exhaustive agreement check below uses a different invariant.
 */
const LEAP_YEARS = new Set([1395, 1399, 1403]);

/** Month lengths derived from the known leap years, not from the module. */
const monthLengthForTest = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return LEAP_YEARS.has(year) ? 30 : 29;
};

/**
 * Days from one Nowruz to the next, straight off the conversion.
 *
 * This is the independent check on `isJalaliLeapYear`: the leap flag comes from
 * one branch of the arithmetic and the Nowruz day from another, so if the flag
 * disagreed with the real length of the year this would catch it.
 */
const jalaliYearLength = (year: number): number => {
  const start = toGregorianDate(j(year, 1, 1));
  const end = toGregorianDate(j(year + 1, 1, 1));
  // Both are local midnights; rounding absorbs any daylight-saving hour.
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
};

describe('month lengths and leap years', () => {
  it('gives the first six months 31 days and the next five 30', () => {
    for (const month of [1, 2, 3, 4, 5, 6]) expect(jalaliMonthLength(1405, month)).toBe(31);
    for (const month of [7, 8, 9, 10, 11]) expect(jalaliMonthLength(1405, month)).toBe(30);
  });

  it('gives Esfand 29 days, or 30 in a leap year', () => {
    expect(jalaliMonthLength(1405, 12)).toBe(29);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
  });

  it('calls a year leap exactly when it really has 366 days', () => {
    for (let year = 1390; year <= 1440; year += 1) {
      expect(jalaliYearLength(year)).toBe(isJalaliLeapYear(year) ? 366 : 365);
    }
  });

  it('agrees with the official calendar on known leap years', () => {
    // Justified by the pinned Nowruz dates: 1399 runs 2020-03-20 → 2021-03-21
    // and 1403 runs 2024-03-20 → 2025-03-21, both 366 days.
    expect(isJalaliLeapYear(1399)).toBe(true);
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(isJalaliLeapYear(1400)).toBe(false);
    expect(isJalaliLeapYear(1405)).toBe(false);
    for (const year of LEAP_YEARS) expect(isJalaliLeapYear(year)).toBe(true);
  });

  it('puts Nowruz on 20 or 21 March, every year', () => {
    for (let year = 1390; year <= 1440; year += 1) {
      const nowruz = toGregorianDate(j(year, 1, 1));
      expect(nowruz.getMonth()).toBe(2);
      expect([20, 21]).toContain(nowruz.getDate());
    }
  });

  it('refuses a month outside 1..12 instead of guessing', () => {
    expect(() => jalaliMonthLength(1405, 0)).toThrow();
    expect(() => jalaliMonthLength(1405, 13)).toThrow();
  });
});

describe('jalaliWeekdayIndex', () => {
  it('counts from Saturday, because the Persian week starts then', () => {
    // 2026-10-03 is a Saturday; 2026-10-09 is a Friday.
    expect(jalaliWeekdayIndex(g(2026, 10, 3))).toBe(0);
    expect(jalaliWeekdayIndex(g(2026, 10, 4))).toBe(1);
    expect(jalaliWeekdayIndex(g(2026, 10, 9))).toBe(6);
  });

  it('has names and initials of matching length and order', () => {
    expect(JALALI_WEEKDAY_NAMES).toHaveLength(7);
    expect(JALALI_WEEKDAY_INITIALS).toHaveLength(7);
    expect(JALALI_WEEKDAY_NAMES[0]).toBe('شنبه');
    expect(JALALI_WEEKDAY_NAMES[6]).toBe('جمعه');
    expect(JALALI_WEEKDAY_INITIALS[0]).toBe('ش');
    expect(JALALI_WEEKDAY_INITIALS[6]).toBe('ج');
  });
});

describe('buildJalaliMonthGrid', () => {
  it('always returns six whole weeks, so the sheet never resizes', () => {
    for (const month of [1, 6, 7, 12]) {
      expect(buildJalaliMonthGrid(1405, month)).toHaveLength(42);
    }
  });

  it('offsets the first day by its weekday and pads the tail', () => {
    // 1 Mehr 1405 is a Wednesday, index 4.
    const grid = buildJalaliMonthGrid(1405, 7);
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toBe(1);
    expect(grid[4 + 29]).toBe(30);
    expect(grid.slice(34)).toEqual([null, null, null, null, null, null, null, null]);
  });

  it('places every day of the month exactly once, in order', () => {
    for (let month = 1; month <= 12; month += 1) {
      const days = buildJalaliMonthGrid(1405, month).filter((cell): cell is number => cell !== null);
      expect(days).toEqual(Array.from({ length: jalaliMonthLength(1405, month) }, (_, i) => i + 1));
    }
  });

  it('starts every month on the right weekday', () => {
    for (let month = 1; month <= 12; month += 1) {
      const grid = buildJalaliMonthGrid(1405, month);
      const offset = grid.indexOf(1);
      expect(offset).toBe(jalaliWeekdayIndex(toGregorianDate(j(1405, month, 1))));
    }
  });
});

describe('buildJalaliMonthWeeks', () => {
  it('chops the grid into six rows of seven', () => {
    const weeks = buildJalaliMonthWeeks(1405, 7);
    expect(weeks).toHaveLength(6);
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks.flat()).toEqual(buildJalaliMonthGrid(1405, 7));
  });

  it('keeps the first day under its weekday column', () => {
    // 1 Mehr 1405 is a Wednesday: index 4 in a Saturday-first row.
    const weeks = buildJalaliMonthWeeks(1405, 7);
    expect(weeks[0]).toEqual([null, null, null, null, 1, 2, 3]);
  });

  it('puts the last day of the month in the row it belongs to', () => {
    const weeks = buildJalaliMonthWeeks(1405, 7);
    // 30 days starting on the fifth column: 3 in week 0, then 4×7, then 30th.
    expect(weeks[4]).toContain(30);
    expect(weeks[5].every((cell) => cell === null)).toBe(true);
  });
});

describe('addJalaliMonths', () => {
  it('carries across the year boundary in both directions', () => {
    expect(addJalaliMonths(j(1405, 12, 1), 1)).toEqual(j(1406, 1, 1));
    expect(addJalaliMonths(j(1405, 1, 1), -1)).toEqual(j(1404, 12, 1));
    expect(addJalaliMonths(j(1405, 6, 1), 12)).toEqual(j(1406, 6, 1));
  });

  it('clamps the day to the target month rather than rolling over', () => {
    // 31 Farvardin + 6 months → Mehr has 30 days, so it must not become 1 Aban.
    expect(addJalaliMonths(j(1405, 1, 31), 6)).toEqual(j(1405, 7, 30));
    expect(addJalaliMonths(j(1405, 1, 31), 11)).toEqual(j(1405, 12, 29));
  });
});

describe('formatting', () => {
  const moment = g(2026, 10, 5);

  it('renders a date in Persian digits', () => {
    expect(formatJalaliDate(moment)).toBe('۱۴۰۵/۰۷/۱۳');
  });

  it('renders a long date with the month name', () => {
    expect(formatJalaliLong(moment)).toBe('۱۳ مهر ۱۴۰۵');
  });

  it('renders a month heading', () => {
    expect(formatJalaliMonthTitle(1405, 7)).toBe('مهر ۱۴۰۵');
    expect(JALALI_MONTH_NAMES[0]).toBe('فروردین');
    expect(JALALI_MONTH_NAMES[11]).toBe('اسفند');
  });

  it('zero-pads and Persianises the clock', () => {
    expect(formatJalaliClock(new Date(2026, 9, 5, 9, 5))).toBe('۰۹:۰۵');
    expect(formatJalaliClock(new Date(2026, 9, 5, 23, 59))).toBe('۲۳:۵۹');
  });

  it('renders a date and time together', () => {
    expect(formatJalaliDateTime(new Date(2026, 9, 5, 12, 30))).toBe('۱۴۰۵/۰۷/۱۳ - ۱۲:۳۰');
  });

  it('converts digits without touching anything else', () => {
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
    expect(toPersianDigits('a1b2')).toBe('a۱b۲');
    expect(toPersianDigits('')).toBe('');
  });
});

describe('day identity', () => {
  it('keys a day by its Jalali parts', () => {
    expect(jalaliDayKey(g(2026, 10, 5))).toBe('1405-7-13');
  });

  it('compares days, ignoring the time of day', () => {
    expect(isSameJalaliDay(new Date(2026, 9, 5, 1, 0), new Date(2026, 9, 5, 23, 0))).toBe(true);
    expect(isSameJalaliDay(g(2026, 10, 5), g(2026, 10, 6))).toBe(false);
  });

  it('reports today as a Jalali date', () => {
    const today = jalaliToday();
    expect(today.month).toBeGreaterThanOrEqual(1);
    expect(today.month).toBeLessThanOrEqual(12);
    expect(today.day).toBeGreaterThanOrEqual(1);
  });
});

/**
 * The calendar must read the officer's *local* day. A conversion that went
 * through UTC would be off by one in the Americas, which is precisely the drift
 * `form-datetime.ts` exists to prevent.
 */
describe('local-day discipline', () => {
  it('converts a local midnight to the same day, in any zone', () => {
    for (const zone of ['Asia/Tehran', 'UTC', 'America/New_York', 'Pacific/Kiritimati']) {
      withTimeZone(zone, () => {
        expect(toJalali(g(2026, 10, 5))).toEqual(j(1405, 7, 13));
        expect(toJalali(g(2026, 3, 21))).toEqual(j(1405, 1, 1));
      });
    }
  });

  it('does not follow the UTC midnight a bare date string would produce', () => {
    withTimeZone('America/New_York', () => {
      // `new Date('2026-10-01')` is UTC midnight, i.e. 30 September locally —
      // and 30 September is 8 Mehr, one day earlier than the officer means.
      expect(toJalali(new Date('2026-10-01'))).toEqual(j(1405, 7, 8));
      // The local midnight the app actually builds is 1 October, i.e. 9 Mehr.
      expect(toJalali(g(2026, 10, 1))).toEqual(j(1405, 7, 9));
    });
  });
});

describe('range guard', () => {
  it('throws outside the tabulated years rather than guessing', () => {
    expect(() => toGregorianDate(j(4000, 1, 1))).toThrow(RangeError);
  });
});
