import { describe, expect, it } from 'vitest';
import { appReducer, initialAppState } from './appReducer';

const start = initialAppState(6);

describe('appReducer', () => {
  it('adds, moves, and removes stops through the SDK ops', () => {
    let state = appReducer(start, { type: 'ADD_STOP', day: 0, placeId: 'place_001' });
    state = appReducer(state, { type: 'ADD_STOP', day: 0, placeId: 'place_002' });
    state = appReducer(state, { type: 'MOVE_STOP', from: 0, to: 2, placeId: 'place_001' });
    expect(state.itinerary.days[0].stops).toEqual(['place_002']);
    expect(state.itinerary.days[2].stops).toEqual(['place_001']);
    state = appReducer(state, { type: 'REMOVE_STOP', day: 2, placeId: 'place_001' });
    expect(state.itinerary.days[2].stops).toEqual([]);
  });

  it('returns the same state object for no-op mutations', () => {
    const state = appReducer(start, { type: 'ADD_STOP', day: 0, placeId: 'place_001' });
    expect(appReducer(state, { type: 'ADD_STOP', day: 1, placeId: 'place_001' })).toBe(state);
  });

  it('merges settings partially', () => {
    const state = appReducer(start, { type: 'SET_SETTINGS', settings: { startDay: 0 } });
    expect(state.settings).toEqual({ startDay: 0, travelMonth: 6 });
  });

  it('resets everything but keeps the travel month', () => {
    let state = appReducer(start, { type: 'ADD_STOP', day: 0, placeId: 'place_001' });
    state = appReducer(state, { type: 'SELECT_STOP', placeId: 'place_001' });
    const reset = appReducer(state, { type: 'RESET' });
    expect(reset.itinerary.days[0].stops).toEqual([]);
    expect(reset.selectedStopId).toBeNull();
    expect(reset.settings.travelMonth).toBe(6);
  });
});
