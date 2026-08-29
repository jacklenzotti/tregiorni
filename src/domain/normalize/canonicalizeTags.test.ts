import { describe, expect, it } from 'vitest';
import { canonicalizeTags } from './canonicalizeTags';

describe('canonicalizeTags', () => {
  const cases: { name: string; input: string[]; expected: string[] }[] = [
    { name: 'lowercases', input: ['Foodie'], expected: ['foodie'] },
    { name: 'trims', input: ['  wine  '], expected: ['wine'] },
    { name: 'underscore becomes dash', input: ['local_favorite'], expected: ['local-favorite'] },
    { name: 'whitespace run becomes one dash', input: ['street  food'], expected: ['street-food'] },
    {
      name: 'mixed underscore and space run collapses',
      input: ['local _ favorite'],
      expected: ['local-favorite'],
    },
    {
      name: 'dedupes preserving first-occurrence order',
      input: ['Wine', 'local_favorite', ' wine ', 'LOCAL-FAVORITE', 'gelato'],
      expected: ['wine', 'local-favorite', 'gelato'],
    },
    { name: 'empty input', input: [], expected: [] },
  ];

  it.each(cases)('$name', ({ input, expected }) => {
    expect(canonicalizeTags(input)).toEqual(expected);
  });
});
