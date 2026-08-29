import { describe, expect, it } from 'vitest';
import { formatMinutes } from './time';

describe('formatMinutes', () => {
  it('formats whole hours', () => {
    expect(formatMinutes(540)).toBe('9:00');
  });

  it('pads minutes', () => {
    expect(formatMinutes(605)).toBe('10:05');
  });

  it('wraps past-midnight times back onto the clock', () => {
    expect(formatMinutes(1500)).toBe('1:00');
  });
});
