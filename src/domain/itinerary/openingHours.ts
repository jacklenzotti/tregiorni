import type { Interval, OpeningHours, Weekday, WeeklyHours } from '../types';

export const UNKNOWN_HOURS_WINDOW: Interval = { start: 600, end: 1080 };

const FULL_DAY: Interval = { start: 0, end: 1440 };

function previousWeekday(weekday: Weekday): Weekday {
  return ((weekday + 6) % 7) as Weekday;
}

function spillFromPreviousDay(weekly: WeeklyHours, weekday: Weekday): Interval[] {
  const previous = weekly[previousWeekday(weekday)] ?? [];
  return previous
    .filter((interval) => interval.end > 1440)
    .map((interval) => ({
      start: Math.max(interval.start - 1440, 0),
      end: interval.end - 1440,
    }));
}

export function openIntervalsOn(hours: OpeningHours, weekday: Weekday): Interval[] {
  if (hours.kind === 'openAccess') return [FULL_DAY];
  if (hours.kind === 'unknown') return [UNKNOWN_HOURS_WINDOW];
  const own = hours.weekly[weekday] ?? [];
  const all = [...own, ...spillFromPreviousDay(hours.weekly, weekday)];
  return all.sort((a, b) => a.start - b.start);
}

