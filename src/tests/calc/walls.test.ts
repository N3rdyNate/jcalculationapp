import { describe, it, expect } from 'vitest';
import {
  netWallArea,
  wallHeatingLoad,
  wallCoolingLoad,
} from '@/lib/calc/components/walls';

describe('netWallArea', () => {
  it('subtracts windows and doors from gross perimeter*height*stories', () => {
    // 40 ft × 50 ft single-story 8 ft ceiling = perimeter 180, gross 1440
    expect(
      netWallArea({
        perimeter: 180,
        ceilingHeight: 8,
        stories: 1,
        windowArea: 200,
        doorArea: 40,
      })
    ).toBe(1200);
  });

  it('never returns negative', () => {
    expect(
      netWallArea({
        perimeter: 100,
        ceilingHeight: 8,
        stories: 1,
        windowArea: 2000,
        doorArea: 100,
      })
    ).toBe(0);
  });
});

describe('wallHeatingLoad', () => {
  it('R-13 wall, 1000 ft² net, dT=70 → ~5385 BTU/hr', () => {
    // U = 1/13 = 0.0769; q = 0.0769 * 1000 * 70 ≈ 5384.6
    expect(
      wallHeatingLoad({ rValue: 13, netArea: 1000, dT: 70 })
    ).toBeCloseTo(5384.6, 0);
  });

  it('doubling R halves heating load', () => {
    const q1 = wallHeatingLoad({ rValue: 10, netArea: 1000, dT: 50 });
    const q2 = wallHeatingLoad({ rValue: 20, netArea: 1000, dT: 50 });
    expect(q2).toBeCloseTo(q1 / 2, 5);
  });

  it('zero R returns 0 (divide-by-zero guard)', () => {
    expect(wallHeatingLoad({ rValue: 0, netArea: 1000, dT: 70 })).toBe(0);
  });
});

describe('wallCoolingLoad', () => {
  it('uses light-mass CLTD=22 for frame walls', () => {
    // U = 1/11, A = 1000, CLTD = 22 → 2000
    expect(
      wallCoolingLoad({ rValue: 11, netArea: 1000, mass: 'light' })
    ).toBeCloseTo(2000, 0);
  });

  it('heavy mass lowers cooling load vs light mass', () => {
    const light = wallCoolingLoad({ rValue: 11, netArea: 1000, mass: 'light' });
    const heavy = wallCoolingLoad({ rValue: 11, netArea: 1000, mass: 'heavy' });
    expect(heavy).toBeLessThan(light);
  });
});
