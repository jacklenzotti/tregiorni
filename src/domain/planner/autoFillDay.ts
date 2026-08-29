import { addStop } from '../itinerary/ops';
import { DAY_START, scheduleItineraryDay } from '../itinerary/scheduleDay';
import type { Conflict, DayIndex, Itinerary, TripSettings } from '../itinerary/types';
import { CONFLICT_SEVERITY, placesById } from '../itinerary/types';
import type { Place } from '../types';
import { eligiblePlaces } from './candidates';
import type { PlannerPrefs } from './prefs';
import { PACE_PROFILES } from './prefs';
import { scorePlace } from './score';

const MAX_WAIT = 45;
const SAME_TYPE_PENALTY = 0.5; // prefer variety over two of a kind in a row

export interface PlannerEnv {
  settings: TripSettings;
  prefs: PlannerPrefs;
  places: Place[];
}

interface FillContext {
  day: DayIndex;
  settings: TripSettings;
  prefs: PlannerPrefs;
  byId: Map<string, Place>;
}

interface Candidate {
  itinerary: Itinerary;
  metric: number;
  home: boolean;
}

export function autoFillDay(itinerary: Itinerary, day: DayIndex, env: PlannerEnv): Itinerary {
  let current = itinerary;
  while (current.days[day].stops.length < PACE_PROFILES[env.prefs.pace].maxStops) {
    const next = addBestStop(current, day, env);
    if (next === null) break;
    current = next;
  }
  return current;
}

export function addBestStop(
  itinerary: Itinerary,
  day: DayIndex,
  env: PlannerEnv
): Itinerary | null {
  const { settings, prefs, places } = env;
  const ctx: FillContext = { day, settings, prefs, byId: placesById(places) };
  return appendBest(itinerary, eligiblePlaces(places, prefs, settings, itinerary), ctx);
}

function appendBest(itinerary: Itinerary, pool: Place[], ctx: FillContext): Itinerary | null {
  const used = new Set(itinerary.days[ctx.day].stops);
  const lastType = lastStopType(itinerary, ctx);
  let best: Candidate | null = null;
  for (const place of pool) {
    if (used.has(place.id)) continue;
    const candidate = evaluate(itinerary, place, lastType, ctx);
    if (candidate !== null && isBetter(candidate, best)) best = candidate;
  }
  return best?.itinerary ?? null;
}

function evaluate(
  itinerary: Itinerary,
  place: Place,
  lastType: Place['type'] | undefined,
  ctx: FillContext
): Candidate | null {
  const attempt = tryAppend(itinerary, place, ctx);
  const { dayEnd } = PACE_PROFILES[ctx.prefs.pace];
  if (attempt === null || attempt.end > dayEnd) return null;
  // A late first opening must not trip MAX_WAIT, but it still costs the day.
  if (!attempt.firstStop && attempt.idle > MAX_WAIT) return null;
  let metric = scorePlace(place, ctx.prefs.interests) / (1 + attempt.travel + attempt.idle);
  if (place.type === lastType) metric *= SAME_TYPE_PENALTY;
  return { itinerary: attempt.itinerary, metric, home: place.city === ctx.prefs.city };
}

function isBlocking(conflict: Conflict): boolean {
  return CONFLICT_SEVERITY[conflict] === 'blocking';
}

// The chosen city is the trip; a neighbour is a day trip. Neighbours only get a
// look once the home city has nothing left that fits.
function isBetter(candidate: Candidate, best: Candidate | null): boolean {
  if (best === null) return true;
  if (candidate.home !== best.home) return candidate.home;
  return candidate.metric > best.metric;
}

function lastStopType(itinerary: Itinerary, ctx: FillContext): Place['type'] | undefined {
  const stops = itinerary.days[ctx.day].stops;
  const lastId = stops[stops.length - 1];
  return lastId === undefined ? undefined : ctx.byId.get(lastId)?.type;
}

interface Attempt {
  itinerary: Itinerary;
  end: number;
  travel: number;
  idle: number; // dead time before this stop, including a late first opening
  firstStop: boolean;
}

function tryAppend(itinerary: Itinerary, place: Place, ctx: FillContext): Attempt | null {
  const trial = addStop(itinerary, ctx.day, place.id);
  const schedule = scheduleItineraryDay(trial, ctx.day, ctx.byId, ctx.settings);
  const stop = schedule[schedule.length - 1];
  if (stop === undefined || stop.conflicts.some(isBlocking)) return null;
  const previousEnd = schedule[schedule.length - 2]?.end;
  const travel = stop.travelMinutesFromPrev ?? 0;
  return {
    itinerary: trial,
    end: stop.end,
    travel,
    idle: stop.start - (previousEnd ?? DAY_START) - travel,
    firstStop: previousEnd === undefined,
  };
}
