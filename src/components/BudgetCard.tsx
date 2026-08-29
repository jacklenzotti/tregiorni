import { PLACES_BY_ID } from '../data/places';
import { dayCost, formatBand, sumBands } from '../domain/budget/estimateCost';
import type { Itinerary } from '../domain/itinerary/types';
import { DAY_INDEXES, resolvePlaces } from '../domain/itinerary/types';

export function BudgetCard({ itinerary }: { itinerary: Itinerary }) {
  const rows = DAY_INDEXES.map((day) => ({
    day,
    band: dayCost(resolvePlaces(itinerary.days[day].stops, PLACES_BY_ID)),
  }));
  const total = sumBands(rows.map((row) => row.band));
  const parts = [
    ...rows.map(({ day, band }) => `Day ${day + 1} ${formatBand(band)}`),
    `Trip ${formatBand(total)} pp`,
  ];
  return <p className="budget-card">{parts.join(' · ')}</p>;
}
