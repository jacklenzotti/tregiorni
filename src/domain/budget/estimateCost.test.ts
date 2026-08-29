import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../data/places';
import { makePlace } from '../testSupport/makePlace';
import type { Place } from '../types';
import { estimateCost, formatBand, sumBands, type CostBand } from './estimateCost';

type Level = Place['priceLevel'];

describe('estimateCost', () => {
  const cases: [Place['type'], Level, CostBand][] = [
    ['restaurant', 1, { low: 5, high: 15 }],
    ['cafe', 2, { low: 15, high: 40 }],
    ['experience', 4, { low: 90, high: 200 }],
    ['museum', 1, { low: 0, high: 10 }],
    ['historic_site', 3, { low: 25, high: 45 }],
    ['market', 4, { low: 45, high: 80 }],
    ['neighborhood', 1, { low: 0, high: 0 }],
    ['viewpoint', 3, { low: 0, high: 0 }],
    ['park', 2, { low: 0, high: 0 }],
    ['shop', 4, { low: 0, high: 0 }],
  ];

  it.each(cases)('%s at level %i -> band', (type, priceLevel, expected) => {
    expect(estimateCost(makePlace({ id: 'p', type, priceLevel }))).toEqual(expected);
  });

  it('gives every catalog place a valid band', () => {
    for (const place of CATALOG) {
      const band = estimateCost(place);
      expect(band.low).toBeGreaterThanOrEqual(0);
      expect(band.high).toBeGreaterThanOrEqual(band.low);
    }
  });
});

describe('sumBands', () => {
  it('sums component-wise', () => {
    const bands: CostBand[] = [
      { low: 5, high: 15 },
      { low: 0, high: 10 },
      { low: 0, high: 0 },
    ];
    expect(sumBands(bands)).toEqual({ low: 5, high: 25 });
  });

  it('returns zero for an empty array', () => {
    expect(sumBands([])).toEqual({ low: 0, high: 0 });
  });
});

describe('formatBand', () => {
  const cases: [CostBand, string][] = [
    [{ low: 0, high: 0 }, 'Free'],
    [{ low: 20, high: 20 }, '€20'],
    [{ low: 15, high: 40 }, '€15–40'],
  ];

  it.each(cases)('formats %o as %s', (band, expected) => {
    expect(formatBand(band)).toBe(expected);
  });
});
