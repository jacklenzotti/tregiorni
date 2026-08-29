import { describe, expect, it } from 'vitest';
import { toggle } from './toggle';

describe('toggle', () => {
  it('adds an item that is absent', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an item that is present', () => {
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('returns a new array without mutating the input', () => {
    const input = ['a'];
    expect(toggle(input, 'b')).not.toBe(input);
    expect(toggle(input, 'a')).not.toBe(input);
    expect(input).toEqual(['a']);
  });
});
