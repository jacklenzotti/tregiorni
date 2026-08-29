import { describe, expect, it } from 'vitest';
import { PLACES } from '../../data/places';
import { citiesWithinReach } from './dayTrips';

describe('citiesWithinReach', () => {
  it('includes the home city', () => {
    expect(citiesWithinReach(PLACES, 'Venice').has('Venice')).toBe(true);
  });

  it('reaches the neighbours a day trip can actually cover', () => {
    const venice = citiesWithinReach(PLACES, 'Venice');
    expect(venice.has('Burano')).toBe(true);
    expect(venice.has('Padua')).toBe(true);
    expect(citiesWithinReach(PLACES, 'Bologna').has('Modena')).toBe(true);
    expect(citiesWithinReach(PLACES, 'Florence').has('Siena')).toBe(true);
  });

  it('leaves out cities that are a trip of their own', () => {
    const rome = citiesWithinReach(PLACES, 'Rome');
    expect([...rome]).toEqual(['Rome']);
    expect(citiesWithinReach(PLACES, 'Venice').has('Bologna')).toBe(false);
    expect(citiesWithinReach(PLACES, 'Milan').has('Florence')).toBe(false);
  });

  it('reaches past the radius when a village has too little to do', () => {
    const pienza = citiesWithinReach(PLACES, 'Pienza');
    expect(pienza.has('Florence')).toBe(true); // 83 km, past the day-trip radius
    expect(pienza.has('Rome')).toBe(false);
  });

  it('falls back to the city itself when it is unknown', () => {
    expect([...citiesWithinReach(PLACES, 'Atlantis')]).toEqual(['Atlantis']);
  });
});
