import { describe, expect, it } from 'vitest';
import { PLACES } from '../../data/places';
import { addStop } from '../itinerary/ops';
import { openIntervalsOn } from '../itinerary/openingHours';
import { scheduleDay } from '../itinerary/scheduleDay';
import type { DayIndex, Itinerary, TripSettings } from '../itinerary/types';
import { DAY_INDEXES, emptyItinerary, weekdayOfDay } from '../itinerary/types';
import type { Interval, Place } from '../types';
import { ALL_WEEKDAYS } from '../types';
import { makePlace, placesById, weeklyHours } from '../testSupport/makePlace';
import { autoFillDay } from './autoFillDay';
import { autoPlan } from './autoPlan';
import type { PlannerPrefs } from './prefs';

const settings: TripSettings = { startDay: 4, travelMonth: 6 };
const prefs: PlannerPrefs = { city: 'Rome', interests: ['historic', 'food'], pace: 'balanced', maxPrice: 3 };
const byId = placesById(PLACES);

function schedules(itinerary: Itinerary) {
  return DAY_INDEXES.map((day) =>
    scheduleDay(
      itinerary.days[day].stops.map((id) => byId.get(id) as Place),
      settings,
      day
    )
  );
}

describe('autoPlan on the real dataset', () => {
  const plan = autoPlan(emptyItinerary(), settings, prefs, PLACES);

  it('fills three days without conflicts', () => {
    for (const day of schedules(plan)) {
      expect(day.length).toBeGreaterThan(2);
      for (const stop of day) expect(stop.conflicts).toEqual([]);
    }
  });

  it('never schedules a place twice or uses an alias', () => {
    const ids = plan.days.flatMap((d) => d.stops);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(byId.get(id)?.aliasOf).toBeUndefined();
  });

  it('stays in the chosen city and under the price cap', () => {
    for (const id of plan.days.flatMap((d) => d.stops)) {
      const place = byId.get(id) as Place;
      expect(place.city).toBe('Rome');
      expect(place.priceLevel).toBeLessThanOrEqual(3);
    }
  });

  it('is deterministic', () => {
    expect(autoPlan(emptyItinerary(), settings, prefs, PLACES)).toEqual(plan);
  });

  it('starts every restaurant inside a service window, contained or with an hour before close', () => {
    const restaurantStops = schedules(plan)
      .flatMap((day, dayIndex) =>
        day.filter((s) => s.place.type === 'restaurant').map((s) => ({ stop: s, dayIndex }))
      );
    expect(restaurantStops.length).toBeGreaterThan(0);
    for (const { stop, dayIndex } of restaurantStops) {
      const weekday = weekdayOfDay(settings, DAY_INDEXES[dayIndex] as DayIndex);
      const window = openIntervalsOn(stop.place.hours, weekday).find(
        (i) => stop.start >= i.start && stop.start < i.end
      );
      expect(window).toBeDefined();
      const w = window as Interval;
      expect(stop.end <= w.end || w.end - stop.start >= 60).toBe(true);
    }
  });

  it('never recommends places rated under 3.5 (the Hard Rock rule)', () => {
    const generous = autoPlan(emptyItinerary(), settings, { ...prefs, maxPrice: 4 }, PLACES);
    expect(generous.days.every((d) => d.stops.length > 0)).toBe(true);
    for (const id of generous.days.flatMap((d) => d.stops)) {
      expect((byId.get(id) as Place).rating).toBeGreaterThanOrEqual(3.5);
    }
  });

  it('respects seasonal closures for the travel month', () => {
    const december: TripSettings = { startDay: 4, travelMonth: 12 };
    const florence: PlannerPrefs = { ...prefs, city: 'Florence', interests: ['wine', 'outdoors'] };
    const winter = autoPlan(emptyItinerary(), december, florence, PLACES);
    expect(winter.days.every((d) => d.stops.length > 0)).toBe(true);
    for (const id of winter.days.flatMap((d) => d.stops)) {
      const place = byId.get(id) as Place;
      expect(place.openMonths === null || place.openMonths.includes(12)).toBe(true);
    }
  });

  it('fills every day even when all eligible places open after 9:45', () => {
    const budget: PlannerPrefs = { city: 'Rome', interests: [], pace: 'relaxed', maxPrice: 1 };
    const thrifty = autoPlan(emptyItinerary(), settings, budget, PLACES);
    expect(thrifty.days.every((d) => d.stops.length > 0)).toBe(true);
  });
});

