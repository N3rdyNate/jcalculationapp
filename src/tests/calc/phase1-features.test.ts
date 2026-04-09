import { describe, it, expect } from 'vitest';
import { effectiveWallR } from '@/lib/calc/constants/thermal-bridging';
import { atticRValue } from '@/lib/calc/constants/attic-insulation';
import { overhangShadingFactor } from '@/lib/calc/constants/overhang';
import { FIREPLACE_ACH_PENALTY } from '@/lib/calc/constants/fireplace';
import {
  ach50ToNaturalAch,
  estimateAchFromQuality,
} from '@/lib/calc/components/infiltration';
import { ductLossFraction } from '@/lib/calc/components/ducts';
import { resolveWallR } from '@/lib/calc/components/walls';
import {
  skylightHeatingConduction,
  skylightSolarGain,
} from '@/lib/calc/components/skylight';
import { calculateLoads } from '@/lib/calc/engine';
import { referenceHouse } from '@/tests/fixtures/ashrae-reference-house';

// ---------------------------------------------------------------------------
// Thermal bridging
// ---------------------------------------------------------------------------
describe('effectiveWallR (thermal bridging)', () => {
  it('R-13 with 25% framing at 2×4 → effective R ≈ 8.2 (parallel-path)', () => {
    // U_eff = 0.25*(1/3.85) + 0.75*(1/13) = 0.0649 + 0.0577 = 0.1226
    // R_eff = 1/0.1226 ≈ 8.15
    const rEff = effectiveWallR(13, 0.25, 3.5);
    expect(rEff).toBeGreaterThan(7);
    expect(rEff).toBeLessThan(9);
  });

  it('0% framing → returns nominal R', () => {
    expect(effectiveWallR(13, 0, 3.5)).toBe(13);
  });

  it('100% framing → returns stud-only R', () => {
    const rEff = effectiveWallR(13, 1.0, 3.5);
    expect(rEff).toBeCloseTo(3.5 * 1.1, 1); // 3.85
  });

  it('resolveWallR delegates when framingPct is present', () => {
    const with_ = resolveWallR({ rValue: 13, framingPct: 0.25 });
    const without = resolveWallR({ rValue: 13 });
    expect(with_).toBeLessThan(without);
    expect(without).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// Attic insulation
// ---------------------------------------------------------------------------
describe('atticRValue', () => {
  it('blown cellulose at 12 inches → R-42', () => {
    expect(atticRValue('blown_cellulose', 12)).toBeCloseTo(42, 0);
  });

  it('fiberglass batts at 6 inches → R-19.2', () => {
    expect(atticRValue('fiberglass_batts', 6)).toBeCloseTo(19.2, 1);
  });
});

// ---------------------------------------------------------------------------
// Overhang shading
// ---------------------------------------------------------------------------
describe('overhangShadingFactor', () => {
  it('no overhang → factor 1.0', () => {
    expect(overhangShadingFactor(0, 4, 'S')).toBe(1.0);
  });

  it('deep overhang on south → factor < 0.5', () => {
    expect(overhangShadingFactor(4, 4, 'S')).toBeLessThanOrEqual(0.5);
  });

  it('east/west → less effective than south', () => {
    const south = overhangShadingFactor(2, 4, 'S');
    const west = overhangShadingFactor(2, 4, 'W');
    expect(west).toBeGreaterThan(south); // less reduction
  });

  it('north → always 1.0', () => {
    expect(overhangShadingFactor(3, 4, 'N')).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Fireplace
// ---------------------------------------------------------------------------
describe('FIREPLACE_ACH_PENALTY', () => {
  it('wood_burning adds 0.15 ACH', () => {
    expect(FIREPLACE_ACH_PENALTY.wood_burning).toBe(0.15);
  });

  it('none adds 0 ACH', () => {
    expect(FIREPLACE_ACH_PENALTY.none).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ACH50 conversion
// ---------------------------------------------------------------------------
describe('ach50ToNaturalAch', () => {
  it('5 ACH50 at 1 story → ~0.29', () => {
    const ach = ach50ToNaturalAch(5, 1);
    expect(ach).toBeCloseTo(5 / 17, 2);
  });

  it('5 ACH50 at 2 stories → 0.25', () => {
    const ach = ach50ToNaturalAch(5, 2);
    expect(ach).toBeCloseTo(5 / 20, 2);
  });
});

describe('estimateAchFromQuality', () => {
  it('average → 0.5', () => {
    expect(estimateAchFromQuality('average')).toBe(0.5);
  });

  it('passive → 0.04', () => {
    expect(estimateAchFromQuality('passive')).toBe(0.04);
  });
});

// ---------------------------------------------------------------------------
// Duct leakage override
// ---------------------------------------------------------------------------
describe('ductLossFraction with leakagePct', () => {
  it('explicit 15% leakage in attic → 0.15 fraction', () => {
    expect(ductLossFraction('attic', 8, 15)).toBe(0.15);
  });

  it('conditioned space always → 0 regardless of leakage', () => {
    expect(ductLossFraction('conditioned', 8, 15)).toBe(0);
  });

  it('no leakagePct → uses table value', () => {
    expect(ductLossFraction('attic', 8)).toBe(0.15);
  });
});

// ---------------------------------------------------------------------------
// Skylights
// ---------------------------------------------------------------------------
describe('skylight components', () => {
  it('heating conduction = U × A × dT', () => {
    expect(skylightHeatingConduction({ uValue: 0.5, area: 20, dT: 56 }))
      .toBeCloseTo(560, 0);
  });

  it('solar gain > 0 for nonzero SHGC and area', () => {
    expect(skylightSolarGain({ shgc: 0.4, area: 20 })).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Reference house regression (must still pass with Phase 1 defaults)
// ---------------------------------------------------------------------------
describe('reference house still passes with Phase 1 engine', () => {
  it('heating within 5% of hand-computed', () => {
    const result = calculateLoads(referenceHouse);
    expect(result.heatingTotal).toBeCloseTo(29569, -3);
  });

  it('cooling within 5% of hand-computed', () => {
    const result = calculateLoads(referenceHouse);
    expect(result.coolingTotal).toBeCloseTo(27972, -3);
  });
});
