/**
 * Equipment sizing recommendations.
 *
 * Rounds calculated loads to the nearest standard equipment increment
 * and adds advisory notes about oversizing risks.
 */

import type { EquipmentSizing, RuleOfThumbComparison } from '@/lib/calc/types';

/**
 * Recommend equipment sizing from calculated loads.
 *
 * Cooling: round up to nearest 0.5 ton (6,000 BTU/hr increments).
 * Heating: round up to nearest 5,000 BTU/hr (MBH = thousands).
 */
export function recommendEquipmentSizing(
  heatingTotal: number,
  coolingTotal: number
): EquipmentSizing {
  const coolingTons = Math.ceil((coolingTotal / 12000) * 2) / 2; // nearest 0.5 ton
  const coolingBtuh = coolingTons * 12000;
  const heatingBtuh = Math.ceil(heatingTotal / 5000) * 5000;
  const heatingMBH = heatingBtuh / 1000;

  return {
    coolingTons,
    coolingBtuh,
    heatingBtuh,
    heatingMBH,
    note:
      'Equipment should be sized to the calculated load, not rounded up ' +
      'excessively. Oversizing causes short cycling, poor dehumidification, ' +
      'higher energy costs, and reduced equipment life. ACCA Manual S ' +
      'recommends selecting equipment within 100–115% of the Manual J load.',
  };
}

/**
 * Compare the calculated cooling load to the 20 BTU/sqft rule of thumb.
 *
 * If the deviation exceeds 25%, flag it with an explanation.
 */
export function compareToRuleOfThumb(
  coolingTotal: number,
  squareFootage: number,
  topCoolingContributors: { component: string; label: string; percent: number }[]
): RuleOfThumbComparison {
  const ruleOfThumbBtuh = 20 * squareFootage;
  const deviationPct =
    ruleOfThumbBtuh > 0
      ? ((coolingTotal - ruleOfThumbBtuh) / ruleOfThumbBtuh) * 100
      : 0;

  const flagged = Math.abs(deviationPct) > 25;

  let explanation: string | undefined;
  if (flagged) {
    const topItems = topCoolingContributors
      .slice(0, 3)
      .map((c) => `${c.label} (${c.percent.toFixed(0)}%)`)
      .join(', ');

    if (deviationPct > 0) {
      explanation =
        `Calculated cooling load (${Math.round(coolingTotal).toLocaleString()} BTU/hr) ` +
        `exceeds the 20 BTU/sqft rule of thumb (${Math.round(ruleOfThumbBtuh).toLocaleString()} BTU/hr) ` +
        `by ${Math.abs(deviationPct).toFixed(0)}%. Top contributors: ${topItems}. ` +
        `This may be due to climate severity, large window area, poor insulation, ' +
        'high infiltration, or significant duct losses.`;
    } else {
      explanation =
        `Calculated cooling load (${Math.round(coolingTotal).toLocaleString()} BTU/hr) ` +
        `is ${Math.abs(deviationPct).toFixed(0)}% below the rule of thumb ` +
        `(${Math.round(ruleOfThumbBtuh).toLocaleString()} BTU/hr). ` +
        `This suggests a well-insulated, tight envelope — the calculated ` +
        `load is more accurate than the rule of thumb.`;
    }
  }

  return {
    ruleOfThumbBtuh,
    calculatedBtuh: coolingTotal,
    deviationPct,
    flagged,
    explanation,
  };
}
