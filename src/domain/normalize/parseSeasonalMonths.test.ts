import { describe, expect, it } from 'vitest';
import { parseSeasonalMonths } from './parseSeasonalMonths';

describe('parseSeasonalMonths', () => {
  const cases: { name: string; note: string | null; expected: number[] | null }[] = [
    {
      name: 'open range with trailing advice',
      note: 'Open April-October only. Best in September during harvest season.',
      expected: [4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: 'sub-feature statement stays a note, not derived months',
      note: 'Rooftop open May-September only.',
      expected: null,
    },
    {
      name: 'open statement after another sentence still counts',
      note: 'Popular spot. Open May-September only.',
      expected: [5, 6, 7, 8, 9],
    },
    {
      name: 'note starting with month only',
      note: 'October only — check exact festival dates before planning.',
      expected: [10],
    },
    { name: 'advice range without open/only', note: 'Best April-October.', expected: null },
    {
      name: 'plain advice text',
      note: 'Summer queues can be brutal — pre-book online always.',
      expected: null,
    },
    { name: 'null note', note: null, expected: null },
    {
      name: 'wrap-around open range with en dash',
      note: 'Open November–March only.',
      expected: [11, 12, 1, 2, 3],
    },
    {
      name: 'three-letter lowercase months',
      note: 'open nov-mar only',
      expected: [11, 12, 1, 2, 3],
    },
    {
      name: 'closed range complements',
      note: 'Closed November-March.',
      expected: [4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: 'closed mid-year range',
      note: 'Closed Jun-Aug for maintenance.',
      expected: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    },
    { name: 'same-month range', note: 'Open May-May only.', expected: [5] },
    { name: 'uppercase note', note: 'OPEN JUNE-AUGUST ONLY', expected: [6, 7, 8] },
    {
      name: 'month only not at start is advice',
      note: 'Visit in October only if you must.',
      expected: null,
    },
    { name: 'open range without only is advice', note: 'Open April-October.', expected: null },
    { name: 'non-month range', note: 'Open weekends-holidays only.', expected: null },
  ];

  it.each(cases)('$name', ({ note, expected }) => {
    expect(parseSeasonalMonths(note)).toEqual(expected);
  });
});
