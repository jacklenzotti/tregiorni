import { placesById } from '../domain/itinerary/types';
import type { Place } from '../domain/types';
import placesJson from './places.json';

export const PLACES = placesJson as unknown as Place[];

export const CATALOG = PLACES.filter((p) => p.aliasOf === undefined);

export const PLACES_BY_ID = placesById(PLACES);
