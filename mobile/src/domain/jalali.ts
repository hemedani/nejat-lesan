/**
 * Jalali (Solar Hijri / Shamsi) calendar arithmetic.
 *
 * The officers this app is built for read and write dates in the Jalali
 * calendar, but *nothing else in the system does*: the definition stores a
 * Gregorian ISO string, `accidentSetSchema.ts` accepts it through `date()`, and
 * the web panel and reports render it as-is. So the Jalali calendar is a
 * **presentation and input** concern only — every value that crosses the wire
 * stays Gregorian. `toGregorianDate` / `toJalali` are the single boundary.
 *
 * Conversion is the standard arithmetic algorithm (the one `jalaali-js` and
 * ICU agree on), implemented here rather than pulled in as a dependency: it is
 * ~80 lines of integer math, it must run in the `node` Vitest environment where
 * a native date module would not, and the repo's convention is that date logic
 * is pure and unit-tested rather than trusted to a component.
 *
 * Everything works on **local calendar parts** (`getFullYear` / `getMonth` /
 * `getDate`), never on an epoch instant. That matches `form-datetime.ts`: a bare
 * `2026-10-01` is a wall-clock day, and reading it as UTC midnight would file a
 * report under the previous day anywhere west of Greenwich.
 */

export type JalaliDate = {
  /** Jalali year, e.g. 1405. */
  year: number;
  /** 1..12 — Farvardin is 1, Esfand is 12. */
  month: number;
  /** 1..31, bounded by the month's own length. */
  day: number;
};

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/**
 * Weekday names, **Saturday first** — the Persian week starts on Saturday, not
 * Sunday, so index 0 here is Saturday. `jalaliWeekdayIndex` returns indices into
 * this list.
 */
export const JALALI_WEEKDAY_NAMES = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

/** Single-letter column headers, in the same order as `JALALI_WEEKDAY_NAMES`. */
export const JALALI_WEEKDAY_INITIALS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

/** A month grid is always six weeks tall, so the sheet does not jump in height. */
export const JALALI_WEEKS_IN_GRID = 6;
const DAYS_IN_WEEK = 7;

// ---------------------------------------------------------------------------
// Integer helpers — `Math.trunc` division, which the algorithm is defined in
// terms of. `Math.floor` would be wrong for the negative arguments the
// algorithm passes (the breaks table starts at -61).
// ---------------------------------------------------------------------------

const div = (a: number, b: number): number => Math.trunc(a / b);
const mod = (a: number, b: number): number => a - Math.trunc(a / b) * b;

/**
 * The years at which the Jalali leap-year pattern changes.
 *
 * The pattern is not a simple 4-year cycle: it is a 33-year cycle with a
 * correction, and this table marks the epochs where the correction shifts.
 */
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

type JalCal = {
  /** 0 when the year is a leap year; otherwise the leap position in the cycle. */
  leap: number;
  /** The Gregorian year this Jalali year begins in. */
  gy: number;
  /** The day of March on which Nowruz (1 Farvardin) falls. */
  march: number;
};

/**
 * A Jalali year's leap status and the Gregorian day its Nowruz falls on.
 *
 * Throws outside the tabulated range rather than returning a plausible-looking
 * wrong answer: a year the table does not cover has no correct conversion, and a
 * silently wrong date is worse than a crash in a report an officer will file.
 */
