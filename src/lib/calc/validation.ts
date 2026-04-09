/**
 * Input and result validation warnings.
 *
 * These are advisory — they don't block calculation, but surface
 * potential issues with the inputs or results.
 */

import type {
  CalculationInput,
  CalculationResult,
  ValidationWarning,
} from '@/lib/calc/types';

/**
 * Validate inputs before the engine runs.
 */
export function validateInput(input: CalculationInput): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Infiltration too high
  if (input.infiltration.ach > 1.5) {
    warnings.push({
      severity: 'warn',
      component: 'infiltration',
      message: `Natural ACH of ${input.infiltration.ach} is very high. Typical range is 0.1–1.0 for residential. Check for data entry error.`,
    });
  }
  if (input.infiltration.ach < 0.02 && input.infiltration.ach > 0) {
    warnings.push({
      severity: 'info',
      component: 'infiltration',
      message: `Natural ACH of ${input.infiltration.ach} is extremely low (Passive House territory). Mechanical ventilation is essential.`,
    });
  }

  // Duct leakage high
  if (input.ducts?.leakagePct && input.ducts.leakagePct > 25) {
    warnings.push({
      severity: 'warn',
      component: 'ducts',
      message: `Duct leakage of ${input.ducts.leakagePct}% is very high. Consider duct sealing; well-sealed ducts are ≤6%.`,
    });
  }

  // Rooms: missing data
  if (input.rooms) {
    for (const room of input.rooms) {
      if (room.walls.length === 0) {
        warnings.push({
          severity: 'error',
          component: 'room',
          message: `Room "${room.name}" has no walls defined.`,
          room: room.name,
        });
      }
      if (room.squareFootage <= 0) {
        warnings.push({
          severity: 'error',
          component: 'room',
          message: `Room "${room.name}" has zero or negative square footage.`,
          room: room.name,
        });
      }
    }
  }

  return warnings;
}

/**
 * Validate results after the engine runs.
 */
export function validateResults(
  input: CalculationInput,
  result: CalculationResult
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Per-room checks are already in RoomResult.warnings from room-engine.
  // Add whole-house checks here.

  const sqft = input.house.squareFootage;

  // Cooling load sanity
  const coolingPerSqft = result.coolingTotal / sqft;
  if (coolingPerSqft > 60) {
    warnings.push({
      severity: 'warn',
      component: 'cooling_total',
      message: `Whole-house cooling load is ${coolingPerSqft.toFixed(0)} BTU/sqft — significantly above typical (15–30). Check window area, insulation, or infiltration.`,
    });
  }

  // Heating load sanity
  const heatingPerSqft = result.heatingTotal / sqft;
  if (heatingPerSqft > 60) {
    warnings.push({
      severity: 'warn',
      component: 'heating_total',
      message: `Whole-house heating load is ${heatingPerSqft.toFixed(0)} BTU/sqft — significantly above typical (15–35). Check insulation, infiltration, or climate zone.`,
    });
  }

  // Latent ratio check (humid climates)
  if (result.coolingTotal > 0) {
    const latentPct = (result.coolingLatentTotal / result.coolingTotal) * 100;
    if (latentPct > 40) {
      warnings.push({
        severity: 'info',
        component: 'latent',
        message: `Latent cooling is ${latentPct.toFixed(0)}% of total — ensure equipment has adequate dehumidification capacity.`,
      });
    }
  }

  return warnings;
}
