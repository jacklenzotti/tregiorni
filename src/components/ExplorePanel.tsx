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

const PAGE_SIZE = 30;
const TYPES = distinctTypes(CATALOG);
const TAGS = topTags(CATALOG, 10);

export function ExplorePanel({ usedIds, dispatch }: { usedIds: Set<string>; dispatch: AppDispatch }) {
  const [filters, setFiltersState] = useState<CatalogFilters>({
    query: '',
    type: 'all',
    maxPrice: 4,
    tags: [],
  });
  const [page, setPage] = useState(0);
  const setFilters = (update: (f: CatalogFilters) => CatalogFilters) => {
    setFiltersState(update);
    setPage(0);
  };
  const results = useMemo(() => filterPlaces(CATALOG, filters), [filters]);
  const pageCount = Math.ceil(results.length / PAGE_SIZE);

  return (
    <details className="explore" open>
      <summary>
        Explore places <span className="count">{results.length}</span>
      </summary>
      <Filters filters={filters} setFilters={setFilters} />
      <ul className="place-list">
        {results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            used={usedIds.has(place.id)}
            onAdd={(day) => dispatch({ type: 'ADD_STOP', day, placeId: place.id })}
          />
        ))}
      </ul>
      {pageCount > 1 && (
        <div className="pager">
          <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ‹ Prev
          </button>
          <span className="muted">
            {page + 1} / {pageCount}
          </span>
          <button
            className="ghost"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Next ›
          </button>
        </div>
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
