import { describe, expect, it } from 'vitest';
import { ALL_WEEKDAYS } from '../types';
import { makePlace, weeklyHours } from '../testSupport/makePlace';
import { scheduleDay } from './scheduleDay';
import type { TripSettings } from './types';

const monday: TripSettings = { startDay: 0, travelMonth: 6 };
const allWeek = [...ALL_WEEKDAYS];
const rome = { lat: 41.9, lon: 12.49 };
const kmEast = (km: number) => ({ lat: rome.lat, lon: rome.lon + km / 82.9 });

describe('scheduleDay', () => {
  it('runs stops back to back from 9:00 with travel gaps', () => {
    const a = makePlace({ id: 'a', coords: rome, visitMinutes: 60 });
    const b = makePlace({ id: 'b', coords: kmEast(1.5), visitMinutes: 30 });
    const [s1, s2] = scheduleDay([a, b], monday, 0);
    expect(s1).toMatchObject({ start: 540, end: 600, travelMinutesFromPrev: 0 });
    expect(s2).toMatchObject({ start: 614, end: 644, travelMinutesFromPrev: 14 });
  });

  it('waits for opening without flagging a conflict', () => {
    const lateMuseum = makePlace({ id: 'm', hours: weeklyHours(allWeek, [{ start: 660, end: 1080 }]) });
    const [stop] = scheduleDay([lateMuseum], monday, 0);
    expect(stop).toMatchObject({ start: 660, conflicts: [] });
  });

  it('flags closed-that-day when the weekday has no intervals', () => {
    const tueSun = makePlace({
      id: 'm',
      hours: weeklyHours([1, 2, 3, 4, 5, 6], [{ start: 540, end: 1080 }]),
    });
    const [stop] = scheduleDay([tueSun], monday, 0);
    expect(stop?.conflicts).toEqual(['closed-that-day']);
    expect(stop?.start).toBe(540);
  });

  it('flags closed-at-time when arrival is past the last fitting window', () => {
    const early = makePlace({ id: 'e', hours: weeklyHours(allWeek, [{ start: 480, end: 600 }]) });
    const blocker = makePlace({ id: 'b', coords: rome, visitMinutes: 120 });
    const [, stop] = scheduleDay([blocker, early], monday, 0);
    expect(stop?.conflicts).toEqual(['closed-at-time']);
  });

  it('refuses to seat when almost no window remains before close', () => {
    const cafe = makePlace({
      id: 'c',
      type: 'cafe',
      visitMinutes: 60,
      hours: weeklyHours(allWeek, [{ start: 480, end: 840 }]),
    });
    const blocker = makePlace({ id: 'b', coords: rome, visitMinutes: 299 });
    const [, stop] = scheduleDay([blocker, cafe], monday, 0);
    expect(stop?.conflicts).toEqual(['closed-at-time']);
  });

  it('prefers a later window that holds the whole meal over overrunning lunch', () => {
    const restaurant = makePlace({
      id: 'r',
      type: 'restaurant',
      visitMinutes: 90,
      hours: weeklyHours(allWeek, [
        { start: 750, end: 840 },
        { start: 1140, end: 1320 },
      ]),
    });
    const blocker = makePlace({ id: 'b', coords: rome, visitMinutes: 260 });
    const [, stop] = scheduleDay([blocker, restaurant], monday, 0);
    expect(stop).toMatchObject({ start: 1140, end: 1230, conflicts: [] });
  });

  it('seats a restaurant whose meal outlasts the service window', () => {
    const francescana = makePlace({
      id: 'r',
      type: 'restaurant',
      visitMinutes: 240,
      hours: weeklyHours(allWeek, [
        { start: 750, end: 840 },
        { start: 1200, end: 1320 },
      ]),
    });
    const [stop] = scheduleDay([francescana], monday, 0);
    expect(stop).toMatchObject({ start: 750, end: 990, conflicts: [] });
  });

  it('still flags a restaurant when arrival is past the last seating', () => {
    const dinner = makePlace({
      id: 'r',
      type: 'restaurant',
      hours: weeklyHours(allWeek, [{ start: 1200, end: 1320 }]),
    });
    const blocker = makePlace({ id: 'b', coords: rome, visitMinutes: 800 });
    const [, stop] = scheduleDay([blocker, dinner], monday, 0);
    expect(stop?.conflicts).toContain('closed-at-time');
  });

  it('keeps the strict whole-visit rule for non-seated types', () => {
    const museum = makePlace({
      id: 'm',
      visitMinutes: 240,
      hours: weeklyHours(allWeek, [{ start: 750, end: 840 }]),
    });
    const [stop] = scheduleDay([museum], monday, 0);
    expect(stop?.conflicts).toEqual(['closed-at-time']);
  });

  it('flags out-of-season from openMonths and the travel month', () => {
    const seasonal = makePlace({ id: 's', openMonths: [4, 5, 6, 7, 8, 9, 10] });
    const [stop] = scheduleDay([seasonal], { startDay: 0, travelMonth: 12 }, 0);
    expect(stop?.conflicts).toEqual(['out-of-season']);
  });

  it('flags day-overflow past 23:00', () => {
    const marathon = makePlace({ id: 'm', visitMinutes: 900 });
    const [stop] = scheduleDay([marathon], monday, 0);
    expect(stop?.conflicts).toEqual(['day-overflow']);
  });

  it('flags long-transfer on intercity hops', () => {
    const a = makePlace({ id: 'a', coords: rome });
    const farAway = makePlace({ id: 'b', coords: kmEast(50) });
    const [, stop] = scheduleDay([a, farAway], monday, 0);
    expect(stop?.conflicts).toEqual(['long-transfer']);
    expect(stop?.travelMinutesFromPrev).toBeGreaterThan(90);
  });

  it('schedules unknown hours only inside the conservative window', () => {
    const mystery = makePlace({ id: 'u', hours: { kind: 'unknown' } });
    const [stop] = scheduleDay([mystery], monday, 0);
    expect(stop).toMatchObject({ start: 600, conflicts: [] });
  });

  it('reports suspect-coordinate travel as unknown and keeps the previous anchor', () => {
    const a = makePlace({ id: 'a', coords: rome });
    const bad = makePlace({ id: 'bad', coords: kmEast(150), flags: ['coords-suspect'] });
    const c = makePlace({ id: 'c', coords: kmEast(1.5) });
    const [, s2, s3] = scheduleDay([a, bad, c], monday, 0);
    expect(s2?.travelMinutesFromPrev).toBeNull();
    expect(s3?.travelMinutesFromPrev).toBe(14);
  });

  it('uses the trip start day to resolve weekday-specific hours per day index', () => {
    const satOnly = makePlace({ id: 's', hours: weeklyHours([5], [{ start: 540, end: 1080 }]) });
    const fridayStart: TripSettings = { startDay: 4, travelMonth: 6 };
    expect(scheduleDay([satOnly], fridayStart, 0)[0]?.conflicts).toEqual(['closed-that-day']);
    expect(scheduleDay([satOnly], fridayStart, 1)[0]?.conflicts).toEqual([]);
  });
});
