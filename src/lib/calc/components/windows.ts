import { CLTD } from '@/lib/calc/constants/cltd';
import { SCL, type Orientation } from '@/lib/calc/constants/scl';

/**
 * Heating conduction through a single window pane (one orientation).
 *
 *   q = U * A * dT
 */
export function windowHeatingConduction(args: {
  uValue: number;
  area: number;
  dT: number;
}): number {
  return args.uValue * args.area * args.dT;
}

/**
 * Cooling conduction through a window (excluding solar gain).
 *
 *   q = U * A * CLTD_glass
 */
export function windowCoolingConduction(args: {
  uValue: number;
  area: number;
}): number {
  return args.uValue * args.area * CLTD.glass;
}

/**
 * Solar heat gain through a window (cooling only).
 *
 *   q = SHGC * A * SCL[orientation]
 *
 * Uses peak-hour SCL at ~40°N latitude.
 */
export function windowSolarGain(args: {
  shgc: number;
  area: number;
  orientation: Orientation;
}): number {
  return args.shgc * args.area * SCL[args.orientation];
}
