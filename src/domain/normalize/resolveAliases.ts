import type { Coords } from '../types';
import { haversineKm } from '../geo';

const MAX_ALIAS_DISTANCE_KM = 0.05;

const CITY_NAME_FORMS: Record<string, string[]> = {
  florence: ['firenze'],
  rome: ['roma'],
  venice: ['venezia'],
  milan: ['milano'],
};

interface AliasCandidate {
  id: string;
  name: string;
  city: string;
  rating: number;
  coords: Coords;
}

function canonicalName(name: string, city: string): string {
  const cityKey = city.toLowerCase();
  const cityTokens = new Set([cityKey, ...(CITY_NAME_FORMS[cityKey] ?? [])]);
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token !== '' && !cityTokens.has(token))
    .join(' ');
}

function isSameEntity(a: AliasCandidate, b: AliasCandidate): boolean {
  if (haversineKm(a.coords, b.coords) > MAX_ALIAS_DISTANCE_KM) return false;
  return canonicalName(a.name, a.city) === canonicalName(b.name, b.city);
}

function orderByPrimacy(a: AliasCandidate, b: AliasCandidate): [AliasCandidate, AliasCandidate] {
  if (a.rating !== b.rating) return a.rating > b.rating ? [a, b] : [b, a];
  return a.id < b.id ? [a, b] : [b, a];
}

export function resolveAliases(places: AliasCandidate[]): Map<string, string> {
  const aliases = new Map<string, string>();
  places.forEach((a, index) => {
    for (const b of places.slice(index + 1)) {
      if (!isSameEntity(a, b)) continue;
      const [primary, alias] = orderByPrimacy(a, b);
      aliases.set(alias.id, primary.id);
    }
  });
  return aliases;
}
