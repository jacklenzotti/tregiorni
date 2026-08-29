import { addStop, clearDay, moveStop, removeStop } from '../domain/itinerary/ops';
import type { DayIndex, Itinerary, TripSettings } from '../domain/itinerary/types';
import { emptyItinerary } from '../domain/itinerary/types';

export interface AppState {
  settings: TripSettings;
  itinerary: Itinerary;
  selectedStopId: string | null;
}

export type AppAction =
  | { type: 'ADD_STOP'; day: DayIndex; placeId: string }
  | { type: 'REMOVE_STOP'; day: DayIndex; placeId: string }
  | { type: 'MOVE_STOP'; from: DayIndex; to: DayIndex; placeId: string; index?: number }
  | { type: 'CLEAR_DAY'; day: DayIndex }
  | { type: 'SET_SETTINGS'; settings: Partial<TripSettings> }
  | { type: 'SELECT_STOP'; placeId: string | null }
  | { type: 'RESET' };

export type AppDispatch = (action: AppAction) => void;

export function initialAppState(month: number): AppState {
  return {
    settings: { startDay: 4, travelMonth: month },
    itinerary: emptyItinerary(),
    selectedStopId: null,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'SELECT_STOP':
      return { ...state, selectedStopId: action.placeId };
    case 'RESET':
      return { ...initialAppState(state.settings.travelMonth) };
    default:
      return withItinerary(state, mutateItinerary(state.itinerary, action));
  }
}

type MutationAction = Exclude<AppAction, { type: 'SET_SETTINGS' | 'SELECT_STOP' | 'RESET' }>;

function mutateItinerary(itinerary: Itinerary, action: MutationAction): Itinerary {
  switch (action.type) {
    case 'ADD_STOP':
      return addStop(itinerary, action.day, action.placeId);
    case 'REMOVE_STOP':
      return removeStop(itinerary, action.day, action.placeId);
    case 'MOVE_STOP':
      return moveStop(itinerary, action);
    case 'CLEAR_DAY':
      return clearDay(itinerary, action.day);
  }
}

function withItinerary(state: AppState, itinerary: Itinerary): AppState {
  if (itinerary === state.itinerary) return state;
  return { ...state, itinerary };
}
