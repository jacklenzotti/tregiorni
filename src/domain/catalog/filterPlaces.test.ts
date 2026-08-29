import { describe, expect, it } from 'vitest';
import { makePlace } from '../testSupport/makePlace';
import { filterPlaces, topTags } from './filterPlaces';

const places = [
  makePlace({ id: 'a', name: 'Colosseum', city: 'Rome', rating: 4.8, tags: ['historic', 'iconic'] }),
  makePlace({ id: 'b', name: 'Trattoria', city: 'Rome', type: 'restaurant', priceLevel: 3, rating: 4.5, tags: ['food'] }),
  makePlace({ id: 'c', name: 'Duomo', city: 'Florence', rating: 4.8, tags: ['historic'] }),
];

import type { CatalogFilters } from './filterPlaces';

const all: CatalogFilters = { query: '', type: 'all', maxPrice: 4, tags: [] };

describe('filterPlaces', () => {
  it('sorts by rating, then id for determinism', () => {
    expect(filterPlaces(places, all).map((p) => p.id)).toEqual(['a', 'c', 'b']);
  });

  it('matches query against name, city, and tags', () => {
    expect(filterPlaces(places, { ...all, query: 'flor' }).map((p) => p.id)).toEqual(['c']);
    expect(filterPlaces(places, { ...all, query: 'FOOD' }).map((p) => p.id)).toEqual(['b']);
  });

  it('filters by type, price cap, and requires every selected tag', () => {
    expect(filterPlaces(places, { ...all, type: 'restaurant' }).map((p) => p.id)).toEqual(['b']);
    expect(filterPlaces(places, { ...all, maxPrice: 2 }).map((p) => p.id)).toEqual(['a', 'c']);
    expect(filterPlaces(places, { ...all, tags: ['historic', 'iconic'] }).map((p) => p.id)).toEqual(['a']);
  });
});

describe('topTags', () => {
  it('ranks by frequency then alphabetically', () => {
    expect(topTags(places, 2)).toEqual(['historic', 'food']);
  });
});
