import type { DayIndex, ScheduledStop, TripSettings } from '../domain/itinerary/types';
import { weekdayOfDay } from '../domain/itinerary/types';
import { WEEKDAY_NAMES } from '../domain/types';
import type { AppDispatch } from '../state/appReducer';
import { AddPlaceInput } from './AddPlaceInput';
import { StopCard } from './StopCard';

interface DaySectionProps {
  day: DayIndex;
  settings: TripSettings;
  stops: ScheduledStop[];
  usedIds: Set<string>;
  selectedStopId: string | null;
  dispatch: AppDispatch;
}

export function DaySection({ day, settings, stops, usedIds, selectedStopId, dispatch }: DaySectionProps) {
  return (
    <section className={`day day-${day + 1}`}>
      <header className="day-header">
        <h2>
          Day {day + 1} <span className="weekday">{WEEKDAY_NAMES[weekdayOfDay(settings, day)]}</span>
        </h2>
        <div className="day-actions">
          <button
            className="ghost"
            disabled={stops.length === 0}
            onClick={() => dispatch({ type: 'CLEAR_DAY', day })}
          >
            Clear
          </button>
        </div>
      </header>
      {stops.length === 0 ? (
        <p className="empty">No stops yet — add places from Explore or search below.</p>
      ) : (
        <ol className="stop-list">
          {stops.map((stop, index) => (
            <StopCard
              key={stop.place.id}
              stop={stop}
              day={day}
              index={index}
              count={stops.length}
              selected={stop.place.id === selectedStopId}
              dispatch={dispatch}
            />
          ))}
        </ol>
      )}
      <AddPlaceInput day={day} usedIds={usedIds} dispatch={dispatch} />
    </section>
  );
}
