/**
 * Roof surface-area multiplier by pitch. Flat and low-slope roofs have
 * surface area ≈ footprint. A 6:12 pitch adds ~12% surface; 12:12 adds ~41%.
 *
 * A = sqrt(run² + rise²) / run
 *   flat  → 1.00
 *   low   → 1.06 (2:12)
 *   std   → 1.12 (6:12)
 *   steep → 1.41 (12:12)
 */

export type RoofPitch = 'flat' | 'low' | 'standard' | 'steep';

export const ROOF_PITCH_MULTIPLIER: Record<RoofPitch, number> = {
  flat: 1.0,
  low: 1.06,
  standard: 1.12,
  steep: 1.41,
};
