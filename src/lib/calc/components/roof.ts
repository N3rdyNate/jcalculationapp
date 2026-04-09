import { CLTD, type RoofColor } from '@/lib/calc/constants/cltd';

/**
 * Heating conduction through roof/ceiling.
 *
 *   q = U * A * dT
 *
 * @returns BTU/hr
 */
export function roofHeatingLoad(args: {
  rValue: number;
  area: number;
  dT: number;
}): number {
  if (args.rValue <= 0) return 0;
  const u = 1 / args.rValue;
  return u * args.area * args.dT;
}

/**
 * Cooling conduction through roof/ceiling.
 *
 *   q = U * A * CLTD[color]
 *
 * Darker roofs absorb more solar radiation, increasing CLTD.
 *
 * @returns BTU/hr
 */
export function roofCoolingLoad(args: {
  rValue: number;
  area: number;
  color: RoofColor;
}): number {
  if (args.rValue <= 0) return 0;
  const u = 1 / args.rValue;
  return u * args.area * CLTD.roof[args.color];
}
