import type { DayIndex } from '../domain/itinerary/types';
import { DAY_INDEXES } from '../domain/itinerary/types';
import type { Place } from '../domain/types';
import { placeMeta } from '../lib/placeLabels';
import { DataBadges, SeasonalNote } from './DataBadges';

interface PlaceCardProps {
  place: Place;
  used: boolean;
  onAdd: (day: DayIndex) => void;
}

export function PlaceCard({ place, used, onAdd }: PlaceCardProps) {
  return (
    <li className="place-card">
      <div className="place-main">
        <strong>{place.name}</strong>
        <span className="meta">{placeMeta(place)}</span>
        {place.tags.length > 0 && <span className="tags">{place.tags.slice(0, 4).join(' · ')}</span>}
        <SeasonalNote place={place} />
        <DataBadges place={place} />
      </div>
      <div className="add-buttons">
        {used ? (
          <span className="in-plan">In plan</span>
        ) : (
          DAY_INDEXES.map((day) => (
            <button key={day} onClick={() => onAdd(day)}>
              + Day {day + 1}
            </button>
          ))
        )}
      </div>
    </li>
  );
}
