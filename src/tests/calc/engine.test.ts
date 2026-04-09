import { describe, it, expect } from 'vitest';
import { calculateLoads } from '@/lib/calc/engine';
import type { CalculationInput } from '@/lib/calc/types';
import {
  referenceHouse,
  referenceResults,
} from '@/tests/fixtures/ashrae-reference-house';

describe('calculateLoads - reference house', () => {
  const result = calculateLoads(referenceHouse);

  it('heating total within 5% of reference', () => {
    const delta = Math.abs(result.heatingTotal - referenceResults.heating);
    expect(delta / referenceResults.heating).toBeLessThan(0.05);
  });

  it('cooling total within 5% of reference', () => {
    const delta = Math.abs(result.coolingTotal - referenceResults.cooling);
    expect(delta / referenceResults.cooling).toBeLessThan(0.05);
  });

  it('cooling sensible within 5% of reference', () => {
    const delta = Math.abs(
      result.coolingSensibleTotal - referenceResults.coolingSensible
    );
    expect(delta / referenceResults.coolingSensible).toBeLessThan(0.05);
  });

  it('west solar > north solar (SCL dominance)', () => {
    const solarW = result.components.find(
      (c) => c.component === 'windows_solar_W'
    )!;
    const solarN = result.components.find(
      (c) => c.component === 'windows_solar_N'
    )!;
    expect(solarW.coolingSensible).toBeGreaterThan(solarN.coolingSensible);
  });

  it('returns top heating and cooling contributors', () => {
    expect(result.topHeatingContributors.length).toBeGreaterThan(0);
    expect(result.topCoolingContributors.length).toBeGreaterThan(0);
    expect(result.topHeatingContributors[0].percent).toBeGreaterThan(0);
  });

  it('component sums equal reported totals', () => {
    const heatSum = result.components.reduce((a, c) => a + c.heating, 0);
    const coolSensSum = result.components.reduce(
      (a, c) => a + c.coolingSensible,
      0
    );
    const coolLatSum = result.components.reduce(
      (a, c) => a + c.coolingLatent,
      0
    );
    expect(heatSum).toBeCloseTo(result.heatingTotal, 3);
    expect(coolSensSum).toBeCloseTo(result.coolingSensibleTotal, 3);
    expect(coolLatSum).toBeCloseTo(result.coolingLatentTotal, 3);
  });

  it('includes climate zone metadata', () => {
    expect(result.meta.climateZoneLabel).toContain('4A');
    expect(result.meta.dTWinter).toBe(56); // 70 - 14
    expect(result.meta.dTSummer).toBe(14); // 89 - 75
  });
});

describe('calculateLoads - invariants', () => {
  it('monotonicity: doubling wall R decreases heating load', () => {
    const base = calculateLoads(referenceHouse);
    const better: CalculationInput = {
      ...referenceHouse,
      envelope: {
        ...referenceHouse.envelope,
        wallRValue: referenceHouse.envelope.wallRValue * 2,
      },
    };
    const improved = calculateLoads(better);
    expect(improved.heatingTotal).toBeLessThan(base.heatingTotal);
  });

  it('climate sensitivity: Miami cooling > Minneapolis cooling, Miami heating < Minneapolis heating', () => {
    const miami = calculateLoads({ ...referenceHouse, climateZoneId: '1A' });
    const mpls = calculateLoads({ ...referenceHouse, climateZoneId: '6A' });
    expect(miami.coolingTotal).toBeGreaterThan(mpls.coolingTotal);
    expect(miami.heatingTotal).toBeLessThan(mpls.heatingTotal);
  });

  it('zero window area → zero solar gain contribution', () => {
    const noWindows = calculateLoads({
      ...referenceHouse,
      windows: {
        mode: 'global',
        uValue: 0.33,
        shgc: 0.42,
        areaByOrientation: { N: 0, E: 0, S: 0, W: 0 },
      },
    });
    const solarComponents = noWindows.components.filter((c) =>
      c.component.startsWith('windows_solar_')
    );
    for (const c of solarComponents) {
      expect(c.coolingSensible).toBe(0);
    }
  });

  it('per-orientation window mode produces same result as global mode when inputs match', () => {
    const global = calculateLoads(referenceHouse);
    const perOrient = calculateLoads({
      ...referenceHouse,
      windows: {
        mode: 'per_orientation',
        byOrientation: {
          N: { uValue: 0.33, shgc: 0.42, area: 75 },
          E: { uValue: 0.33, shgc: 0.42, area: 75 },
          S: { uValue: 0.33, shgc: 0.42, area: 75 },
          W: { uValue: 0.33, shgc: 0.42, area: 75 },
        },
      },
    });
    expect(perOrient.heatingTotal).toBeCloseTo(global.heatingTotal, 3);
    expect(perOrient.coolingTotal).toBeCloseTo(global.coolingTotal, 3);
  });

  it('throws on unknown climate zone', () => {
    expect(() =>
      calculateLoads({ ...referenceHouse, climateZoneId: 'ZZ' })
    ).toThrow();
  });
});
