import type { Interval, OpeningHours, Place, Weekday } from '../types';

export { placesById } from '../itinerary/types';

export function weeklyHours(days: Weekday[], intervals: Interval[]): OpeningHours {
  const weekly: Interval[][] = Array.from({ length: 7 }, () => []);
  for (const day of days) weekly[day] = intervals.map((i) => ({ ...i }));
  return { kind: 'weekly', weekly, source: 'exact' };
}

export function makePlace(overrides: Partial<Place> & { id: string }): Place {
  return {
    name: overrides.id,
    type: 'museum',
    city: 'Rome',
    region: 'Lazio',
    neighborhood: null,
    description: '',
    coords: { lat: 41.9, lon: 12.49 },
    hours: { kind: 'openAccess' },
    visitMinutes: 60,
    priceLevel: 2,
    rating: 4.0,
    tags: [],
    openMonths: null,
    seasonalNote: null,
    bookingRequired: false,
    flags: [],
    ...overrides,
  };
}
