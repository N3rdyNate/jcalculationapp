/**
 * Cooling Load Temperature Difference (CLTD) table, simplified.
 *
 * These values represent the design cooling temperature difference used
 * in place of a raw dT for opaque envelope surfaces. They account for
 * solar absorption, thermal mass, and time lag.
 *
 * Values are representative for design conditions ~95°F outdoor / 75°F
 * indoor. For other climates, the daily range adjustment is applied at
 * calculation time.
 */

export type WallMass = 'light' | 'medium' | 'heavy';
export type RoofColor = 'light' | 'medium' | 'dark';

export const CLTD = {
  /**
   * Wall CLTD by construction mass:
   * - light: wood frame, vinyl/wood siding
   * - medium: brick veneer, stucco on frame
   * - heavy: solid masonry (CMU, brick, ICF)
   *
   * Heavier walls have lower CLTD due to thermal mass delaying peak heat
   * transfer outside the cooling design hour.
   */
  wall: {
    light: 22,
    medium: 18,
    heavy: 15,
  } satisfies Record<WallMass, number>,

  /**
   * Roof CLTD by color (solar absorption). Ventilation is assumed.
   * - light: white/reflective (SRI > 75)
   * - medium: tan, gray, weathered
   * - dark: brown, dark gray, black (typical asphalt shingle)
   */
  roof: {
    light: 38,
    medium: 46,
    dark: 52,
  } satisfies Record<RoofColor, number>,

  /** Glass conduction CLTD (accounts for hot outdoor air, not solar - solar handled separately). */
  glass: 14,

  /** Exterior door CLTD (solid wood or insulated steel). */
  door: 15,
};
