import { describe, expect, it } from 'vitest';
import { detectGeoOutliers } from './detectGeoOutliers';
import raw from '../../../data/raw/italy.json';

function place(id: string, city: string, lat: number, lon: number) {
  return { id, city, coords: { lat, lon } };
}

describe('detectGeoOutliers', () => {
  it('never flags cities with fewer than 3 places, however far apart', () => {
    const result = detectGeoOutliers([
      place('a', 'Tiny', 0, 0),
      place('b', 'Tiny', 5, 5),
    ]);
    expect(result.size).toBe(0);
  });

  it('flags a place more than 30 km from the city median centroid', () => {
    const result = detectGeoOutliers([
      place('a', 'City', 0, 0),
      place('b', 'City', 0, 0),
      place('c', 'City', 0.28, 0),
    ]);
    expect(result).toEqual(new Set(['c']));
  });

  it('does not flag a place within 30 km of the centroid', () => {
    const result = detectGeoOutliers([
      place('a', 'City', 0, 0),
      place('b', 'City', 0, 0),
      place('c', 'City', 0.26, 0),
    ]);
    expect(result.size).toBe(0);
  });

  it('uses the median, so one outlier cannot drag the centroid', () => {
    const result = detectGeoOutliers([
      place('a', 'City', 0, 0),
      place('b', 'City', 0, 0),
      place('c', 'City', 0, 0.001),
      place('d', 'City', 0, 10),
    ]);
    expect(result).toEqual(new Set(['d']));
  });

  it('flags exactly place_059 in the real dataset', () => {
    const places = raw.map((p) => ({
      id: p.id,
      city: p.city,
      coords: { lat: p.latitude, lon: p.longitude },
    }));
    const result = detectGeoOutliers(places);
    expect(result).toEqual(new Set(['place_059']));
    expect(result.has('place_035')).toBe(false);
  });
});
