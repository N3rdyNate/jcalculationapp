import { CLTD, type WallMass } from '@/lib/calc/constants/cltd';
import {
  effectiveWallR,
  type StudDepth,
} from '@/lib/calc/constants/thermal-bridging';

/**
 * Net wall area = gross wall area minus windows and doors.
 * Gross wall area is perimeter × ceilingHeight × stories.
 */
export function netWallArea(args: {
  perimeter: number;
  ceilingHeight: number;
  stories: number;
  windowArea: number;
  doorArea: number;
}): number {
  const gross = args.perimeter * args.ceilingHeight * args.stories;
  const net = gross - args.windowArea - args.doorArea;
  return Math.max(0, net);
}

/**
 * Resolve the effective R-value of a wall, accounting for thermal
 * bridging when a framing percentage is provided.
 */
export function resolveWallR(args: {
  rValue: number;
  framingPct?: number;
  studDepth?: StudDepth;
}): number {
  if (args.framingPct && args.framingPct > 0) {
    return effectiveWallR(args.rValue, args.framingPct, args.studDepth);
  }
  return args.rValue;
}

/**
 * Heating conduction through walls.
 *
 *   q = U * A * dT  where U = 1/R
 *
 * @returns BTU/hr
 */
export function wallHeatingLoad(args: {
  rValue: number;
  netArea: number;
  dT: number;
}): number {
  if (args.rValue <= 0) return 0;
  const u = 1 / args.rValue;
  return u * args.netArea * args.dT;
}

/**
 * Cooling conduction through walls.
 *
 *   q = U * A * CLTD[mass]
 *
 * @returns BTU/hr
 */
export function wallCoolingLoad(args: {
  rValue: number;
  netArea: number;
  mass: WallMass;
}): number {
  if (args.rValue <= 0) return 0;
  const u = 1 / args.rValue;
  return u * args.netArea * CLTD.wall[args.mass];
}
