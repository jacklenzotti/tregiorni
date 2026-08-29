import { describe, expect, it } from 'vitest';
import { resolveAliases } from './resolveAliases';
import raw from '../../../data/raw/italy.json';

function place(
  id: string,
  fields: { name: string; city?: string; rating?: number; lat?: number; lon?: number },
) {
  return {
    id,
    name: fields.name,
    city: fields.city ?? 'Rome',
    rating: fields.rating ?? 4,
    coords: { lat: fields.lat ?? 41.9, lon: fields.lon ?? 12.5 },
  };
}

describe('resolveAliases', () => {
  it('aliases the lower-rated of two co-located places with the same name', () => {
    const result = resolveAliases([
      place('a', { name: 'Caffè Greco', rating: 4.5 }),
      place('b', { name: 'Caffè Greco', rating: 4.1 }),
    ]);
    expect(result).toEqual(new Map([['b', 'a']]));
  });

  it('breaks rating ties by aliasing the higher id to the lower id', () => {
    const result = resolveAliases([
      place('b', { name: 'Caffè Greco' }),
      place('a', { name: 'Caffè Greco' }),
    ]);
    expect(result).toEqual(new Map([['b', 'a']]));
  });

  it('ignores same-named places more than 0.05 km apart', () => {
    const result = resolveAliases([
      place('a', { name: 'Caffè Greco', lat: 41.9 }),
      place('b', { name: 'Caffè Greco', lat: 41.901 }),
    ]);
    expect(result.size).toBe(0);
  });

  it('matches within 0.05 km', () => {
    const result = resolveAliases([
      place('a', { name: 'Caffè Greco', rating: 4.5, lat: 41.9 }),
      place('b', { name: 'Caffè Greco', rating: 4.1, lat: 41.9003 }),
    ]);
    expect(result).toEqual(new Map([['b', 'a']]));
  });

  it('ignores city-qualifier tokens and punctuation when comparing names', () => {
    const result = resolveAliases([
      place('a', { name: 'Caffè Greco, Rome', rating: 4.5 }),
      place('b', { name: '  caffè   GRECO! ', rating: 4.1 }),
    ]);
    expect(result).toEqual(new Map([['b', 'a']]));
  });

  it('strips Italian city forms too', () => {
    const result = resolveAliases([
      place('a', { name: 'Mercato Nuovo Firenze', city: 'Florence', rating: 4.5 }),
      place('b', { name: 'Mercato Nuovo, Florence', city: 'Florence', rating: 4.1 }),
    ]);
    expect(result).toEqual(new Map([['b', 'a']]));
  });

  it('does not alias co-located places whose names differ beyond city tokens', () => {
    const result = resolveAliases([
      place('a', { name: 'Trevi Fountain' }),
      place('b', { name: 'Trevi Fountain by Night' }),
    ]);
    expect(result.size).toBe(0);
  });

  describe('real dataset', () => {
    const places = raw.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      rating: p.rating,
      coords: { lat: p.latitude, lon: p.longitude },
    }));
    const result = resolveAliases(places);

    it('aliases place_031 (Mercato Centrale, 4.0) to place_030 (Mercato Centrale Firenze, 4.3)', () => {
      expect(result.get('place_031')).toBe('place_030');
      expect(result.has('place_030')).toBe(false);
    });

    it('finds no other aliases', () => {
      expect(result.size).toBe(1);
    });

    it.each([
      ['place_018', 'place_077'],
      ['place_033', 'place_084'],
      ['place_091', 'place_096'],
      ['place_043', 'place_044'],
    ])('does not link %s and %s', (idA, idB) => {
      expect(result.get(idA)).not.toBe(idB);
      expect(result.get(idB)).not.toBe(idA);
    });
  });
});
