import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { RawPlace } from './raw';
import { normalizeAll } from './normalizePlace';

const raws = JSON.parse(
  readFileSync(new URL('../../../data/raw/italy.json', import.meta.url), 'utf-8')
) as RawPlace[];

describe('normalizeAll on the real dataset', () => {
  const places = normalizeAll(raws);

  it('keeps all 103 places, sorted by id', () => {
    expect(places).toHaveLength(103);
    expect(places.map((p) => p.id)).toEqual([...places.map((p) => p.id)].sort());
  });

  it('parses every hours string: no hours-unparsed flags', () => {
    expect(places.filter((p) => p.flags.includes('hours-unparsed'))).toEqual([]);
  });

  it('classifies hours exactly as agreed', () => {
    const kinds = { openAccess: 0, unknown: 0, exact: 0, inferred: 0 };
    for (const p of places) {
      if (p.hours.kind === 'weekly') kinds[p.hours.source] += 1;
      else kinds[p.hours.kind] += 1;
    }
    expect(kinds).toEqual({ openAccess: 6, unknown: 27, exact: 65, inferred: 5 });
  });

  it('resolves exactly one alias pair: Mercato Centrale', () => {
    const aliased = places.filter((p) => p.aliasOf !== undefined);
    expect(aliased.map((p) => [p.id, p.aliasOf])).toEqual([['place_031', 'place_030']]);
  });

  it('flags exactly one suspect coordinate: Brera Antique Market', () => {
    const suspects = places.filter((p) => p.flags.includes('coords-suspect'));
    expect(suspects.map((p) => p.id)).toEqual(['place_059']);
  });

  it('estimates the 9 null durations from type medians', () => {
    const estimated = places.filter((p) => p.flags.includes('duration-estimated'));
    expect(estimated).toHaveLength(9);
    for (const p of estimated) expect(p.visitMinutes).toBeGreaterThanOrEqual(15);
  });

  it('canonicalizes the snake_case tag variant', () => {
    expect(places.some((p) => p.tags.includes('local_favorite'))).toBe(false);
    expect(places.filter((p) => p.tags.includes('local-favorite')).length).toBeGreaterThan(40);
  });

  it('is deterministic', () => {
    expect(normalizeAll(raws)).toEqual(places);
  });
});
