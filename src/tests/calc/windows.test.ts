import { describe, it, expect } from 'vitest';
import {
  windowHeatingConduction,
  windowCoolingConduction,
  windowSolarGain,
} from '@/lib/calc/components/windows';

describe('windowHeatingConduction', () => {
  it('U=0.30, A=100 ft², dT=70 → 2100 BTU/hr', () => {
    expect(
      windowHeatingConduction({ uValue: 0.3, area: 100, dT: 70 })
    ).toBeCloseTo(2100, 5);
  });
});

describe('windowCoolingConduction', () => {
  it('uses CLTD_glass=14 not dT_summer', () => {
    // U=0.30, A=100 → 0.30 * 100 * 14 = 420
    expect(
      windowCoolingConduction({ uValue: 0.3, area: 100 })
    ).toBeCloseTo(420, 5);
  });
});

describe('windowSolarGain', () => {
  it('west orientation dominates (SCL=110)', () => {
    const w = windowSolarGain({ shgc: 0.4, area: 50, orientation: 'W' });
    const n = windowSolarGain({ shgc: 0.4, area: 50, orientation: 'N' });
    expect(w).toBeGreaterThan(n);
    // 0.4 * 50 * 110 = 2200
    expect(w).toBeCloseTo(2200, 5);
  });

  it('zero area → zero solar gain', () => {
    expect(
      windowSolarGain({ shgc: 0.6, area: 0, orientation: 'S' })
    ).toBe(0);
  });

  it('low-SHGC glass reduces solar gain proportionally', () => {
    const high = windowSolarGain({ shgc: 0.6, area: 100, orientation: 'S' });
    const low = windowSolarGain({ shgc: 0.3, area: 100, orientation: 'S' });
    expect(low).toBeCloseTo(high / 2, 5);
  });
});
