import { isInSeason } from '../itinerary/scheduleDay';
import type { Itinerary, TripSettings } from '../itinerary/types';
import { allStopIds } from '../itinerary/types';
import type { Place } from '../types';
import { hasTrustedCoords } from '../types';
import { citiesWithinReach } from './dayTrips';
import type { PlannerPrefs } from './prefs';

export const MIN_RATING = 3.5; // an empty slot beats a stop the planner wouldn't defend

export function eligiblePlaces(
  places: Place[],
  prefs: PlannerPrefs,
  settings: TripSettings,
  itinerary: Itinerary
): Place[] {
  const used = usedCanonicalIds(places, itinerary);
  const reachable = citiesWithinReach(places, prefs.city);
  return places.filter(
    (p) =>
      reachable.has(p.city) &&
      p.aliasOf === undefined &&
      hasTrustedCoords(p) &&
      p.priceLevel <= prefs.maxPrice &&
      p.rating >= MIN_RATING &&
      isInSeason(p, settings.travelMonth) &&
      !used.has(p.id)
  );
}

function usedCanonicalIds(places: Place[], itinerary: Itinerary): Set<string> {
  const canonicalOf = new Map(
    places.filter((p) => p.aliasOf !== undefined).map((p) => [p.id, p.aliasOf as string])
  );
  return new Set([...allStopIds(itinerary)].map((id) => canonicalOf.get(id) ?? id));
}
