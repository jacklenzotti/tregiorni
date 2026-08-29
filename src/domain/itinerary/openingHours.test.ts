import { describe, expect, it } from 'vitest';
import type { Interval, OpeningHours, Weekday } from '../types';
import { UNKNOWN_HOURS_WINDOW, openIntervalsOn } from './openingHours';

const openAccess: OpeningHours = { kind: 'openAccess' };
const unknown: OpeningHours = { kind: 'unknown' };

function weekly(days: Partial<Record<Weekday, Interval[]>>): OpeningHours {
  const table = Array.from({ length: 7 }, (_, day) => days[day as Weekday] ?? []);
  return { kind: 'weekly', weekly: table, source: 'exact' };
}

describe('openIntervalsOn', () => {
  it('returns the full day for open access', () => {
    expect(openIntervalsOn(openAccess, 2)).toEqual([{ start: 0, end: 1440 }]);
  });

  it('returns the conservative window for unknown hours', () => {
    expect(openIntervalsOn(unknown, 4)).toEqual([UNKNOWN_HOURS_WINDOW]);
  });

  it('returns a weekday its own intervals', () => {
    const hours = weekly({
      2: [
        { start: 720, end: 870 },
        { start: 1140, end: 1350 },
      ],
    });
    expect(openIntervalsOn(hours, 2)).toEqual([
      { start: 720, end: 870 },
      { start: 1140, end: 1350 },
    ]);
  });

  it('returns nothing on a closed day', () => {
    expect(openIntervalsOn(weekly({ 1: [{ start: 540, end: 1020 }] }), 3)).toEqual([]);
  });

  it('spills past-midnight hours onto the next day, clamped', () => {
    const hours = weekly({ 4: [{ start: 1200, end: 1560 }] });
    expect(openIntervalsOn(hours, 5)).toEqual([{ start: 0, end: 120 }]);
  });

  it('treats Sunday as the previous weekday of Monday', () => {
    expect(openIntervalsOn(weekly({ 6: [{ start: 1320, end: 1500 }] }), 0)).toEqual([
      { start: 0, end: 60 },
    ]);
  });

  it('sorts spill before same-day intervals', () => {
    const hours = weekly({
      4: [{ start: 1200, end: 1560 }],
      5: [{ start: 600, end: 900 }],
    });
    expect(openIntervalsOn(hours, 5)).toEqual([
      { start: 0, end: 120 },
      { start: 600, end: 900 },
    ]);
  });
});
