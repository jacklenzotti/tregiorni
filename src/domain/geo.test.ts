import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm({ lat: 41.9, lon: 12.5 }, { lat: 41.9, lon: 12.5 })).toBe(0);
  });

  it('measures one degree of latitude at the equator as ~111.19 km', () => {
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.195, 2);
  });

  it('measures one degree of longitude at the equator as ~111.19 km', () => {
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.195, 2);
  });

  it('measures Rome to Milan as ~477 km', () => {
    const rome = { lat: 41.9028, lon: 12.4964 };
    const milan = { lat: 45.4642, lon: 9.19 };
    expect(haversineKm(rome, milan)).toBeCloseTo(476.88, 1);
  });

  it('is symmetric', () => {
    const a = { lat: 43.7767, lon: 11.2535 };
    const b = { lat: 45.4341, lon: 12.339 };
    expect(haversineKm(a, b)).toBe(haversineKm(b, a));
  });
});
