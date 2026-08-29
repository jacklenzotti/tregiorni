import { useState } from 'react';
import { CATALOG } from '../data/places';
import { filterPlaces } from '../domain/catalog/filterPlaces';
import type { DayIndex } from '../domain/itinerary/types';
import type { AppDispatch } from '../state/appReducer';

const SUGGESTION_LIMIT = 6;

export function AddPlaceInput({
  day,
  usedIds,
  dispatch,
}: {
  day: DayIndex;
  usedIds: Set<string>;
  dispatch: AppDispatch;
}) {
  const [query, setQuery] = useState('');
  const matches =
    query.trim() === ''
      ? []
      : filterPlaces(CATALOG, { query, type: 'all', maxPrice: 4, tags: [] })
          .filter((p) => !usedIds.has(p.id))
          .slice(0, SUGGESTION_LIMIT);

  return (
    <div className="add-place">
      <input
        type="search"
        placeholder="Add a place…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="suggestions">
          {matches.map((place) => (
            <li key={place.id}>
              <button
                onClick={() => {
                  dispatch({ type: 'ADD_STOP', day, placeId: place.id });
                  setQuery('');
                }}
              >
                {place.name} <span className="meta">{place.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
