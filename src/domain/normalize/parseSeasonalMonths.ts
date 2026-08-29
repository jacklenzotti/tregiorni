import { MONTH_NAMES } from '../types';

const ALL_MONTHS = MONTH_NAMES.map((_, index) => index + 1);

// Sentence-initial only: "Open April-October only" states the place is seasonal,
// while "Rooftop open May-September only" describes a sub-feature and stays a note.
const OPEN_RANGE = /(?:^|[.!?]\s+)open\s+([a-z]+)\s*[-–]\s*([a-z]+)\s+only\b/i;
const CLOSED_RANGE = /(?:^|[.!?]\s+)closed\s+([a-z]+)\s*[-–]\s*([a-z]+)\b/i;
const LEADING_MONTH_ONLY = /^\s*([a-z]+)\s+only\b/i;

export function parseSeasonalMonths(note: string | null): number[] | null {
  if (note === null) return null;
  return openRange(note) ?? closedRange(note) ?? leadingSingleMonth(note);
}

function openRange(note: string): number[] | null {
  const match = OPEN_RANGE.exec(note);
  return match ? expandRange(match[1] ?? '', match[2] ?? '') : null;
}

function closedRange(note: string): number[] | null {
  const match = CLOSED_RANGE.exec(note);
  const closed = match ? expandRange(match[1] ?? '', match[2] ?? '') : null;
  return closed ? ALL_MONTHS.filter((month) => !closed.includes(month)) : null;
}

function leadingSingleMonth(note: string): number[] | null {
  const match = LEADING_MONTH_ONLY.exec(note);
  const month = match ? monthNumber(match[1] ?? '') : null;
  return month === null ? null : [month];
}

function expandRange(startName: string, endName: string): number[] | null {
  const start = monthNumber(startName);
  const end = monthNumber(endName);
  if (start === null || end === null) return null;
  const months = [start];
  let current = start;
  while (current !== end) {
    current = current === 12 ? 1 : current + 1;
    months.push(current);
  }
  return months;
}

function monthNumber(name: string): number | null {
  const lower = name.toLowerCase();
  const index = MONTH_NAMES.findIndex(
    (month) => month.toLowerCase() === lower || month.slice(0, 3).toLowerCase() === lower,
  );
  return index === -1 ? null : index + 1;
}
