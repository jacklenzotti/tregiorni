import { useMemo, useReducer } from 'react';
import { DaySection } from './components/DaySection';
import { ExplorePanel } from './components/ExplorePanel';
import { TripHeader } from './components/TripHeader';
import { PLACES_BY_ID } from './data/places';
import { scheduleItineraryDay } from './domain/itinerary/scheduleDay';
import { allStopIds, DAY_INDEXES } from './domain/itinerary/types';
import { appReducer, initialAppState } from './state/appReducer';

export function App() {
  const [state, dispatch] = useReducer(appReducer, new Date().getMonth() + 1, initialAppState);
  const schedules = useMemo(
    () =>
      DAY_INDEXES.map((day) =>
        scheduleItineraryDay(state.itinerary, day, PLACES_BY_ID, state.settings)
      ),
    [state.itinerary, state.settings]
  );
  const usedIds = useMemo(() => allStopIds(state.itinerary), [state.itinerary]);

  return (
    <div className="app">
      <div className="doc">
        <TripHeader settings={state.settings} dispatch={dispatch} />
        <ExplorePanel usedIds={usedIds} dispatch={dispatch} />
        {DAY_INDEXES.map((day) => (
          <DaySection
            key={day}
            day={day}
            settings={state.settings}
            stops={schedules[day] ?? []}
            usedIds={usedIds}
            selectedStopId={state.selectedStopId}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
