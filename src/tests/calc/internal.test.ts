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
  it('200 BTU/hr per occupant', () => {
    expect(internalLatent(4)).toBe(800);
    expect(internalLatent(0)).toBe(0);
  });
});
