import { describe, it, expect } from 'vitest';
import { calculateLoads } from '@/lib/calc/engine';
import type { CalculationInput } from '@/lib/calc/types';
import { referenceHouse } from '@/tests/fixtures/ashrae-reference-house';

/**
 * v2 engine behaviors: shading, frame material, altitude, roof pitch,
 * ducts, mechanical ventilation, garage. Each test takes the reference
 * house as baseline and mutates ONE field to verify the behavior is
 * monotonic and in the expected direction.
 */

function withOverride(patch: Partial<CalculationInput>): CalculationInput {
  return { ...referenceHouse, ...patch };
}

describe('v2: shading', () => {
  it('interior blinds reduce cooling solar gain vs none', () => {
    const none = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, shading: 'none' },
      })
    );
    const blinds = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, shading: 'interior_blinds' },
      })
    );
    expect(blinds.coolingTotal).toBeLessThan(none.coolingTotal);
  });

  it('exterior blinds reduce solar more than interior blinds', () => {
    const interior = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, shading: 'interior_blinds' },
      })
    );
    const exterior = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, shading: 'exterior_blinds' },
      })
    );
    expect(exterior.coolingTotal).toBeLessThan(interior.coolingTotal);
  });
});

describe('v2: frame material', () => {
  it('aluminum frame increases window heating load vs wood', () => {
    const wood = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, frameMaterial: 'wood' },
      })
    );
    const alum = calculateLoads(
      withOverride({
        windows: { ...referenceHouse.windows, frameMaterial: 'aluminum' },
      })
    );
    expect(alum.heatingTotal).toBeGreaterThan(wood.heatingTotal);
  });
});

describe('v2: altitude', () => {
  it('higher altitude reduces infiltration load', () => {
    const sea = calculateLoads(withOverride({ altitude: 'sea_level' }));
    const high = calculateLoads(withOverride({ altitude: '5000_ft' }));
    const seaInf = sea.components.find((c) => c.component === 'infiltration')!;
    const highInf = high.components.find((c) => c.component === 'infiltration')!;
    expect(highInf.heating).toBeLessThan(seaInf.heating);
  });

  it('meta includes densityRatio', () => {
    const r = calculateLoads(withOverride({ altitude: '5000_ft' }));
    expect(r.meta.densityRatio).toBeCloseTo(0.83, 2);
  });
});

describe('v2: roof pitch', () => {
  it('steep pitch increases roof load vs flat', () => {
    const flat = calculateLoads(
      withOverride({
        envelope: { ...referenceHouse.envelope, roofPitch: 'flat' },
      })
    );
    const steep = calculateLoads(
      withOverride({
        envelope: { ...referenceHouse.envelope, roofPitch: 'steep' },
      })
    );
    const flatRoof = flat.components.find((c) => c.component === 'roof')!;
    const steepRoof = steep.components.find((c) => c.component === 'roof')!;
    expect(steepRoof.heating).toBeGreaterThan(flatRoof.heating);
  });
});

describe('v2: duct losses', () => {
  it('ducts in attic with R-4 increase total vs conditioned space', () => {
    const conditioned = calculateLoads(
      withOverride({ ducts: { location: 'conditioned', rValue: 8 } })
    );
    const attic = calculateLoads(
      withOverride({ ducts: { location: 'attic', rValue: 4 } })
    );
    expect(attic.heatingTotal).toBeGreaterThan(conditioned.heatingTotal);
    expect(attic.coolingTotal).toBeGreaterThan(conditioned.coolingTotal);
  });

  it('better duct insulation (R-15) reduces loss vs R-0', () => {
    const r0 = calculateLoads(
      withOverride({ ducts: { location: 'attic', rValue: 0 } })
    );
    const r15 = calculateLoads(
      withOverride({ ducts: { location: 'attic', rValue: 15 } })
    );
    expect(r15.heatingTotal).toBeLessThan(r0.heatingTotal);
  });

  it('duct loss does NOT scale internal loads (lights, occupants)', () => {
    const conditioned = calculateLoads(
      withOverride({ ducts: { location: 'conditioned', rValue: 8 } })
    );
    const attic = calculateLoads(
      withOverride({ ducts: { location: 'attic', rValue: 4 } })
    );
    const cInt = conditioned.components.find((c) => c.component === 'internal')!;
    const aInt = attic.components.find((c) => c.component === 'internal')!;
    expect(aInt.coolingSensible).toBeCloseTo(cInt.coolingSensible, 1);
  });
});

describe('v2: mechanical ventilation', () => {
  it('ERV reduces vent load vs exhaust-only at same CFM', () => {
    const exhaust = calculateLoads(
      withOverride({
        ventilation: { type: 'exhaust_only', cfm: 60 },
      })
    );
    const erv = calculateLoads(
      withOverride({
        ventilation: { type: 'balanced_erv', cfm: 60 },
      })
    );
    expect(erv.coolingTotal).toBeLessThan(exhaust.coolingTotal);
    expect(erv.heatingTotal).toBeLessThan(exhaust.heatingTotal);
  });

  it('HRV recovers sensible but not latent', () => {
    const hrv = calculateLoads(
      withOverride({ ventilation: { type: 'balanced_hrv', cfm: 60 } })
    );
    const erv = calculateLoads(
      withOverride({ ventilation: { type: 'balanced_erv', cfm: 60 } })
    );
    // ERV handles latent too → lower cooling latent contribution
    expect(erv.coolingLatentTotal).toBeLessThan(hrv.coolingLatentTotal);
  });
});

describe('v2: garage partition', () => {
  it('attached garage adds heating load', () => {
    const noGarage = calculateLoads(
      withOverride({ garage: { attached: false, sharedWallArea: 0, wallRValue: 11 } })
    );
    const garage = calculateLoads(
      withOverride({
        garage: { attached: true, sharedWallArea: 200, wallRValue: 11 },
      })
    );
    expect(garage.heatingTotal).toBeGreaterThan(noGarage.heatingTotal);
  });
});

describe('v2: lighting type', () => {
  it('LED lighting reduces internal sensible vs incandescent', () => {
    const incand = calculateLoads(
      withOverride({
        internal: { ...referenceHouse.internal, lightingType: 'incandescent' },
      })
    );
    const led = calculateLoads(
      withOverride({
        internal: { ...referenceHouse.internal, lightingType: 'led' },
      })
    );
    expect(led.coolingSensibleTotal).toBeLessThan(incand.coolingSensibleTotal);
  });
});

describe('v2: activity level', () => {
  it('heavy activity increases latent cooling', () => {
    const moderate = calculateLoads(
      withOverride({
        internal: { ...referenceHouse.internal, activityLevel: 'moderate' },
      })
    );
    const heavy = calculateLoads(
      withOverride({
        internal: { ...referenceHouse.internal, activityLevel: 'heavy' },
      })
    );
    expect(heavy.coolingLatentTotal).toBeGreaterThan(moderate.coolingLatentTotal);
  });
});
