import {
  AIR_SENSIBLE_CONSTANT,
  AIR_LATENT_CONSTANT,
} from '@/lib/calc/constants/physical';

/**
 * Compute CFM from air changes per hour and building volume.
 *
 *   CFM = ACH * volume (ft³) / 60
 */
export function infiltrationCFM(ach: number, volume: number): number {
  return (ach * volume) / 60;
}

/**
 * Sensible heat transfer due to air infiltration.
 *
 *   q = 1.08 * ρ * CFM * dT
 *
 * Where ρ is the altitude density ratio (1.0 at sea level, lower at
 * higher elevation). The baseline 1.08 constant bundles air density at
 * sea level, specific heat, and min-to-hr conversion.
 */
export function infiltrationSensible(args: {
  cfm: number;
  dT: number;
  densityRatio?: number;
}): number {
  const rho = args.densityRatio ?? 1.0;
  return AIR_SENSIBLE_CONSTANT * rho * args.cfm * args.dT;
}

/**
 * Latent heat transfer due to moisture entering with infiltrating air.
 *
 *   q = 0.68 * ρ * CFM * dW_grains
 *
 * where dW_grains is the difference in humidity ratio between outdoor
 * and indoor air, in grains of moisture per lb dry air. Cooling only.
 */
export function infiltrationLatent(args: {
  cfm: number;
  humidityRatioDelta: number;
  densityRatio?: number;
}): number {
  const rho = args.densityRatio ?? 1.0;
  return AIR_LATENT_CONSTANT * rho * args.cfm * args.humidityRatioDelta;
}
