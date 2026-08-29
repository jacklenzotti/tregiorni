import type { Place, PlaceType } from '../types';

export interface CatalogFilters {
  query: string;
  type: PlaceType | 'all';
  maxPrice: 1 | 2 | 3 | 4;
  tags: string[];
}

export function filterPlaces(places: Place[], filters: CatalogFilters): Place[] {
  const query = filters.query.trim().toLowerCase();
  return places
    .filter(
      (p) =>
        matchesQuery(p, query) &&
        (filters.type === 'all' || p.type === filters.type) &&
        p.priceLevel <= filters.maxPrice &&
        filters.tags.every((tag) => p.tags.includes(tag))
    )
    .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}

export function topTags(places: Place[], count: number): string[] {
  const totals = new Map<string, number>();
  for (const place of places) {
    for (const tag of place.tags) totals.set(tag, (totals.get(tag) ?? 0) + 1);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([tag]) => tag);
}

export function distinctTypes(places: Place[]): PlaceType[] {
  return [...new Set(places.map((p) => p.type))].sort();
}

export function placeCountsByCity(places: Place[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const place of places) counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
  return counts;
}

function matchesQuery(place: Place, query: string): boolean {
  if (query === '') return true;
  return `${place.name} ${place.city} ${place.tags.join(' ')}`.toLowerCase().includes(query);
}
