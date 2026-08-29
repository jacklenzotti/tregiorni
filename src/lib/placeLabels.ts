import type { Place, PlaceType } from '../domain/types';

export function priceLabel(level: Place['priceLevel']): string {
  return '€'.repeat(level);
}

export function typeLabel(type: PlaceType): string {
  return type.replace('_', ' ');
}

export function placeMeta(place: Place): string {
  return `${typeLabel(place.type)} · ${place.city} · ${priceLabel(place.priceLevel)} · ★ ${place.rating.toFixed(1)}`;
}
