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

  it('clears a stale selection when the selected stop leaves the itinerary', () => {
    let state = appReducer(start, { type: 'ADD_STOP', day: 0, placeId: 'place_001' });
    state = appReducer(state, { type: 'SELECT_STOP', placeId: 'place_001' });
    state = appReducer(state, { type: 'REMOVE_STOP', day: 0, placeId: 'place_001' });
    expect(state.selectedStopId).toBeNull();
    const readded = appReducer(state, { type: 'ADD_STOP', day: 1, placeId: 'place_001' });
    expect(readded.selectedStopId).toBeNull();
  });

  it('merges settings partially', () => {
    const state = appReducer(start, { type: 'SET_SETTINGS', settings: { startDay: 0 } });
    expect(state.settings).toEqual({ startDay: 0, travelMonth: 6 });
  });

  it('merges prefs partially', () => {
    const state = appReducer(start, { type: 'SET_PREFS', prefs: { pace: 'packed' } });
    expect(state.prefs).toEqual({ city: 'Rome', interests: [], pace: 'packed', maxPrice: 4 });
  });

  it('auto-plans all three days deterministically', () => {
    const planned = appReducer(start, { type: 'AUTO_PLAN' });
    for (const day of planned.itinerary.days) expect(day.stops.length).toBeGreaterThan(0);
    expect(appReducer(start, { type: 'AUTO_PLAN' }).itinerary).toEqual(planned.itinerary);
  });

  it('auto-fills only the requested day', () => {
    const filled = appReducer(start, { type: 'AUTO_FILL_DAY', day: 1 });
    expect(filled.itinerary.days[0].stops).toEqual([]);
    expect(filled.itinerary.days[1].stops.length).toBeGreaterThan(0);
    expect(filled.itinerary.days[2].stops).toEqual([]);
  });

  it('resets everything but keeps the travel month', () => {
    let state = appReducer(start, { type: 'ADD_STOP', day: 0, placeId: 'place_001' });
    state = appReducer(state, { type: 'SELECT_STOP', placeId: 'place_001' });
    state = appReducer(state, { type: 'SET_PREFS', prefs: { city: 'Florence' } });
    const reset = appReducer(state, { type: 'RESET' });
    expect(reset.itinerary.days[0].stops).toEqual([]);
    expect(reset.selectedStopId).toBeNull();
    expect(reset.settings.travelMonth).toBe(6);
    expect(reset.prefs).toEqual({ city: 'Rome', interests: [], pace: 'balanced', maxPrice: 4 });
  });
});
