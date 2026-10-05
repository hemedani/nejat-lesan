/**
 * Value handling for the `date`, `time` and `datetime` field types.
 *
 * A definition stores an answer as a plain string, and the engine deliberately
 * does not police its shape: `validateForm` checks presence, option membership
 * and length/numeric bounds only, so the *client* decides the format. The three
 * formats below are therefore not a free choice — they are the ones the rest of
 * the app and the backend already speak:
 *
 *   date      2026-10-01          the QA form's own fixture
 *   time      12:30               the QA form's own fixture
 *   datetime  2026-10-01T12:30    `isValidDatetime` in `accident-form.ts`, and
 *                                 what `accident.date_of_accident: date()`
 *                                 accepts at submit time
 *
 * Everything here is pure and timezone-explicit. A bare `2026-10-01` is **never**
 * handed to `new Date(string)`: the spec parses a date-only string as UTC
 * midnight, so anywhere west of Greenwich `getDate()` then returns the previous
 * day and the officer's report files under the wrong date. The parts are parsed
 * by hand and given to the `Date` constructor, which builds them in local time —
 * the same clock the picker shows and the officer reads.
 */

export type DateTimeFieldType = 'date' | 'time' | 'datetime';

export const isDateTimeFieldType = (type: string): type is DateTimeFieldType =>
  type === 'date' || type === 'time' || type === 'datetime';

// Month, day, hour and minute accept one *or* two digits. The picker always
// emits a zero-padded value, but the web fallback is a free-text field, and a
// hand-typed `2026-1-2` should become `2026-01-02` rather than silently read as
// "no value". The ranges are still enforced below, so leniency here cannot admit
// an impossible date.
const DATE_PART = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const TIME_PART = /^(\d{1,2}):(\d{1,2})$/;
const DATE_TIME_PART = /^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{1,2})/;
/**
 * A trailing `Z` or `±hh:mm` marks the string as an instant rather than a wall
 * clock. Only those may go through the platform parser, because they carry their
 * own offset and so cannot be mis-read.
 */
const ABSOLUTE_INSTANT = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

const pad = (value: number): string => String(value).padStart(2, '0');

/** A `Date` → the string a definition and the backend expect for this type. */
export const toStoredValue = (type: DateTimeFieldType, date: Date): string => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  if (type === 'date') return `${year}-${month}-${day}`;
  if (type === 'time') return `${hours}:${minutes}`;
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Build a local `Date` from wall-clock parts, rejecting impossible days.
 *
 * The round-trip check is what rejects `2026-02-31`: the `Date` constructor
 * happily rolls that over to 3 March, which would let a typo quietly become a
 * real date the officer never chose.
 */
const buildLocal = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date | null => {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) {
    return null;
  }
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

/**
 * A stored answer → the `Date` the picker positions itself on.
 *
 * Returns `null` for anything that is not a usable value, so the caller decides
 * what to do (open on "now") rather than receiving a plausible-looking wrong
 * date. `fallback` supplies the parts the value does not carry: a `time` answer
 * has no day of its own, so it borrows one — normally today, which keeps the
 * picker near the current time.
 */
export const parseStoredValue = (
  type: DateTimeFieldType,
  raw: unknown,
  fallback: Date = new Date(),
): Date | null => {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  if (ABSOLUTE_INSTANT.test(value)) {
    const instant = new Date(value);
    return Number.isNaN(instant.getTime()) ? null : instant;
  }

  const dateOnly = DATE_PART.exec(value);
  const timeOnly = TIME_PART.exec(value);
  const dateTime = DATE_TIME_PART.exec(value);

  if (type === 'date') {
    // A `datetime` answer is accepted for a `date` field: the day is what this
    // type is about, and refusing it would strand a value a rename left behind.
    const match = dateOnly ?? dateTime;
    return match ? buildLocal(Number(match[1]), Number(match[2]), Number(match[3])) : null;
  }

  if (type === 'time') {
    const day = [fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate()] as const;
    if (timeOnly) return buildLocal(day[0], day[1], day[2], Number(timeOnly[1]), Number(timeOnly[2]));
    if (dateTime) return buildLocal(day[0], day[1], day[2], Number(dateTime[4]), Number(dateTime[5]));
    return null;
  }

  if (!dateTime) return null;
  return buildLocal(
    Number(dateTime[1]),
    Number(dateTime[2]),
    Number(dateTime[3]),
    Number(dateTime[4]),
    Number(dateTime[5]),
  );
};

/**
 * Human-readable text for a committed value, canonicalised.
 *
 * Deliberately the stored string itself — Latin digits, read left-to-right — so
 * the officer sees exactly the value about to be submitted and nothing can be
 * misread between the picker and the payload. It matches how the `location`
 * field presents its captured coordinates. A Jalali rendering is a *display*
 * concern the native picker already handles through the device locale.
 *
 * Canonicalising matters because it normalises a loosely typed value (`9:5` →
 * `09:05`) and returns `''` for junk, which is what lets the caller decide
 * whether a value is present at all.
 */
export const formatStoredValue = (type: DateTimeFieldType, raw: unknown): string => {
  const date = parseStoredValue(type, raw);
  return date ? toStoredValue(type, date) : '';
};

/** The wire format, for a placeholder or a hint. */
export const datetimeFormatHint = (type: DateTimeFieldType): string => {
  if (type === 'date') return 'YYYY-MM-DD';
  if (type === 'time') return 'HH:mm';
  return 'YYYY-MM-DDTHH:mm';
};
