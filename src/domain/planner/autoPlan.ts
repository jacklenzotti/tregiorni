import type { Itinerary, TripSettings } from '../itinerary/types';
import { DAY_INDEXES } from '../itinerary/types';
import type { Place } from '../types';
import { addBestStop } from './autoFillDay';
import type { PlannerPrefs } from './prefs';
import { PACE_PROFILES } from './prefs';

// One stop per day per round, so a short candidate pool spreads across the trip
// instead of filling day 1 to the cap and starving day 3.
export function autoPlan(
  itinerary: Itinerary,
  settings: TripSettings,
  prefs: PlannerPrefs,
  places: Place[]
): Itinerary {
  const env = { settings, prefs, places };
  const { maxStops } = PACE_PROFILES[prefs.pace];
  let current = itinerary;
  for (let round = 0; round < maxStops; round += 1) {
    for (const day of DAY_INDEXES) {
      if (current.days[day].stops.length >= maxStops) continue;
      current = addBestStop(current, day, env) ?? current;
    }
  }
  return current;
}
