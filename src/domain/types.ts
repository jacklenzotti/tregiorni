export const PLACE_TYPES = [
  'restaurant',
  'cafe',
  'museum',
  'historic_site',
  'market',
  'experience',
  'viewpoint',
  'neighborhood',
  'park',
  'shop',
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Monday = 0

export const ALL_WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface Interval {
  start: number; // minutes from midnight
  end: number; // may exceed 1440 for past-midnight closes
}

export type WeeklyHours = Interval[][]; // index 0=Mon..6=Sun; [] = closed that day

export type OpeningHours =
  | { kind: 'openAccess' }
  | { kind: 'unknown' }
  | { kind: 'weekly'; weekly: WeeklyHours; source: 'exact' | 'inferred' };

export type DataFlag =
  | 'hours-unverified'
  | 'hours-approximated'
  | 'hours-unparsed'
  | 'duration-estimated'
  | 'booking-unknown'
  | 'coords-suspect'
  | 'alias';

export interface Coords {
  lat: number;
  lon: number;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  city: string;
  region: string;
  neighborhood: string | null;
  description: string;
  coords: Coords;
  hours: OpeningHours;
  visitMinutes: number;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number;
  tags: string[];
  openMonths: number[] | null; // 1-12; null = year-round or unknown
  seasonalNote: string | null;
  bookingRequired: boolean | null;
  flags: DataFlag[];
  aliasOf?: string;
}

// The one answer to "can I do travel math on this place?" — map, scheduler,
// planner and route optimizer must agree.
export function hasTrustedCoords(place: Place | undefined): boolean {
  return place !== undefined && !place.flags.includes('coords-suspect');
}
