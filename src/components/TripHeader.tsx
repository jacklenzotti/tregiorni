import type { TripSettings } from '../domain/itinerary/types';
import type { Weekday } from '../domain/types';
import { WEEKDAY_NAMES } from '../domain/types';
import type { AppDispatch } from '../state/appReducer';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function TripHeader({ settings, dispatch }: { settings: TripSettings; dispatch: AppDispatch }) {
  return (
    <header className="trip-header">
      <div>
        <h1>Tre Giorni</h1>
        <p className="tagline">Three days in Italy, planned around real opening hours.</p>
      </div>
      <div className="trip-controls">
        <label>
          Start day
          <select
            value={settings.startDay}
            onChange={(e) =>
              dispatch({ type: 'SET_SETTINGS', settings: { startDay: Number(e.target.value) as Weekday } })
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
    </header>
  );
}
