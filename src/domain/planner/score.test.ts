import { describe, expect, it } from 'vitest';
import { makePlace } from '../testSupport/makePlace';
import { scorePlace } from './score';

describe('scorePlace', () => {
  it('lets interest overlap dominate rating', () => {
    const onInterest = makePlace({ id: 'a', rating: 3.5, tags: ['food'] });
    const offInterest = makePlace({ id: 'b', rating: 5.0, tags: ['historic'] });
    expect(scorePlace(onInterest, ['food'])).toBeGreaterThan(scorePlace(offInterest, ['food']));
  });

  it('breaks ties by rating when interests match equally', () => {
    const better = makePlace({ id: 'a', rating: 4.8, tags: ['food'] });
    const worse = makePlace({ id: 'b', rating: 4.2, tags: ['food'] });
    expect(scorePlace(better, ['food'])).toBeGreaterThan(scorePlace(worse, ['food']));
  });

  it('penalizes unverified hours', () => {
    const verified = makePlace({ id: 'a', rating: 4.5 });
    const unverified = makePlace({ id: 'b', rating: 4.5, flags: ['hours-unverified'] });
    expect(scorePlace(verified, [])).toBeGreaterThan(scorePlace(unverified, []));
  });
});
