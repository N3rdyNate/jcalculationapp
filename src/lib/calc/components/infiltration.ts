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
 *   q = 1.08 * CFM * dT
 *
 * The constant 1.08 bundles: air density (0.075 lb/ft³)
 *                          * specific heat (0.24 BTU/lb·°F)
 *                          * 60 min/hr
 */
export function infiltrationSensible(args: {
  cfm: number;
  dT: number;
}): number {
  return AIR_SENSIBLE_CONSTANT * args.cfm * args.dT;
}

/**
 * Latent heat transfer due to moisture entering with infiltrating air.
 *
 *   q = 0.68 * CFM * dW_grains
 *
 * where dW_grains is the difference in humidity ratio between outdoor
 * and indoor air, expressed in grains of moisture per lb dry air.
 * Cooling only.
 */
export function infiltrationLatent(args: {
  cfm: number;
  humidityRatioDelta: number;
}): number {
  return AIR_LATENT_CONSTANT * args.cfm * args.humidityRatioDelta;
}
