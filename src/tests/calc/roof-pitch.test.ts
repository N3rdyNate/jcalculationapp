import { describe, it, expect } from 'vitest';
import {
  ROOF_PITCH_MULTIPLIER,
  type RoofPitch,
} from '@/lib/calc/constants/roof-pitch';
import {
  roofPitchSchema,
  activityLevelSchema,
  lightingTypeSchema,
} from '@/lib/calc/schemas';

describe('roofPitchSchema', () => {
  it('accepts legacy coarse buckets for backwards compat', () => {
    for (const v of ['flat', 'low', 'standard', 'steep']) {
      expect(roofPitchSchema.safeParse(v).success).toBe(true);
    }
  });

  it('accepts all granular rise/12 values', () => {
    for (let r = 1; r <= 12; r++) {
      expect(roofPitchSchema.safeParse(`${r}_12`).success).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(roofPitchSchema.safeParse('13_12').success).toBe(false);
    expect(roofPitchSchema.safeParse('').success).toBe(false);
  });
});

describe('activityLevelSchema (backwards compat)', () => {
  it('still accepts legacy values', () => {
    for (const v of ['light', 'moderate', 'heavy']) {
      expect(activityLevelSchema.safeParse(v).success).toBe(true);
    }
  });

  it('accepts new sedentary and vigorous values', () => {
    expect(activityLevelSchema.safeParse('sedentary').success).toBe(true);
    expect(activityLevelSchema.safeParse('vigorous').success).toBe(true);
  });
});

describe('lightingTypeSchema (backwards compat)', () => {
  it('still accepts legacy values', () => {
    for (const v of ['incandescent', 'fluorescent', 'led', 'mixed']) {
      expect(lightingTypeSchema.safeParse(v).success).toBe(true);
    }
  });

  it('accepts new halogen value', () => {
    expect(lightingTypeSchema.safeParse('halogen').success).toBe(true);
  });
});

describe('ROOF_PITCH_MULTIPLIER', () => {
  it('flat has multiplier 1.0', () => {
    expect(ROOF_PITCH_MULTIPLIER.flat).toBe(1.0);
  });

  it('legacy buckets still exist for backwards compat', () => {
    expect(ROOF_PITCH_MULTIPLIER.low).toBeGreaterThan(1.0);
    expect(ROOF_PITCH_MULTIPLIER.standard).toBeGreaterThan(
      ROOF_PITCH_MULTIPLIER.low
    );
    expect(ROOF_PITCH_MULTIPLIER.steep).toBeGreaterThan(
      ROOF_PITCH_MULTIPLIER.standard
    );
  });

  it('granular pitches are strictly monotonic increasing with rise', () => {
    const pitches: RoofPitch[] = [
      '1_12',
      '2_12',
      '3_12',
      '4_12',
      '5_12',
      '6_12',
      '7_12',
      '8_12',
      '9_12',
      '10_12',
      '11_12',
      '12_12',
    ];
    for (let i = 1; i < pitches.length; i++) {
      expect(ROOF_PITCH_MULTIPLIER[pitches[i]]).toBeGreaterThan(
        ROOF_PITCH_MULTIPLIER[pitches[i - 1]]
      );
    }
  });

  it('12/12 multiplier is approximately sqrt(2) (45° slope)', () => {
    expect(ROOF_PITCH_MULTIPLIER['12_12']).toBeCloseTo(Math.SQRT2, 2);
  });

  it('6/12 matches the formula sqrt(144 + 36) / 12 ≈ 1.118', () => {
    expect(ROOF_PITCH_MULTIPLIER['6_12']).toBeCloseTo(
      Math.sqrt(144 + 36) / 12,
      2
    );
  });

  it('8/12 matches the formula', () => {
    expect(ROOF_PITCH_MULTIPLIER['8_12']).toBeCloseTo(
      Math.sqrt(144 + 64) / 12,
      2
    );
  });

  it('legacy "standard" matches 6/12 within rounding so reference house holds', () => {
    // reference house test asserts within 5%; these are within 0.4%
    expect(ROOF_PITCH_MULTIPLIER.standard).toBeCloseTo(
      ROOF_PITCH_MULTIPLIER['6_12'],
      1
    );
  });
});
