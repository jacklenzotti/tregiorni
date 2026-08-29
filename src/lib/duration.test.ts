import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('shows minutes under an hour', () => {
    expect(formatDuration(20)).toBe('20 min');
  });

  it('shows whole hours plainly', () => {
    expect(formatDuration(120)).toBe('2 h');
  });

  it('mixes hours and minutes', () => {
    expect(formatDuration(998)).toBe('16 h 38 min');
  });
});
