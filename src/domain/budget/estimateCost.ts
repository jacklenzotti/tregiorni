import type { Place, PlaceType } from '../types';

export interface CostBand {
  low: number;
  high: number;
}

type PriceLevel = Place['priceLevel'];
type LevelBands = Record<PriceLevel, CostBand>;

const CONSUMPTION: LevelBands = {
  1: { low: 5, high: 15 },
  2: { low: 15, high: 40 },
  3: { low: 40, high: 90 },
  4: { low: 90, high: 200 },
};

const ENTRY: LevelBands = {
  1: { low: 0, high: 10 },
  2: { low: 10, high: 25 },
  3: { low: 25, high: 45 },
  4: { low: 45, high: 80 },
};

const ZERO: CostBand = { low: 0, high: 0 };
const FREE: LevelBands = { 1: ZERO, 2: ZERO, 3: ZERO, 4: ZERO };

const COST_BANDS_BY_TYPE: Record<PlaceType, LevelBands> = {
  restaurant: CONSUMPTION,
  cafe: CONSUMPTION,
  experience: CONSUMPTION,
  museum: ENTRY,
  historic_site: ENTRY,
  market: ENTRY,
  neighborhood: FREE,
  viewpoint: FREE,
  park: FREE,
  shop: FREE,
};

export function estimateCost(place: Place): CostBand {
  return { ...COST_BANDS_BY_TYPE[place.type][place.priceLevel] };
}

export function sumBands(bands: CostBand[]): CostBand {
  return bands.reduce(
    (total, band) => ({ low: total.low + band.low, high: total.high + band.high }),
    { low: 0, high: 0 },
  );
}

export function dayCost(places: Place[]): CostBand {
  return sumBands(places.map(estimateCost));
}

export function formatBand(band: CostBand): string {
  if (band.low === 0 && band.high === 0) return 'Free';
  if (band.low === band.high) return `€${band.low}`;
  return `€${band.low}–${band.high}`;
}
