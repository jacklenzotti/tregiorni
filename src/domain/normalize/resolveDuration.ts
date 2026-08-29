import type { DataFlag } from '../types';
import { median } from './median';

export const ALL_TYPES_KEY = '*';

const DEFAULT_MINUTES = 60;

export function computeTypeMedians(
  durations: { type: string; minutes: number | null }[],
): Map<string, number> {
  const byType = new Map<string, number[]>();
  const all: number[] = [];
  for (const { type, minutes } of durations) {
    if (minutes === null) continue;
    const values = byType.get(type) ?? [];
    values.push(minutes);
    byType.set(type, values);
    all.push(minutes);
  }
  const medians = new Map<string, number>();
  for (const [type, values] of byType) {
    medians.set(type, roundToQuarterHour(median(values)));
  }
  if (all.length > 0) medians.set(ALL_TYPES_KEY, roundToQuarterHour(median(all)));
  return medians;
}

export function resolveDuration(
  minutes: number | null,
  type: string,
  medians: Map<string, number>,
): { visitMinutes: number; flags: DataFlag[] } {
  if (minutes !== null) return { visitMinutes: minutes, flags: [] };
  const estimate = medians.get(type) ?? medians.get(ALL_TYPES_KEY) ?? DEFAULT_MINUTES;
  return { visitMinutes: estimate, flags: ['duration-estimated'] };
}

function roundToQuarterHour(minutes: number): number {
  return Math.max(15, Math.round(minutes / 15) * 15);
}
