import { describe, it, expect } from 'vitest';
import { recommendEquipmentSizing, compareToRuleOfThumb } from '@/lib/calc/sizing';
import { validateInput, validateResults } from '@/lib/calc/validation';
import { generateChecklist } from '@/lib/calc/checklist';
import { calculateLoads } from '@/lib/calc/engine';
import { referenceHouse } from '@/tests/fixtures/ashrae-reference-house';
import type { CalculationInput, CalculationResult } from '@/lib/calc/types';

// ---------------------------------------------------------------------------
// Equipment sizing
// ---------------------------------------------------------------------------
describe('recommendEquipmentSizing', () => {
  it('30,000 BTU/hr cooling → 2.5 tons', () => {
    const s = recommendEquipmentSizing(35000, 30000);
    expect(s.coolingTons).toBe(2.5);
    expect(s.coolingBtuh).toBe(30000);
  });

  it('14,000 BTU/hr cooling → 1.5 tons (rounds up)', () => {
    const s = recommendEquipmentSizing(20000, 14000);
    expect(s.coolingTons).toBe(1.5);
  });

  it('heating rounds to nearest 5,000', () => {
    const s = recommendEquipmentSizing(32000, 24000);
    expect(s.heatingBtuh).toBe(35000);
    expect(s.heatingMBH).toBe(35);
  });

  it('includes oversizing warning in note', () => {
    const s = recommendEquipmentSizing(30000, 24000);
    expect(s.note).toContain('short cycling');
  });
});

// ---------------------------------------------------------------------------
// Rule of thumb comparison
// ---------------------------------------------------------------------------
describe('compareToRuleOfThumb', () => {
  it('22,000 BTU for 1100 sqft → not flagged (0%)', () => {
    const r = compareToRuleOfThumb(22000, 1100, []);
    expect(r.flagged).toBe(false);
  });

  it('40,000 BTU for 1000 sqft → flagged (100% over)', () => {
    const r = compareToRuleOfThumb(40000, 1000, [
      { component: 'windows', label: 'Windows', percent: 40 },
    ]);
    expect(r.flagged).toBe(true);
    expect(r.deviationPct).toBeGreaterThan(90);
    expect(r.explanation).toBeDefined();
  });

  it('10,000 BTU for 1000 sqft → flagged (50% under)', () => {
    const r = compareToRuleOfThumb(10000, 1000, []);
    expect(r.flagged).toBe(true);
    expect(r.deviationPct).toBeLessThan(-40);
  });
});

// ---------------------------------------------------------------------------
// Validation warnings
// ---------------------------------------------------------------------------
describe('validateInput', () => {
  it('flags infiltration ACH > 1.5', () => {
    const input: CalculationInput = {
      ...referenceHouse,
      infiltration: { ach: 2.0 },
    };
    const w = validateInput(input);
    expect(w.some((w) => w.component === 'infiltration')).toBe(true);
  });

  it('flags duct leakage > 25%', () => {
    const input: CalculationInput = {
      ...referenceHouse,
      ducts: { location: 'attic', rValue: 8, leakagePct: 30 },
    };
    const w = validateInput(input);
    expect(w.some((w) => w.component === 'ducts')).toBe(true);
  });

  it('no warnings for reference house', () => {
    const w = validateInput(referenceHouse);
    expect(w).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Field checklist
// ---------------------------------------------------------------------------
describe('generateChecklist', () => {
  it('includes blower door target', () => {
    const result = calculateLoads(referenceHouse);
    const cl = generateChecklist(referenceHouse, result);
    expect(cl.some((i) => i.category === 'Air Sealing')).toBe(true);
  });

  it('includes thermal imaging priorities', () => {
    const result = calculateLoads(referenceHouse);
    const cl = generateChecklist(referenceHouse, result);
    expect(cl.some((i) => i.category === 'Thermal Imaging Priority')).toBe(true);
  });

  it('includes insulation verification', () => {
    const result = calculateLoads(referenceHouse);
    const cl = generateChecklist(referenceHouse, result);
    expect(cl.some((i) => i.category === 'Insulation')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Engine integration: Phase 3 fields are populated
// ---------------------------------------------------------------------------
describe('engine populates Phase 3 output fields', () => {
  const result = calculateLoads(referenceHouse);

  it('equipmentSizing is present', () => {
    expect(result.equipmentSizing).toBeDefined();
    expect(result.equipmentSizing!.coolingTons).toBeGreaterThan(0);
  });

  it('ruleOfThumbComparison is present', () => {
    expect(result.ruleOfThumbComparison).toBeDefined();
    expect(result.ruleOfThumbComparison!.ruleOfThumbBtuh).toBe(20 * 2000);
  });

  it('latentSensiblePct is present', () => {
    expect(result.latentSensiblePct).toBeDefined();
    expect(result.latentSensiblePct!.sensiblePct + result.latentSensiblePct!.latentPct).toBeCloseTo(100, 0);
  });

  it('fieldChecklist has items', () => {
    expect(result.fieldChecklist.length).toBeGreaterThan(0);
  });

  it('warnings array exists (may be empty for ref house)', () => {
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
