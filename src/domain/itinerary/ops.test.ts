import { describe, expect, it } from 'vitest';
import { addStop, clearDay, moveStop, removeStop } from './ops';
import { emptyItinerary, weekdayOfDay } from './types';

describe('addStop', () => {
  it('appends to the chosen day', () => {
    const it1 = addStop(emptyItinerary(), 0, 'a');
    const it2 = addStop(it1, 0, 'b');
    expect(it2.days[0].stops).toEqual(['a', 'b']);
  });

  it('ignores a place already anywhere in the itinerary', () => {
    const it1 = addStop(emptyItinerary(), 0, 'a');
    expect(addStop(it1, 2, 'a')).toBe(it1);
  });

  it('never mutates its input', () => {
    const before = emptyItinerary();
    addStop(before, 1, 'a');
    expect(before.days[1].stops).toEqual([]);
  });
});

describe('removeStop', () => {
  it('removes only the named stop', () => {
    const it1 = addStop(addStop(emptyItinerary(), 0, 'a'), 0, 'b');
    expect(removeStop(it1, 0, 'a').days[0].stops).toEqual(['b']);
  });

  it('is a no-op when absent from that day', () => {
    const it1 = addStop(emptyItinerary(), 0, 'a');
    expect(removeStop(it1, 1, 'a')).toBe(it1);
  });
});

describe('moveStop', () => {
  const base = addStop(addStop(addStop(emptyItinerary(), 0, 'a'), 0, 'b'), 1, 'c');

  it('moves between days, appending by default', () => {
    const moved = moveStop(base, { from: 0, to: 1, placeId: 'a' });
    expect(moved.days[0].stops).toEqual(['b']);
    expect(moved.days[1].stops).toEqual(['c', 'a']);
  });

  it('inserts at an explicit index', () => {
    const moved = moveStop(base, { from: 0, to: 1, placeId: 'a', index: 0 });
    expect(moved.days[1].stops).toEqual(['a', 'c']);
  });

  it('reorders within the same day', () => {
    const moved = moveStop(base, { from: 0, to: 0, placeId: 'b', index: 0 });
    expect(moved.days[0].stops).toEqual(['b', 'a']);
  });
});

describe('clearDay', () => {
  it('empties one day only', () => {
    const it1 = addStop(addStop(emptyItinerary(), 0, 'a'), 1, 'b');
    const cleared = clearDay(it1, 0);
    expect(cleared.days[0].stops).toEqual([]);
    expect(cleared.days[1].stops).toEqual(['b']);
  });
});

describe('weekdayOfDay', () => {
  it('advances and wraps from the start day', () => {
    expect(weekdayOfDay({ startDay: 4, travelMonth: 6 }, 0)).toBe(4); // Fri
    expect(weekdayOfDay({ startDay: 5, travelMonth: 6 }, 2)).toBe(0); // Sat -> Mon
  });
});