const jalCal = (jy: number): JalCal => {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new RangeError(`Jalali year out of supported range: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
};

/** Gregorian date → Julian day number. */
const g2d = (gy: number, gm: number, gd: number): number => {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
};

/** Julian day number → Gregorian date. */
const d2g = (jdn: number): { gy: number; gm: number; gd: number } => {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
};

/** Jalali date → Julian day number. */
const j2d = (jy: number, jm: number, jd: number): number => {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
};

/** Julian day number → Jalali date. */
const d2j = (jdn: number): JalaliDate => {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    // Days 0..185 are the six 31-day months; 186.. are the five 30-day months
    // plus Esfand.
    if (k <= 185) return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    k -= 186;
  } else {
    // Before Nowruz, so the day belongs to the *previous* Jalali year.
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
};

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * The local calendar day of a `Date`, as a Jalali date.
 *
 * Uses local parts deliberately — see the module note. A `Date` built for UTC
 * midnight (which is what `new Date('2026-10-01')` produces) therefore converts
 * one day early in the Americas, which is exactly why `form-datetime.ts` refuses
 * to hand a bare date string to the platform parser.
 */
export const toJalali = (date: Date): JalaliDate =>
  d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));

/** A Jalali date → a local `Date` at midnight. */
export const toGregorianDate = ({ year, month, day }: JalaliDate): Date => {
  const { gy, gm, gd } = d2g(j2d(year, month, day));
  return new Date(gy, gm - 1, gd, 0, 0, 0, 0);
};

/** Whether a Jalali year has 366 days (Esfand has 30 rather than 29). */
export const isJalaliLeapYear = (year: number): boolean => jalCal(year).leap === 0;

/**
 * A Jalali month's length: the first six months have 31 days, the next five have
 * 30, and Esfand has 29 — or 30 in a leap year.
 */
export const jalaliMonthLength = (year: number, month: number): number => {
  if (month < 1 || month > 12) throw new RangeError(`Jalali month out of range: ${month}`);
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
};

/**
 * Weekday of a date as an index into `JALALI_WEEKDAY_NAMES`, Saturday being 0.
 *
 * `Date.getDay()` is Sunday-based, so it is rotated: Saturday (6) → 0,
 * Sunday (0) → 1, … Friday (5) → 6.
 */
export const jalaliWeekdayIndex = (date: Date): number => (date.getDay() + 1) % DAYS_IN_WEEK;

/**
 * The cells of one Jalali month, Saturday-first, padded to whole weeks.
 *
 * `null` marks a padding cell (a day belonging to an adjacent month). Always
 * `JALALI_WEEKS_IN_GRID * 7` long, so the calendar does not resize as the
 * officer pages through months.
 */
export const buildJalaliMonthGrid = (
  year: number,
  month: number,
): (number | null)[] => {
  const offset = jalaliWeekdayIndex(toGregorianDate({ year, month, day: 1 }));
  const length = jalaliMonthLength(year, month);

  const cells: (number | null)[] = [];
  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= length; day += 1) cells.push(day);
  while (cells.length < JALALI_WEEKS_IN_GRID * DAYS_IN_WEEK) cells.push(null);
  return cells;
};

/**
 * The same month as whole weeks — one array per calendar row, Saturday first.
 *
 * The renderer draws one row per entry with an explicit right-to-left direction,
 * rather than relying on a wrapping container to flow right-to-left: that keeps
 * the weekday columns aligned with the header without depending on how the
 * layout engine resolves wrapping in a reversed direction.
 */
export const buildJalaliMonthWeeks = (
  year: number,
  month: number,
): (number | null)[][] => {
  const cells = buildJalaliMonthGrid(year, month);
  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_IN_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_IN_WEEK));
  }
  return weeks;
};

/**
 * Move a Jalali date by whole months, clamping the day to the target month.
 *
 * Clamping matters: paging from 31 Farvardin to Mehr, which has 30 days, must
 * land on 30 Mehr rather than rolling into Aban.
 */
export const addJalaliMonths = (date: JalaliDate, delta: number): JalaliDate => {
  const absolute = date.year * 12 + (date.month - 1) + delta;
  const year = Math.floor(absolute / 12);
  const month = mod(absolute, 12) + 1;
  return { year, month, day: Math.min(date.day, jalaliMonthLength(year, month)) };
};

/** The Jalali calendar day of a `Date`, as a stable `"y-m-d"` key. */
export const jalaliDayKey = (date: Date): string => {
  const { year, month, day } = toJalali(date);
  return `${year}-${month}-${day}`;
};

/** Whether two `Date`s fall on the same Jalali day. */
export const isSameJalaliDay = (a: Date, b: Date): boolean => jalaliDayKey(a) === jalaliDayKey(b);

/** Today, as a Jalali date. */
export const jalaliToday = (): JalaliDate => toJalali(new Date());

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** Latin digits → Persian digits, leaving anything else untouched. */
export const toPersianDigits = (value: string | number): string =>
  String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** `۱۴۰۵/۰۷/۱۳` */
export const formatJalaliDate = (date: Date): string => {
  const { year, month, day } = toJalali(date);
  return toPersianDigits(`${year}/${pad2(month)}/${pad2(day)}`);
};

/** `۱۳ مهر ۱۴۰۵` */
export const formatJalaliLong = (date: Date): string => {
  const { year, month, day } = toJalali(date);
  return `${toPersianDigits(day)} ${JALALI_MONTH_NAMES[month - 1]} ${toPersianDigits(year)}`;
};

/** `مهر ۱۴۰۵` — the calendar's month heading. */
export const formatJalaliMonthTitle = (year: number, month: number): string =>
  `${JALALI_MONTH_NAMES[month - 1]} ${toPersianDigits(year)}`;

/** `۱۲:۳۰` */
export const formatJalaliClock = (date: Date): string =>
  toPersianDigits(`${pad2(date.getHours())}:${pad2(date.getMinutes())}`);

/** `۱۴۰۵/۰۷/۱۳ - ۱۲:۳۰` */
export const formatJalaliDateTime = (date: Date): string =>
  `${formatJalaliDate(date)} - ${formatJalaliClock(date)}`;
