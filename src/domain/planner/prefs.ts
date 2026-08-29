export type Pace = 'relaxed' | 'balanced' | 'packed';

export interface PlannerPrefs {
  city: string;
  interests: string[];
  pace: Pace;
  maxPrice: 1 | 2 | 3 | 4;
}

export function defaultPrefs(): PlannerPrefs {
  return { city: 'Rome', interests: [], pace: 'balanced', maxPrice: 4 };
}

export interface PaceProfile {
  dayEnd: number;
  maxStops: number;
}

export const PACE_PROFILES: Record<Pace, PaceProfile> = {
  relaxed: { dayEnd: 1200, maxStops: 4 },
  balanced: { dayEnd: 1260, maxStops: 6 },
  packed: { dayEnd: 1320, maxStops: 8 },
};
