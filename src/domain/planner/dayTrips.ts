import { haversineKm } from '../geo';
import type { Coords, Place } from '../types';
import { hasTrustedCoords } from '../types';

// A neighbour is worth a day trip only if getting there does not become the day.
// At 60 km Venice reaches Burano and Padua, Milan reaches Como and Bellagio,
// Florence reaches Siena, and Rome reaches nothing — its nearest is 147 km.
const DAY_TRIP_RADIUS_KM = 60;

// Three stops a day. A village with one restaurant has to reach further than
// the day-trip radius or there is no trip to plan at all.
const MIN_TRIP_PLACES = 9;

export function citiesWithinReach(places: Place[], city: string): Set<string> {
  const centroids = cityCentroids(places);
  const home = centroids.get(city);
  if (home === undefined) return new Set([city]);
  const counts = cityCounts(places);
  const reachable = new Set<string>();
  let total = 0;
  for (const { name, km } of byDistanceFrom(home, centroids)) {
    if (km > DAY_TRIP_RADIUS_KM && total >= MIN_TRIP_PLACES) break;
    reachable.add(name);
    total += counts.get(name) ?? 0;
  }
  return reachable;
}

// The neighbours a trip actually gains, for display beside the city picker.
export function dayTripCities(places: Place[], city: string): string[] {
  return [...citiesWithinReach(places, city)].filter((c) => c !== city).sort();
}

function byDistanceFrom(
  home: Coords,
  centroids: Map<string, Coords>
): { name: string; km: number }[] {
  return [...centroids]
    .map(([name, coords]) => ({ name, km: haversineKm(home, coords) }))
    .sort((a, b) => a.km - b.km);
}

function cityCounts(places: Place[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const place of places) {
    if (place.aliasOf !== undefined) continue;
    counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
  }
  return counts;
}

function cityCentroids(places: Place[]): Map<string, Coords> {
  const groups = new Map<string, Coords[]>();
  for (const place of places) {
    if (!hasTrustedCoords(place)) continue;
    const group = groups.get(place.city) ?? [];
    group.push(place.coords);
    groups.set(place.city, group);
  }
  return new Map([...groups].map(([city, coords]) => [city, average(coords)]));
}

function average(coords: Coords[]): Coords {
  return {
    lat: coords.reduce((sum, c) => sum + c.lat, 0) / coords.length,
    lon: coords.reduce((sum, c) => sum + c.lon, 0) / coords.length,
  };
}
