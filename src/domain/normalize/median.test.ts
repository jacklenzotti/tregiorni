import { describe, expect, it } from 'vitest';
import { median } from './median';

describe('median', () => {
  it('returns the middle value of an odd-length list', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values of an even-length list', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('returns NaN for an empty list', () => {
    expect(median([])).toBeNaN();
  });

  it('returns the only element of a single-item list', () => {
    expect(median([7])).toBe(7);
  });
});
