import { useMemo, useState } from 'react';
import { CATALOG } from '../data/places';
import type { CatalogFilters } from '../domain/catalog/filterPlaces';
import { distinctTypes, filterPlaces, topTags } from '../domain/catalog/filterPlaces';
import type { PlaceType } from '../domain/types';
import { typeLabel } from '../lib/placeLabels';
import { toggle } from '../lib/toggle';
import type { AppDispatch } from '../state/appReducer';
import { PlaceCard } from './PlaceCard';
import { PriceSelect } from './PriceSelect';
import { TagRow } from './TagRow';

const VISIBLE_LIMIT = 30;
const TYPES = distinctTypes(CATALOG);
const TAGS = topTags(CATALOG, 10);

export function ExplorePanel({ usedIds, dispatch }: { usedIds: Set<string>; dispatch: AppDispatch }) {
  const [filters, setFilters] = useState<CatalogFilters>({
    query: '',
    type: 'all',
    maxPrice: 4,
    tags: [],
  });
  const results = useMemo(() => filterPlaces(CATALOG, filters), [filters]);

  return (
    <details className="explore" open>
      <summary>
        Explore places <span className="count">{results.length}</span>
      </summary>
      <Filters filters={filters} setFilters={setFilters} />
      <ul className="place-list">
        {results.slice(0, VISIBLE_LIMIT).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            used={usedIds.has(place.id)}
            onAdd={(day) => dispatch({ type: 'ADD_STOP', day, placeId: place.id })}
          />
        ))}
      </ul>
      {results.length > VISIBLE_LIMIT && (
        <p className="muted">…and {results.length - VISIBLE_LIMIT} more — refine the filters.</p>
      )}
    </details>
  );
}

interface FiltersProps {
  filters: CatalogFilters;
  setFilters: (update: (f: CatalogFilters) => CatalogFilters) => void;
}

function Filters({ filters, setFilters }: FiltersProps) {
  const toggleTag = (tag: string) =>
    setFilters((f) => ({ ...f, tags: toggle(f.tags, tag) }));
  return (
    <div className="filters">
      <div className="filter-row">
        <input
          type="search"
          placeholder="Search places…"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as PlaceType | 'all' }))}
        >
          <option value="all">all types</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
        <PriceSelect
          value={filters.maxPrice}
          onChange={(maxPrice) => setFilters((f) => ({ ...f, maxPrice }))}
        />
      </div>
      <TagRow tags={TAGS} selected={filters.tags} onToggle={toggleTag} />
    </div>
  );
}