describe('autoFillDay', () => {
  it('keeps stops the user already placed', () => {
    const seeded = addStop(emptyItinerary(), 0, 'place_001');
    const filled = autoFillDay(seeded, 0, { settings, prefs, places: PLACES });
    expect(filled.days[0].stops).toContain('place_001');
    expect(filled.days[0].stops.length).toBeGreaterThan(1);
  });

  it('fills only the requested day', () => {
    const filled = autoFillDay(emptyItinerary(), 1, { settings, prefs, places: PLACES });
    expect(filled.days[0].stops).toEqual([]);
    expect(filled.days[1].stops.length).toBeGreaterThan(0);
    expect(filled.days[2].stops).toEqual([]);
  });
});

describe('autoFillDay conflict severity', () => {
  const anyDay = [...ALL_WEEKDAYS];
  const testPrefs: PlannerPrefs = { ...prefs, city: 'Testville', interests: [] };
  const local = (id: string, extra: Partial<Place> = {}) =>
    makePlace({ id, city: 'Testville', rating: 4.5, visitMinutes: 60, ...extra });

  it('accepts an advisory conflict but rejects a blocking one', () => {
    const weekday = weekdayOfDay(settings, 0);
    const anchor = local('anchor');
    const far = local('far', { rating: 4, coords: { lat: 43.0, lon: 12.49 } });
    const closed = local('closed', {
      rating: 5,
      hours: weeklyHours(anyDay.filter((d) => d !== weekday), [{ start: 540, end: 1080 }]),
    });
    const seeded = addStop(emptyItinerary(), 0, 'anchor');
    const filled = autoFillDay(seeded, 0, {
      settings,
      prefs: testPrefs,
      places: [anchor, closed, far],
    });
    expect(filled.days[0].stops).toEqual(['anchor', 'far']);
    const day = scheduleDay([anchor, far], settings, 0);
    expect(day[1]?.conflicts).toEqual(['long-transfer']);
  });

  it('rejects a stop that would leave a gap longer than MAX_WAIT', () => {
    const anchor = local('anchor');
    const late = local('late', {
      rating: 5,
      hours: weeklyHours(anyDay, [{ start: 900, end: 1080 }]),
    });
    const soon = local('soon', {
      rating: 4,
      hours: weeklyHours(anyDay, [{ start: 630, end: 1080 }]),
    });
    const seeded = addStop(emptyItinerary(), 0, 'anchor');
    const filled = autoFillDay(seeded, 0, {
      settings,
      prefs: testPrefs,
      places: [anchor, late, soon],
    });
    expect(filled.days[0].stops).toEqual(['anchor', 'soon']);
  });
});

describe('planner day shape', () => {
  const anyDay = [...ALL_WEEKDAYS];
  const local = (id: string, extra: Partial<Place> = {}) =>
    makePlace({ id, city: 'Testville', rating: 4.5, visitMinutes: 60, ...extra });

  it('spreads a short pool across all three days instead of starving day 3', () => {
    const pool = Array.from({ length: 6 }, (_, i) => local(`p${i}`));
    const testPrefs: PlannerPrefs = { ...prefs, city: 'Testville', interests: [] };
    const plan = autoPlan(emptyItinerary(), settings, testPrefs, pool);
    for (const day of DAY_INDEXES) expect(plan.days[day].stops.length).toBeGreaterThan(0);
  });

  it('uses the chosen city before reaching for a neighbour', () => {
    const home = local('home', { rating: 3.6 });
    const neighbour = local('neighbour', { city: 'Nearby', rating: 5 });
    const testPrefs: PlannerPrefs = { ...prefs, city: 'Testville', interests: [] };
    const filled = autoFillDay(emptyItinerary(), 0, {
      settings,
      prefs: testPrefs,
      places: [neighbour, home],
    });
    expect(filled.days[0].stops[0]).toBe('home');
  });

  it('does not open a day with an evening-only place when a morning one fits', () => {
    const evening = local('evening', {
      rating: 5,
      hours: weeklyHours(anyDay, [{ start: 1020, end: 1320 }]),
    });
    const morning = local('morning', {
      rating: 4,
      hours: weeklyHours(anyDay, [{ start: 540, end: 1080 }]),
    });
    const testPrefs: PlannerPrefs = { ...prefs, city: 'Testville', interests: [] };
    const filled = autoFillDay(emptyItinerary(), 0, {
      settings,
      prefs: testPrefs,
      places: [evening, morning],
    });
    expect(filled.days[0].stops[0]).toBe('morning');
  });
});
