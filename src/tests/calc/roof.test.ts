import { describe, it, expect } from 'vitest';
import { roofHeatingLoad, roofCoolingLoad } from '@/lib/calc/components/roof';

describe('roofHeatingLoad', () => {
  it('R-30, 2000 ft², dT=70 → ~4667 BTU/hr', () => {
    // U = 1/30; q = (1/30)*2000*70 ≈ 4666.67
    expect(roofHeatingLoad({ rValue: 30, area: 2000, dT: 70 })).toBeCloseTo(
      4666.67,
      1
    );
  });

  it('zero R returns 0', () => {
    expect(roofHeatingLoad({ rValue: 0, area: 2000, dT: 70 })).toBe(0);
  });
});

describe('roofCoolingLoad', () => {
  it('dark roof CLTD > light roof CLTD for same R', () => {
    const dark = roofCoolingLoad({ rValue: 30, area: 2000, color: 'dark' });
    const light = roofCoolingLoad({ rValue: 30, area: 2000, color: 'light' });
    expect(dark).toBeGreaterThan(light);
  });

  it('R-30 medium color, 2000 ft² → ~3067 BTU/hr', () => {
    // (1/30) * 2000 * 46 ≈ 3066.67
    expect(
      roofCoolingLoad({ rValue: 30, area: 2000, color: 'medium' })
    ).toBeCloseTo(3066.67, 1);
  });
});
