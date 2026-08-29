import type { Interval, Place, Weekday } from '../types';
import { hasTrustedCoords } from '../types';
import { openIntervalsOn } from './openingHours';
import { travelMinutes } from './travel';
import type { Conflict, DayIndex, Itinerary, ScheduledStop, TripSettings } from './types';
import { resolvePlaces, weekdayOfDay } from './types';

export const DAY_START = 540; // 9:00
export const DAY_END = 1380; // 23:00
const LONG_TRANSFER_MINUTES = 90;

export function scheduleDay(
  stops: Place[],
  settings: TripSettings,
  day: DayIndex
): ScheduledStop[] {
  const weekday = weekdayOfDay(settings, day);
  const scheduled: ScheduledStop[] = [];
  let cursor = DAY_START;
  let previous: Place | null = null;
  for (const place of stops) {
    const travel = travelBetween(previous, place);
    const stop = scheduleStop({ place, weekday, arrival: cursor + (travel ?? 0), travel }, settings);
    scheduled.push(stop);
    cursor = stop.end;
    if (hasTrustedCoords(place)) previous = place;
  }
  return scheduled;
}

export function scheduleItineraryDay(
  itinerary: Itinerary,
  day: DayIndex,
  byId: Map<string, Place>,
  settings: TripSettings
): ScheduledStop[] {
  return scheduleDay(resolvePlaces(itinerary.days[day].stops, byId), settings, day);
}

interface StopContext {
  place: Place;
  weekday: Weekday;
  arrival: number;
  travel: number | null;
}

function scheduleStop(ctx: StopContext, settings: TripSettings): ScheduledStop {
  const { place, weekday, arrival, travel } = ctx;
  const { start, conflicts } = fitToOpenHours(place, weekday, arrival);
  const end = start + place.visitMinutes;
  if (!isInSeason(place, settings.travelMonth)) conflicts.push('out-of-season');
  if (end > DAY_END) conflicts.push('day-overflow');
  if (travel !== null && travel > LONG_TRANSFER_MINUTES) conflicts.push('long-transfer');
  return { place, start, end, travelMinutesFromPrev: travel, conflicts };
}

// Restaurant/cafe hours are seating windows: prefer a window that holds the
// whole visit; otherwise seat where enough of the window remains before close.
const SEATED_TYPES: readonly Place['type'][] = ['restaurant', 'cafe'];
const MIN_SEATING_MINUTES = 60;

export function isSeated(place: Place): boolean {
  return SEATED_TYPES.includes(place.type);
}

export function isInSeason(place: Place, month: number): boolean {
  return place.openMonths === null || place.openMonths.includes(month);
}

function fitToOpenHours(
  place: Place,
  weekday: Weekday,
  arrival: number
): { start: number; conflicts: Conflict[] } {
  const intervals = openIntervalsOn(place.hours, weekday);
  if (intervals.length === 0) return { start: arrival, conflicts: ['closed-that-day'] };
  const fitting =
    intervals.find((i) => containsVisit(i, arrival, place.visitMinutes)) ??
    seatingFallback(intervals, arrival, place);
  if (fitting === undefined) return { start: arrival, conflicts: ['closed-at-time'] };
  return { start: Math.max(arrival, fitting.start), conflicts: [] };
}

function containsVisit(interval: Interval, arrival: number, visitMinutes: number): boolean {
  return Math.max(arrival, interval.start) + visitMinutes <= interval.end;
}

function seatingFallback(
  intervals: Interval[],
  arrival: number,
  place: Place
): Interval | undefined {
  if (!isSeated(place)) return undefined;
  const needed = Math.min(place.visitMinutes, MIN_SEATING_MINUTES);
  return intervals.find((i) => i.end - Math.max(arrival, i.start) >= needed);
}

// null = unknowable, not free: the previous anchor stays put and the UI says so.
function travelBetween(previous: Place | null, place: Place): number | null {
  if (!hasTrustedCoords(place)) return null;
  if (previous === null) return 0;
  return travelMinutes(previous.coords, place.coords);
}
