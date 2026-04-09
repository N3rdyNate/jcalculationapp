import { describe, it, expect } from 'vitest';
import {
  infiltrationCFM,
  infiltrationSensible,
  infiltrationLatent,
} from '@/lib/calc/components/infiltration';

describe('infiltrationCFM', () => {
  it('0.5 ACH × 16000 ft³ / 60 = 133.33 CFM', () => {
    expect(infiltrationCFM(0.5, 16000)).toBeCloseTo(133.33, 1);
  });
});

describe('infiltrationSensible', () => {
  it('uses 1.08 constant', () => {
    // 1.08 * 100 CFM * 50°F = 5400
    expect(infiltrationSensible({ cfm: 100, dT: 50 })).toBeCloseTo(5400, 5);
  });
});

describe('infiltrationLatent', () => {
  it('uses 0.68 constant', () => {
    // 0.68 * 100 * 30 = 2040
    expect(
      infiltrationLatent({ cfm: 100, humidityRatioDelta: 30 })
    ).toBeCloseTo(2040, 5);
  });

  it('dry climate (low grains) → low latent load', () => {
    const dry = infiltrationLatent({ cfm: 100, humidityRatioDelta: 5 });
    const humid = infiltrationLatent({ cfm: 100, humidityRatioDelta: 40 });
    expect(dry).toBeLessThan(humid);
  });
});
