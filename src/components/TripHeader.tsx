import { useMemo } from 'react';
import { CATALOG, PLACES } from '../data/places';
import { placeCountsByCity, topTags } from '../domain/catalog/filterPlaces';
import type { Itinerary, TripSettings } from '../domain/itinerary/types';
import { dayTripCities } from '../domain/planner/dayTrips';
import type { Pace, PlannerPrefs } from '../domain/planner/prefs';
import { PACE_PROFILES } from '../domain/planner/prefs';
import type { Weekday } from '../domain/types';
import { MONTH_NAMES, WEEKDAY_NAMES } from '../domain/types';
import { toggle } from '../lib/toggle';
import type { AppDispatch } from '../state/appReducer';
import { BudgetCard } from './BudgetCard';
import { PriceSelect } from './PriceSelect';
import { TagRow } from './TagRow';

const CITY_COUNTS = placeCountsByCity(CATALOG);
const CITIES = [...CITY_COUNTS.keys()].sort();
const PACES = Object.keys(PACE_PROFILES) as Pace[];
const INTERESTS = topTags(CATALOG, 8);

interface TripHeaderProps {
  settings: TripSettings;
  prefs: PlannerPrefs;
  itinerary: Itinerary;
  dispatch: AppDispatch;
}

export function TripHeader({ settings, prefs, itinerary, dispatch }: TripHeaderProps) {
  return (
    <header className="trip-header-area">
      <div className="trip-header">
        <h1>Tre Giorni</h1>
        <div className="trip-controls">
          <label>
            Start day
            <select
              value={settings.startDay}
              onChange={(e) =>
                dispatch({
                  type: 'SET_SETTINGS',
                  settings: { startDay: Number(e.target.value) as Weekday },
                })
              }
            >
              {WEEKDAY_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Month
            <select
              value={settings.travelMonth}
              onChange={(e) =>
                dispatch({ type: 'SET_SETTINGS', settings: { travelMonth: Number(e.target.value) } })
              }
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost" onClick={() => dispatch({ type: 'RESET' })}>
            Reset
          </button>
        </div>
      </div>
      <PrefsBar prefs={prefs} dispatch={dispatch} />
      <BudgetCard itinerary={itinerary} />
    </header>
  );
}

function PrefsBar({ prefs, dispatch }: { prefs: PlannerPrefs; dispatch: AppDispatch }) {
  const set = (update: Partial<PlannerPrefs>) => dispatch({ type: 'SET_PREFS', prefs: update });
  const toggleInterest = (tag: string) => set({ interests: toggle(prefs.interests, tag) });
  return (
    <div className="prefs-bar">
      <div className="prefs-controls">
        <label>
          City
          <select value={prefs.city} onChange={(e) => set({ city: e.target.value })}>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city} ({CITY_COUNTS.get(city)})
              </option>
            ))}
          </select>
        </label>
        <label>
          Pace
          <select value={prefs.pace} onChange={(e) => set({ pace: e.target.value as Pace })}>
            {PACES.map((pace) => (
              <option key={pace} value={pace}>
                {pace}
              </option>
            ))}
          </select>
        </label>
        <label>
          Budget
          <PriceSelect value={prefs.maxPrice} onChange={(maxPrice) => set({ maxPrice })} />
        </label>
        <button className="accent" onClick={() => dispatch({ type: 'AUTO_PLAN' })}>
          Auto-plan trip
        </button>
      </div>
      <DayTripNote city={prefs.city} />
      <TagRow tags={INTERESTS} selected={prefs.interests} onToggle={toggleInterest} />
    </div>
  );
}

function DayTripNote({ city }: { city: string }) {
  // PLACES, not CATALOG — the planner reaches from the same set.
  const neighbours = useMemo(() => dayTripCities(PLACES, city), [city]);
  if (neighbours.length === 0) return null;
  return <p className="day-trip-note">Day trips included: {neighbours.join(', ')}</p>;
}
