import type { Coords } from '../types';
import { haversineKm } from '../geo';
import { median } from './median';

const OUTLIER_DISTANCE_KM = 30;
const MIN_PLACES_PER_CITY = 3;

interface CityPlace {
  id: string;
  city: string;
  coords: Coords;
}

function groupByCity(places: CityPlace[]): Map<string, CityPlace[]> {
  const byCity = new Map<string, CityPlace[]>();
  for (const place of places) {
    const group = byCity.get(place.city) ?? [];
    group.push(place);
    byCity.set(place.city, group);
  }
  return byCity;
}

export function detectGeoOutliers(places: CityPlace[]): Set<string> {
  const outliers = new Set<string>();
  for (const group of groupByCity(places).values()) {
    if (group.length < MIN_PLACES_PER_CITY) continue;
    const centroid: Coords = {
      lat: median(group.map((p) => p.coords.lat)),
      lon: median(group.map((p) => p.coords.lon)),
    };
    for (const place of group) {
      if (haversineKm(place.coords, centroid) > OUTLIER_DISTANCE_KM) outliers.add(place.id);
    }
  }
  return outliers;
}
