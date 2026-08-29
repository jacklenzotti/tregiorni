import { haversineKm } from '../geo';
import type { Coords } from '../types';

interface Mode {
  kmh: number;
  overheadMinutes: number;
}

// Door-to-door estimates; the fastest mode wins. Because every mode grows with
// distance, the result never falls as the hop gets longer.
const MODES: Mode[] = [
  { kmh: 4.5, overheadMinutes: 0 }, // walk
  { kmh: 20, overheadMinutes: 10 }, // city transit
  { kmh: 90, overheadMinutes: 60 }, // intercity rail, incl. getting to the station
];

export function travelMinutes(from: Coords, to: Coords): number {
  const km = haversineKm(from, to);
  return Math.round(Math.min(...MODES.map((m) => (km / m.kmh) * 60 + m.overheadMinutes)));
}
