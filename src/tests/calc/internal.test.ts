import { describe, it, expect } from 'vitest';
import {
  internalSensible,
  internalLatent,
} from '@/lib/calc/components/internal';

describe('internalSensible', () => {
  it('4 occupants + 1200W appliances + 800W lighting', () => {
    // 4*230 + (1200+800)*3.412 = 920 + 6824 = 7744
    expect(
      internalSensible({
        occupants: 4,
        applianceWatts: 1200,
        lightingWatts: 800,
      })
    ).toBeCloseTo(7744, 0);
  });

  it('zero occupants + zero loads → 0', () => {
    expect(
      internalSensible({
        occupants: 0,
        applianceWatts: 0,
        lightingWatts: 0,
      })
    ).toBe(0);
  });
});

describe('internalLatent', () => {
  it('200 BTU/hr per occupant at moderate activity (default)', () => {
    expect(internalLatent({ occupants: 4 })).toBe(800);
    expect(internalLatent({ occupants: 0 })).toBe(0);
  });

  it('heavy activity increases latent per person', () => {
    const moderate = internalLatent({ occupants: 4, activityLevel: 'moderate' });
    const heavy = internalLatent({ occupants: 4, activityLevel: 'heavy' });
    expect(heavy).toBeGreaterThan(moderate);
  });
});
