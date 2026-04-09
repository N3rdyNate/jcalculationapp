/**
 * Altitude-based air density correction. Applied to the sensible and
 * latent air constants (1.08 and 0.68) because less-dense air moves
 * less mass per CFM.
 */

export type AltitudeBand = 'sea_level' | '2000_ft' | '5000_ft' | 'higher';

export const ALTITUDE_DENSITY_RATIO: Record<AltitudeBand, number> = {
  sea_level: 1.0,
  '2000_ft': 0.93,
  '5000_ft': 0.83,
  higher: 0.75,
};
