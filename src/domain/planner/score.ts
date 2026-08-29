import type { Place } from '../types';

const INTEREST_WEIGHT = 2;
const RATING_SCALE = 5;
const UNVERIFIED_HOURS_PENALTY = 0.5;

export function scorePlace(place: Place, interests: string[]): number {
  const overlap = interests.filter((tag) => place.tags.includes(tag)).length;
  const rating = place.rating / RATING_SCALE;
  const penalty = place.flags.includes('hours-unverified') ? UNVERIFIED_HOURS_PENALTY : 0;
  return overlap * INTEREST_WEIGHT + rating - penalty;
}
