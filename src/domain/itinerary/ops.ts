import type { DayIndex, Itinerary } from './types';
import { allStopIds } from './types';

export function addStop(itinerary: Itinerary, day: DayIndex, placeId: string): Itinerary {
  if (allStopIds(itinerary).has(placeId)) return itinerary;
  return withDay(itinerary, day, [...itinerary.days[day].stops, placeId]);
}

export function removeStop(itinerary: Itinerary, day: DayIndex, placeId: string): Itinerary {
  const stops = itinerary.days[day].stops;
  if (!stops.includes(placeId)) return itinerary;
  return withDay(
    itinerary,
    day,
    stops.filter((id) => id !== placeId)
  );
}

export function moveStop(
  itinerary: Itinerary,
  move: { from: DayIndex; to: DayIndex; placeId: string; index?: number }
): Itinerary {
  const { from, to, placeId, index } = move;
  if (!itinerary.days[from].stops.includes(placeId)) return itinerary;
  const removed = withDay(
    itinerary,
    from,
    itinerary.days[from].stops.filter((id) => id !== placeId)
  );
  const target = [...removed.days[to].stops];
  target.splice(index ?? target.length, 0, placeId);
  return withDay(removed, to, target);
}

export function clearDay(itinerary: Itinerary, day: DayIndex): Itinerary {
  return withDay(itinerary, day, []);
}

function withDay(itinerary: Itinerary, day: DayIndex, stops: string[]): Itinerary {
  const days = [...itinerary.days] as Itinerary['days'];
  days[day] = { stops };
  return { days };
}
