import { describe, expect, it } from 'vitest';

import {
  datetimeFormatHint,
  formatStoredValue,
  isDateTimeFieldType,
  parseStoredValue,
  toStoredValue,
} from './form-datetime';

/**
 * Run `body` as if the device sat in `timeZone`.
 *
 * Node re-reads `TZ` for every local-time `Date` operation, so this genuinely
 * changes the clock the parser sees — which is what makes the drift test below
 * deterministic instead of dependent on where the test machine happens to run.
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

describe('isDateTimeFieldType', () => {
  it('accepts exactly the three temporal types', () => {
    expect(isDateTimeFieldType('date')).toBe(true);
    expect(isDateTimeFieldType('time')).toBe(true);
    expect(isDateTimeFieldType('datetime')).toBe(true);
  });

  it('rejects every other field type', () => {
    for (const type of ['text', 'textarea', 'number', 'select', 'location', 'file', '']) {
      expect(isDateTimeFieldType(type)).toBe(false);
    }
  });
});

describe('toStoredValue', () => {
  const moment = new Date(2026, 9, 1, 13, 5);

  it('writes each type in the format the rest of the app already speaks', () => {
    expect(toStoredValue('date', moment)).toBe('2026-10-01');
    expect(toStoredValue('time', moment)).toBe('13:05');
    expect(toStoredValue('datetime', moment)).toBe('2026-10-01T13:05');
  });

  it('zero-pads every part, so a value is never ambiguously narrow', () => {
    const early = new Date(2026, 0, 2, 3, 4);
    expect(toStoredValue('date', early)).toBe('2026-01-02');
    expect(toStoredValue('time', early)).toBe('03:04');
    expect(toStoredValue('datetime', early)).toBe('2026-01-02T03:04');
  });
});

describe('parseStoredValue — shape', () => {
  it('reads a date-only value as that local day', () => {
    const parsed = parseStoredValue('date', '2026-10-01');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(1);
    expect(parsed?.getHours()).toBe(0);
    expect(parsed?.getMinutes()).toBe(0);
  });

  it('reads a time-only value onto the fallback day', () => {
    const fallback = new Date(2026, 9, 1, 0, 0);
    const parsed = parseStoredValue('time', '12:30', fallback);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(1);
    expect(parsed?.getHours()).toBe(12);
    expect(parsed?.getMinutes()).toBe(30);
  });

  it('reads a full datetime value', () => {
    const parsed = parseStoredValue('datetime', '2026-10-01T12:30');
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(1);
    expect(parsed?.getHours()).toBe(12);
    expect(parsed?.getMinutes()).toBe(30);
  });

  it('tolerates the space separator some producers emit', () => {
    expect(parseStoredValue('datetime', '2026-10-01 12:30')?.getHours()).toBe(12);
  });

  it('accepts a datetime value on a date field, keeping the day', () => {
    const parsed = parseStoredValue('date', '2026-10-01T12:30');
    expect(parsed?.getDate()).toBe(1);
    expect(parsed?.getHours()).toBe(0);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseStoredValue('date', '  2026-10-01  ')?.getDate()).toBe(1);
  });
});

describe('parseStoredValue — rejects what it cannot trust', () => {
  it('returns null for absent or blank values', () => {
    expect(parseStoredValue('date', undefined)).toBeNull();
    expect(parseStoredValue('date', null)).toBeNull();
    expect(parseStoredValue('date', 42)).toBeNull();
    expect(parseStoredValue('date', '')).toBeNull();
    expect(parseStoredValue('date', '   ')).toBeNull();
  });

  it('returns null for unparseable text', () => {
    expect(parseStoredValue('date', 'not a date')).toBeNull();
    expect(parseStoredValue('time', 'noon')).toBeNull();
    expect(parseStoredValue('datetime', '2026-10-01')).toBeNull();
  });

  it('returns null for out-of-range parts', () => {
    expect(parseStoredValue('date', '2026-13-01')).toBeNull();
    expect(parseStoredValue('date', '2026-00-01')).toBeNull();
    expect(parseStoredValue('date', '2026-10-32')).toBeNull();
    expect(parseStoredValue('time', '25:00')).toBeNull();
    expect(parseStoredValue('time', '12:60')).toBeNull();
  });

  it('rejects a day the month does not have, instead of rolling it over', () => {
    // `new Date(2026, 1, 31)` silently becomes 3 March. Accepting that would let
    // a typo become a date the officer never picked.
    expect(parseStoredValue('date', '2026-02-31')).toBeNull();
    expect(parseStoredValue('date', '2026-04-31')).toBeNull();
    expect(parseStoredValue('date', '2026-02-29')).toBeNull();
  });

  it('still accepts a real leap day', () => {
    expect(parseStoredValue('date', '2028-02-29')?.getDate()).toBe(29);
  });
});

describe('parseStoredValue — absolute instants', () => {
  it('honours an explicit offset rather than re-reading it as local time', () => {
    const parsed = parseStoredValue('datetime', '2026-10-01T12:30:00.000Z');
    expect(parsed?.getTime()).toBe(Date.parse('2026-10-01T12:30:00.000Z'));
  });

  it('treats a numeric offset as an instant too', () => {
    const parsed = parseStoredValue('datetime', '2026-10-01T12:30:00+03:30');
    expect(parsed?.getTime()).toBe(Date.parse('2026-10-01T12:30:00+03:30'));
  });

  it('returns null for a malformed instant', () => {
    expect(parseStoredValue('datetime', '2026-13-45T99:99:00Z')).toBeNull();
  });
});

describe('parseStoredValue — the day never shifts across time zones', () => {
  it('reads a date-only value as the same calendar day west of Greenwich', () => {
    // The regression this guards: `new Date('2026-10-01')` is UTC midnight, so in
    // New York it is still 30 September. The officer would file the report a day
    // early without ever seeing the wrong value on screen.
    withTimeZone('America/New_York', () => {
      const parsed = parseStoredValue('date', '2026-10-01');
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(9);
      expect(parsed?.getDate()).toBe(1);
      expect(toStoredValue('date', parsed as Date)).toBe('2026-10-01');
    });
  });

  it('reads a date-only value as the same calendar day east of Greenwich', () => {
    withTimeZone('Asia/Tehran', () => {
      expect(toStoredValue('date', parseStoredValue('date', '2026-10-01') as Date))
        .toBe('2026-10-01');
    });
  });

  it('round-trips a datetime without drifting, in any zone', () => {
    for (const zone of ['America/New_York', 'Asia/Tehran', 'UTC', 'Pacific/Auckland']) {
      withTimeZone(zone, () => {
        expect(toStoredValue('datetime', parseStoredValue('datetime', '2026-10-01T12:30') as Date))
          .toBe('2026-10-01T12:30');
      });
    }
  });
});

describe('formatStoredValue', () => {
  it('canonicalises a loosely typed value', () => {
    // The web fallback is a text field, so a single-digit part has to survive the
    // round trip instead of reading as "no value".
    expect(formatStoredValue('time', '9:5')).toBe('09:05');
    expect(formatStoredValue('date', '2026-1-2')).toBe('2026-01-02');
    expect(formatStoredValue('datetime', '2026-1-2 9:5')).toBe('2026-01-02T09:05');
  });

  it('returns an empty string for anything unusable, so presence is decidable', () => {
    expect(formatStoredValue('date', undefined)).toBe('');
    expect(formatStoredValue('date', 'nope')).toBe('');
    expect(formatStoredValue('datetime', '2026-02-31')).toBe('');
  });

  it('pins the exact fixtures the QA definition and its suite already use', () => {
    // `qa-accident-form.test.ts` answers the form with these two values; if the
    // stored format ever changes, this is where it fails loudly.
    expect(formatStoredValue('date', '2026-10-01')).toBe('2026-10-01');
    expect(formatStoredValue('time', '12:30')).toBe('12:30');
  });
});

describe('datetimeFormatHint', () => {
  it('names the wire format for each type', () => {
    expect(datetimeFormatHint('date')).toBe('YYYY-MM-DD');
    expect(datetimeFormatHint('time')).toBe('HH:mm');
    expect(datetimeFormatHint('datetime')).toBe('YYYY-MM-DDTHH:mm');
  });
});
