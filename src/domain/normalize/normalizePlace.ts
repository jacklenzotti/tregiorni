import type { Coords, DataFlag, Place, PlaceType } from '../types';
import { PLACE_TYPES } from '../types';
import type { RawPlace } from './raw';
import { canonicalizeTags } from './canonicalizeTags';
import { detectGeoOutliers } from './detectGeoOutliers';
import { parseHours } from './parseHours';
import { parseSeasonalMonths } from './parseSeasonalMonths';
import { computeTypeMedians, resolveDuration } from './resolveDuration';
import { resolveAliases } from './resolveAliases';

interface NormalizeContext {
  medians: Map<string, number>;
  outliers: Set<string>;
  aliases: Map<string, string>;
}

export function normalizeAll(raws: RawPlace[]): Place[] {
  const candidates = raws.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    rating: r.rating,
    coords: coordsOf(r),
  }));
  const ctx: NormalizeContext = {
    medians: computeTypeMedians(raws.map((r) => ({ type: r.type, minutes: r.duration_minutes }))),
    outliers: detectGeoOutliers(candidates),
    aliases: resolveAliases(candidates),
  };
  return raws.map((r) => normalizePlace(r, ctx)).sort((a, b) => a.id.localeCompare(b.id));
}

function normalizePlace(raw: RawPlace, ctx: NormalizeContext): Place {
  const type = parsePlaceType(raw.type);
  const { hours, flags: hourFlags } = parseHours(raw.hours, type);
  const { visitMinutes, flags: durationFlags } = resolveDuration(
    raw.duration_minutes,
    raw.type,
    ctx.medians
  );
  const aliasOf = ctx.aliases.get(raw.id);
  const flags = collectFlags(raw, ctx, [...hourFlags, ...durationFlags]);
  return {
    id: raw.id,
    name: raw.name,
    type,
    city: raw.city,
    region: raw.region,
    neighborhood: raw.neighborhood,
    description: raw.description,
    coords: coordsOf(raw),
    hours,
    visitMinutes,
    priceLevel: parsePriceLevel(raw.price_range),
    rating: raw.rating,
    tags: canonicalizeTags(raw.tags),
    openMonths: parseSeasonalMonths(raw.seasonal_notes),
    seasonalNote: raw.seasonal_notes,
    bookingRequired: raw.booking_required,
    flags,
    ...(aliasOf === undefined ? {} : { aliasOf }),
  };
}

function collectFlags(raw: RawPlace, ctx: NormalizeContext, flags: DataFlag[]): DataFlag[] {
  if (raw.booking_required === null) flags.push('booking-unknown');
  if (ctx.outliers.has(raw.id)) flags.push('coords-suspect');
  if (ctx.aliases.has(raw.id)) flags.push('alias');
  return flags;
}

function coordsOf(raw: RawPlace): Coords {
  return { lat: raw.latitude, lon: raw.longitude };
}

function parsePlaceType(type: string): PlaceType {
  const known = PLACE_TYPES.find((t) => t === type);
  if (known === undefined) throw new Error(`Unknown place type: ${type}`);
  return known;
}

function parsePriceLevel(priceRange: string): Place['priceLevel'] {
  if (!/^€{1,4}$/.test(priceRange)) throw new Error(`Unparseable price range: ${priceRange}`);
  return priceRange.length as Place['priceLevel'];
}
