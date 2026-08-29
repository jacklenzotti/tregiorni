import { formatDuration } from '../lib/duration';
import { placeMeta } from '../lib/placeLabels';
import { formatMinutes } from '../lib/time';
import type { Conflict, DayIndex, ScheduledStop } from '../domain/itinerary/types';
import { DAY_INDEXES } from '../domain/itinerary/types';
import type { AppDispatch } from '../state/appReducer';
import { DataBadges, SeasonalNote } from './DataBadges';

const CONFLICT_LABELS: Record<Conflict, string> = {
  'closed-that-day': 'Closed this day',
  'closed-at-time': 'Closed at this time',
  'out-of-season': 'Out of season this month',
  'day-overflow': 'Runs past 23:00',
  'long-transfer': 'Long transfer',
};

interface StopCardProps {
  stop: ScheduledStop;
  day: DayIndex;
  index: number;
  count: number;
  selected: boolean;
  dispatch: AppDispatch;
}

export function StopCard(props: StopCardProps) {
  const { stop, day, index, count, selected, dispatch } = props;
  const { place } = stop;
  return (
    <li
      id={`stop-${place.id}`}
      className={selected ? 'stop selected' : 'stop'}
      onClick={() => dispatch({ type: 'SELECT_STOP', placeId: place.id })}
    >
      {index > 0 && (
        <div className="connector">
          {stop.travelMinutesFromPrev === null
            ? 'travel unknown'
            : `≈ ${formatDuration(stop.travelMinutesFromPrev)} travel`}
        </div>
      )}
      <div className="stop-body">
        <span className="time">
          {formatMinutes(stop.start)}
          <br />
          {formatMinutes(stop.end)}
        </span>
        <div className="stop-info">
          <strong>{place.name}</strong>
          <span className="meta">{placeMeta(place)}</span>
          <SeasonalNote place={place} />
          <DataBadges place={place} />
          {stop.conflicts.length > 0 && (
            <span className="conflicts">
              {stop.conflicts.map((c) => (
                <span key={c} className="conflict">
                  {CONFLICT_LABELS[c]}
                </span>
              ))}
            </span>
          )}
        </div>
        <StopControls day={day} index={index} count={count} placeId={place.id} dispatch={dispatch} />
      </div>
    </li>
  );
}

interface StopControlsProps {
  day: DayIndex;
  index: number;
  count: number;
  placeId: string;
  dispatch: AppDispatch;
}

function StopControls({ day, index, count, placeId, dispatch }: StopControlsProps) {
  const moveWithin = (to: number) =>
    dispatch({ type: 'MOVE_STOP', from: day, to: day, placeId, index: to });
  return (
    <div className="stop-controls" onClick={(e) => e.stopPropagation()}>
      <button title="Move up" disabled={index === 0} onClick={() => moveWithin(index - 1)}>
        ↑
      </button>
      <button title="Move down" disabled={index === count - 1} onClick={() => moveWithin(index + 1)}>
        ↓
      </button>
      {DAY_INDEXES.filter((d) => d !== day).map((to) => (
        <button
          key={to}
          title={`Move to day ${to + 1}`}
          onClick={() => dispatch({ type: 'MOVE_STOP', from: day, to, placeId })}
        >
          D{to + 1}
        </button>
      ))}
      <button title="Remove" onClick={() => dispatch({ type: 'REMOVE_STOP', day, placeId })}>
        ✕
      </button>
    </div>
  );
}
