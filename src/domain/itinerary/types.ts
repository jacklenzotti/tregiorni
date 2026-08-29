import type { Place, Weekday } from '../types';

export type DayIndex = 0 | 1 | 2;

export const DAY_INDEXES: readonly DayIndex[] = [0, 1, 2];

export interface TripSettings {
  startDay: Weekday;
  travelMonth: number; // 1-12
}

export interface DayPlan {
  stops: string[]; // ordered placeIds — the source of truth for a day
}

export interface Itinerary {
  days: [DayPlan, DayPlan, DayPlan];
}

export type Conflict =
  | 'closed-that-day'
  | 'closed-at-time'
  | 'out-of-season'
  | 'day-overflow'
  | 'long-transfer';

// A day trip is a long transfer by definition; the planner's travel cost already
// keeps it rare. Every other conflict is a hard no. Exhaustive on purpose: a new
// conflict must be classified here before it compiles.
export const CONFLICT_SEVERITY: Record<Conflict, 'blocking' | 'advisory'> = {
  'closed-that-day': 'blocking',
  'closed-at-time': 'blocking',
  'out-of-season': 'blocking',
  'day-overflow': 'blocking',
  'long-transfer': 'advisory',
};

export interface ScheduledStop {
  place: Place;
  start: number;
  end: number;
  travelMinutesFromPrev: number | null; // null = unknown (suspect coordinates)
  conflicts: Conflict[];
}

export function emptyItinerary(): Itinerary {
  return { days: [{ stops: [] }, { stops: [] }, { stops: [] }] };
}

export function weekdayOfDay(settings: TripSettings, day: DayIndex): Weekday {
  return ((settings.startDay + day) % 7) as Weekday;
}

export function allStopIds(itinerary: Itinerary): Set<string> {
  return new Set(itinerary.days.flatMap((d) => d.stops));
}

export function placesById(places: Place[]): Map<string, Place> {
  return new Map(places.map((p) => [p.id, p]));
}

export function resolvePlaces(ids: string[], byId: Map<string, Place>): Place[] {
  return ids.flatMap((id) => {
    const place = byId.get(id);
    return place === undefined ? [] : [place];
  });
}
