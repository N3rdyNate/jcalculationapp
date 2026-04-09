/**
 * Attic insulation material properties.
 *
 * Maps a material type to its R-value per inch of installed depth.
 * Users can specify depth in inches; the engine computes the attic
 * insulation R-value as `rPerInch * depthInches`, overriding the
 * legacy single `roofRValue` field when present.
 *
 * Reference: DOE / ORNL insulation fact sheet and ASHRAE 90.1 Table A6.
 */

export type AtticInsulationType =
  | 'blown_fiberglass'
  | 'blown_cellulose'
  | 'fiberglass_batts'
  | 'mineral_wool_batts'
  | 'spray_foam_open'
  | 'spray_foam_closed';

export interface InsulationMaterial {
  label: string;
  rPerInch: number;
}

export const ATTIC_INSULATION: Record<AtticInsulationType, InsulationMaterial> = {
  blown_fiberglass: { label: 'Blown fiberglass', rPerInch: 2.5 },
  blown_cellulose: { label: 'Blown cellulose', rPerInch: 3.5 },
  fiberglass_batts: { label: 'Fiberglass batts', rPerInch: 3.2 },
  mineral_wool_batts: { label: 'Mineral wool batts', rPerInch: 3.8 },
  spray_foam_open: { label: 'Open-cell spray foam', rPerInch: 3.7 },
  spray_foam_closed: { label: 'Closed-cell spray foam', rPerInch: 6.5 },
};

/**
 * Compute attic insulation R-value from material type and depth.
 */
export function atticRValue(
  type: AtticInsulationType,
  depthInches: number
): number {
  return ATTIC_INSULATION[type].rPerInch * depthInches;
}
