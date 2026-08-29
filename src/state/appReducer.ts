import { PLACES } from '../data/places';
import { addStop, clearDay, moveStop, removeStop } from '../domain/itinerary/ops';
import type { DayIndex, Itinerary, TripSettings } from '../domain/itinerary/types';
import { allStopIds, emptyItinerary } from '../domain/itinerary/types';
import { autoFillDay } from '../domain/planner/autoFillDay';
import { autoPlan } from '../domain/planner/autoPlan';
import type { PlannerPrefs } from '../domain/planner/prefs';
import { defaultPrefs } from '../domain/planner/prefs';

export interface AppState {
  settings: TripSettings;
  prefs: PlannerPrefs;
  itinerary: Itinerary;
  selectedStopId: string | null;
}

export type AppAction =
  | { type: 'ADD_STOP'; day: DayIndex; placeId: string }
  | { type: 'REMOVE_STOP'; day: DayIndex; placeId: string }
  | { type: 'MOVE_STOP'; from: DayIndex; to: DayIndex; placeId: string; index?: number }
  | { type: 'CLEAR_DAY'; day: DayIndex }
  | { type: 'AUTO_FILL_DAY'; day: DayIndex }
  | { type: 'AUTO_PLAN' }
  | { type: 'SET_SETTINGS'; settings: Partial<TripSettings> }
  | { type: 'SET_PREFS'; prefs: Partial<PlannerPrefs> }
  | { type: 'SELECT_STOP'; placeId: string | null }
  | { type: 'RESET' };

export type AppDispatch = (action: AppAction) => void;

export function initialAppState(month: number): AppState {
  return {
    settings: { startDay: 4, travelMonth: month },
    prefs: defaultPrefs(),
    itinerary: emptyItinerary(),
    selectedStopId: null,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'SET_PREFS':
      return { ...state, prefs: { ...state.prefs, ...action.prefs } };
    case 'SELECT_STOP':
      return { ...state, selectedStopId: action.placeId };
    case 'RESET':
      return initialAppState(state.settings.travelMonth);
    default:
      return withItinerary(state, mutateItinerary(state, action));
  }
}

type MutationAction = Extract<
  AppAction,
  {
    type: 'ADD_STOP' | 'REMOVE_STOP' | 'MOVE_STOP' | 'CLEAR_DAY' | 'AUTO_FILL_DAY' | 'AUTO_PLAN';
  }
>;

type PlannerAction = Extract<AppAction, { type: 'AUTO_FILL_DAY' | 'AUTO_PLAN' }>;

function mutateItinerary(state: AppState, action: MutationAction): Itinerary {
  const itinerary = state.itinerary;
  switch (action.type) {
    case 'ADD_STOP':
      return addStop(itinerary, action.day, action.placeId);
    case 'REMOVE_STOP':
      return removeStop(itinerary, action.day, action.placeId);
    case 'MOVE_STOP':
      return moveStop(itinerary, action);
    case 'CLEAR_DAY':
      return clearDay(itinerary, action.day);
    default:
      return planItinerary(state, action);
  }
}

function planItinerary(state: AppState, action: PlannerAction): Itinerary {
  switch (action.type) {
    case 'AUTO_FILL_DAY':
      return autoFillDay(state.itinerary, action.day, {
        settings: state.settings,
        prefs: state.prefs,
        places: PLACES,
      });
    case 'AUTO_PLAN':
      return autoPlan(state.itinerary, state.settings, state.prefs, PLACES);
  }
}

function withItinerary(state: AppState, itinerary: Itinerary): AppState {
  if (itinerary === state.itinerary) return state;
  const selectedStopId =
    state.selectedStopId !== null && allStopIds(itinerary).has(state.selectedStopId)
      ? state.selectedStopId
      : null;
  return { ...state, itinerary, selectedStopId };
}
