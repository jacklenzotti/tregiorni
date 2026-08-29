import type {
  DataFlag,
  Interval,
  OpeningHours,
  PlaceType,
  Weekday,
  WeeklyHours,
} from '../types';
import { ALL_WEEKDAYS } from '../types';

interface Segment {
  days: Weekday[];
  intervals: Interval[];
}

interface DaySpecMatch {
  days: Weekday[];
  rest: string;
}

interface ParsedHours {
  hours: OpeningHours;
  flags: DataFlag[];
}

const DAY_TOKENS: Record<string, Weekday> = {
  mon: 0,
  tue: 1,
  tues: 1,
  wed: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

// Longest-first so `thurs` wins over `thu`; derived so the token table stays the
// single source of truth.
const DAY = `(?:${Object.keys(DAY_TOKENS)
  .sort((a, b) => b.length - a.length)
  .join('|')})`;
const DAY_SPEC_RE = new RegExp(`^(?:(daily)|(${DAY})(?:\\s*-\\s*(${DAY}))?)(?![a-z])`, 'i');
const TIME_24H_RE = /^(\d{1,2}):(\d{2})$/;
const TIME_AMPM_RE = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/i;

const VAGUE_INTERVALS: Record<string, Interval> = {
  'morning only': { start: 480, end: 720 },
  evenings: { start: 1020, end: 1320 },
};

export function parseHours(raw: string | null, type: PlaceType): ParsedHours {
  if (raw === null) return hoursForNull(type);
  const vague = VAGUE_INTERVALS[raw.trim().toLowerCase()];
  if (vague !== undefined) {
    return {
      hours: { kind: 'weekly', weekly: everyDay(vague), source: 'inferred' },
      flags: ['hours-approximated'],
    };
  }
  const weekly = parseWeekly(raw);
  if (weekly === null) return { hours: { kind: 'unknown' }, flags: ['hours-unparsed'] };
  return { hours: { kind: 'weekly', weekly, source: 'exact' }, flags: [] };
}

function hoursForNull(type: PlaceType): ParsedHours {
  if (type === 'neighborhood') return { hours: { kind: 'openAccess' }, flags: [] };
  return { hours: { kind: 'unknown' }, flags: ['hours-unverified'] };
}

function everyDay(interval: Interval): WeeklyHours {
  return Array.from({ length: 7 }, () => [{ ...interval }]);
}

function parseWeekly(raw: string): WeeklyHours | null {
  const chunks = raw.split(',').map((chunk) => chunk.trim());
  if (chunks.some((chunk) => chunk === '')) return null;
  const segments = buildSegments(chunks);
  return segments === null ? null : toWeekly(segments);
}

function buildSegments(chunks: string[]): Segment[] | null {
  let segments: Segment[] = [];
  for (const chunk of chunks) {
    const next = applyChunk(segments, chunk);
    if (next === null) return null;
    segments = next;
  }
  // A day spec whose hours never arrived, e.g. a bare "Mon-Fri".
  if (segments.some((segment) => segment.intervals.length === 0)) return null;
  return segments;
}

function applyChunk(segments: Segment[], chunk: string): Segment[] | null {
  const daySpec = matchDaySpec(chunk);
  return daySpec === null
    ? applyTimeOnlyChunk(segments, chunk)
    : applyDayChunk(segments, daySpec);
}

// A second time range belongs to the days already named, e.g. "Mon 9:00-12:00,
// 15:00-19:00". With no days named yet it applies to the whole week.
function applyTimeOnlyChunk(segments: Segment[], chunk: string): Segment[] | null {
  const interval = parseTimeRange(chunk);
  if (interval === null) return null;
  const current = segments[segments.length - 1];
  if (current === undefined) {
    return [{ days: [...ALL_WEEKDAYS], intervals: [interval] }];
  }
  return [...segments.slice(0, -1), withInterval(current, interval)];
}

function applyDayChunk(segments: Segment[], spec: DaySpecMatch): Segment[] | null {
  const open = openDaySegment(segments);
  const rest = open === null ? segments : segments.slice(0, -1);
  const days = open === null ? [...spec.days] : [...open.days, ...spec.days];
  const target: Segment = { days, intervals: [] };
  if (spec.rest === '') return [...rest, target];
  const interval = parseTimeRange(spec.rest);
  if (interval === null) return null;
  return [...rest, withInterval(target, interval)];
}

// Days keep accumulating until hours arrive, e.g. "Mon, Tue, Wed 9:00-17:00".
function openDaySegment(segments: Segment[]): Segment | null {
  const last = segments[segments.length - 1];
  return last !== undefined && last.intervals.length === 0 ? last : null;
}

function withInterval(segment: Segment, interval: Interval): Segment {
  return { days: segment.days, intervals: [...segment.intervals, interval] };
}

function matchDaySpec(chunk: string): DaySpecMatch | null {
  const match = DAY_SPEC_RE.exec(chunk);
  if (match === null) return null;
  const rest = chunk.slice(match[0].length).trim();
  if (match[1] !== undefined) return { days: [...ALL_WEEKDAYS], rest };
  const start = DAY_TOKENS[(match[2] ?? '').toLowerCase()];
  if (start === undefined) return null;
  const endToken = match[3]?.toLowerCase();
  if (endToken === undefined) return { days: [start], rest };
  const end = DAY_TOKENS[endToken];
  if (end === undefined) return null;
  return { days: daySpan(start, end), rest };
}

function daySpan(start: Weekday, end: Weekday): Weekday[] {
  const days: Weekday[] = [start];
  let day = start;
  while (day !== end) {
    day = ((day + 1) % 7) as Weekday;
    days.push(day);
  }
  return days;
}

function parseTimeRange(text: string): Interval | null {
  const match = /^([^-]+)-([^-]+)$/.exec(text);
  if (match === null) return null;
  const start = parseTime((match[1] ?? '').trim());
  const rawEnd = parseTime((match[2] ?? '').trim());
  if (start === null || rawEnd === null) return null;
  const end = rawEnd <= start ? rawEnd + 1440 : rawEnd;
  return { start, end };
}

function parseTime(text: string): number | null {
  const ampm = TIME_AMPM_RE.exec(text);
  if (ampm !== null) return timeFromAmPm(ampm);
  const h24 = TIME_24H_RE.exec(text);
  if (h24 !== null) return timeFrom24h(h24);
  return null;
}

function timeFrom24h(match: RegExpExecArray): number | null {
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59) return null;
  if (hours > 24 || (hours === 24 && minutes > 0)) return null;
  return hours * 60 + minutes;
}

function timeFromAmPm(match: RegExpExecArray): number | null {
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  const isPm = match[3]?.toLowerCase() === 'pm';
  return (hours % 12) * 60 + minutes + (isPm ? 720 : 0);
}

function toWeekly(segments: Segment[]): WeeklyHours {
  const weekly: WeeklyHours = Array.from({ length: 7 }, () => []);
  for (const segment of segments) {
    for (const day of segment.days) {
      weekly[day]?.push(...segment.intervals.map((interval) => ({ ...interval })));
    }
  }
  for (const day of weekly) day.sort((a, b) => a.start - b.start);
  return weekly;
}
