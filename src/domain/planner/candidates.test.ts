import { describe, expect, it } from 'vitest';
import { PLACES } from '../../data/places';
import { addStop } from '../itinerary/ops';
import { emptyItinerary } from '../itinerary/types';
import { eligiblePlaces, MIN_RATING } from './candidates';
import type { PlannerPrefs } from './prefs';
import { defaultPrefs } from './prefs';

const prefs = defaultPrefs();
const settings = { startDay: 4 as const, travelMonth: 6 };

describe('eligiblePlaces on the real dataset', () => {
  it('filters city, aliases, suspect coords, and the rating floor', () => {
    const pool = eligiblePlaces(PLACES, prefs, settings, emptyItinerary());
    expect(pool.length).toBeGreaterThan(20);
    for (const p of pool) {
      expect(p.city).toBe('Rome');
      expect(p.aliasOf).toBeUndefined();
      expect(p.flags).not.toContain('coords-suspect');
      expect(p.rating).toBeGreaterThanOrEqual(MIN_RATING);
    }
    expect(pool.map((p) => p.id)).not.toContain('place_025');
  });

  it('caps price', () => {
    const cheap = eligiblePlaces(PLACES, { ...prefs, maxPrice: 1 }, settings, emptyItinerary());
    for (const p of cheap) expect(p.priceLevel).toBe(1);
  });

  it('excludes out-of-season places for the travel month', () => {
    const florence: PlannerPrefs = { ...prefs, city: 'Florence' };
    const winter = eligiblePlaces(PLACES, florence, { ...settings, travelMonth: 12 }, emptyItinerary());
    expect(winter.map((p) => p.id)).not.toContain('place_035');
  });

  it('treats a used alias as using its canonical twin too', () => {
    const withAlias = addStop(emptyItinerary(), 0, 'place_031');
    const florence: PlannerPrefs = { ...prefs, city: 'Florence' };
    const pool = eligiblePlaces(PLACES, florence, settings, withAlias);
    expect(pool.map((p) => p.id)).not.toContain('place_030');
  });
});
