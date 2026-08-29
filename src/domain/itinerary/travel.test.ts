import { describe, expect, it } from 'vitest';
import { travelMinutes } from './travel';

const rome = { lat: 41.9028, lon: 12.4964 };

function kmEast(km: number) {
  return { lat: rome.lat, lon: rome.lon + km / 82.9 }; // ~82.9 km per degree at Rome's latitude
}

describe('travelMinutes', () => {
  it('is zero for the same point', () => {
    expect(travelMinutes(rome, rome)).toBe(0);
  });

  it('walks short hops at 4.5 km/h', () => {
    expect(travelMinutes(rome, kmEast(0.8))).toBe(11);
  });

  it('never reports less time for a longer hop', () => {
    let previous = 0;
    for (let km = 0.1; km <= 6; km += 0.05) {
      const minutes = travelMinutes(rome, kmEast(km));
      expect(minutes).toBeGreaterThanOrEqual(previous);
      previous = minutes;
    }
  });

  it('switches to transit beyond a 25-minute walk', () => {
    const minutes = travelMinutes(rome, kmEast(4));
    expect(minutes).toBe(Math.round((4 / 20) * 60 + 10));
  });

  it('uses intercity rail for a cross-country hop', () => {
    const veniceToMilan = travelMinutes(rome, kmEast(245));
    expect(veniceToMilan).toBeLessThan(5 * 60);
    expect(veniceToMilan).toBeGreaterThan(2 * 60);
  });

  it('keeps a cross-city hop on city transit', () => {
    expect(travelMinutes(rome, kmEast(20))).toBe(70);
  });

  it('scales transit with distance', () => {
    expect(travelMinutes(rome, kmEast(20))).toBeGreaterThan(travelMinutes(rome, kmEast(5)));
  });
});
