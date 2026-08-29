import { describe, expect, it } from 'vitest';
import type { Interval } from '../types';
import { parseHours } from './parseHours';

const ALL = [0, 1, 2, 3, 4, 5, 6];

function iv(start: number, end: number): Interval {
  return { start, end };
}

function week(...groups: [number[], Interval[]][]): Interval[][] {
  const weekly: Interval[][] = Array.from({ length: 7 }, () => []);
  for (const [days, intervals] of groups) {
    for (const day of days) weekly[day] = intervals.map((interval) => ({ ...interval }));
  }
  return weekly;
}

describe('parseHours', () => {
  const exactCases: [string, Interval[][]][] = [
    ['9:00-19:00', week([ALL, [iv(540, 1140)]])],
    ['Mon-Sat 10:00-18:00', week([[0, 1, 2, 3, 4, 5], [iv(600, 1080)]])],
    ['12:00-14:30, 19:00-22:30', week([ALL, [iv(720, 870), iv(1140, 1350)]])],
    ['Tues-Sat 12:30-14:00, 20:00-22:00', week([[1, 2, 3, 4, 5], [iv(750, 840), iv(1200, 1320)]])],
    [
      'Mon-Fri 7:00-14:00, Sat 7:00-17:00',
      week([[0, 1, 2, 3, 4], [iv(420, 840)]], [[5], [iv(420, 1020)]]),
    ],
    ['Tues, Thurs-Sun 10:00-18:00', week([[1, 3, 4, 5, 6], [iv(600, 1080)]])],
    ['Daily 10:00-24:00', week([ALL, [iv(600, 1440)]])],
    ['Wed-Mon 10:00-18:00', week([[2, 3, 4, 5, 6, 0], [iv(600, 1080)]])],
    ['8am-7pm', week([ALL, [iv(480, 1140)]])],
    ['9am-12:30pm', week([ALL, [iv(540, 750)]])],
    ['8:00-01:00', week([ALL, [iv(480, 1500)]])],
    [
      'Mon-Sat 9:30-17:15, Sun 14:00-17:00',
      week([[0, 1, 2, 3, 4, 5], [iv(570, 1035)]], [[6], [iv(840, 1020)]]),
    ],
    ['Tues-Sun 8:15-18:50', week([[1, 2, 3, 4, 5, 6], [iv(495, 1130)]])],
  ];

  it.each(exactCases)('parses %j as exact weekly hours', (raw, weekly) => {
    expect(parseHours(raw, 'restaurant')).toEqual({
      hours: { kind: 'weekly', weekly, source: 'exact' },
      flags: [],
    });
  });

  const vagueCases: [string, Interval][] = [
    ['Morning only', iv(480, 720)],
    ['Evenings', iv(1020, 1320)],
  ];

  it.each(vagueCases)('infers %j with approximated flag', (raw, interval) => {
    expect(parseHours(raw, 'restaurant')).toEqual({
      hours: { kind: 'weekly', weekly: week([ALL, [interval]]), source: 'inferred' },
      flags: ['hours-approximated'],
    });
  });

  it('treats null hours on a neighborhood as open access', () => {
    expect(parseHours(null, 'neighborhood')).toEqual({
      hours: { kind: 'openAccess' },
      flags: [],
    });
  });

  it('treats null hours on other types as unknown and unverified', () => {
    expect(parseHours(null, 'museum')).toEqual({
      hours: { kind: 'unknown' },
      flags: ['hours-unverified'],
    });
  });

  it('flags unparseable strings as unknown and unparsed', () => {
    expect(parseHours('open all day', 'restaurant')).toEqual({
      hours: { kind: 'unknown' },
      flags: ['hours-unparsed'],
    });
  });
});
