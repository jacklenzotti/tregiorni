import { describe, expect, it } from 'vitest';
import { ALL_TYPES_KEY, computeTypeMedians, resolveDuration } from './resolveDuration';

describe('computeTypeMedians', () => {
  it('takes the per-type median, odd and even counts, ignoring nulls', () => {
    const medians = computeTypeMedians([
      { type: 'museum', minutes: 120 },
      { type: 'museum', minutes: 60 },
      { type: 'museum', minutes: 90 },
      { type: 'museum', minutes: null },
      { type: 'cafe', minutes: 30 },
      { type: 'cafe', minutes: 60 },
    ]);
    expect(medians.get('museum')).toBe(90);
    expect(medians.get('cafe')).toBe(45);
  });

  it('rounds to the nearest 15 with a floor of 15', () => {
    expect(computeTypeMedians([{ type: 'shop', minutes: 50 }]).get('shop')).toBe(45);
    expect(computeTypeMedians([{ type: 'shop', minutes: 5 }]).get('shop')).toBe(15);
  });

  it('rounds an even-count midpoint', () => {
    const medians = computeTypeMedians([
      { type: 'shop', minutes: 40 },
      { type: 'shop', minutes: 45 },
    ]);
    expect(medians.get('shop')).toBe(45);
  });

  it('stores the median across all non-null durations under ALL_TYPES_KEY', () => {
    const medians = computeTypeMedians([
      { type: 'museum', minutes: 120 },
      { type: 'cafe', minutes: 30 },
      { type: 'park', minutes: 60 },
    ]);
    expect(medians.get(ALL_TYPES_KEY)).toBe(60);
  });

  it('has no entry for a type with only null durations', () => {
    const medians = computeTypeMedians([
      { type: 'viewpoint', minutes: null },
      { type: 'cafe', minutes: 30 },
    ]);
    expect(medians.has('viewpoint')).toBe(false);
  });

  it('returns an empty map for all-null input', () => {
    expect(computeTypeMedians([{ type: 'cafe', minutes: null }]).size).toBe(0);
  });
});

describe('resolveDuration', () => {
  const medians = new Map([
    ['museum', 90],
    ['cafe', 45],
    [ALL_TYPES_KEY, 60],
  ]);

  const cases: {
    name: string;
    minutes: number | null;
    type: string;
    expected: { visitMinutes: number; flags: string[] };
  }[] = [
    {
      name: 'known duration passes through unflagged',
      minutes: 75,
      type: 'museum',
      expected: { visitMinutes: 75, flags: [] },
    },
    {
      name: 'null uses the type median and flags the estimate',
      minutes: null,
      type: 'museum',
      expected: { visitMinutes: 90, flags: ['duration-estimated'] },
    },
    {
      name: 'null with an unseen type falls back to the all-types median',
      minutes: null,
      type: 'viewpoint',
      expected: { visitMinutes: 60, flags: ['duration-estimated'] },
    },
  ];

  it.each(cases)('$name', ({ minutes, type, expected }) => {
    expect(resolveDuration(minutes, type, medians)).toEqual(expected);
  });

  it('falls back to 60 when no medians exist at all', () => {
    expect(resolveDuration(null, 'cafe', new Map())).toEqual({
      visitMinutes: 60,
      flags: ['duration-estimated'],
    });
  });
});
