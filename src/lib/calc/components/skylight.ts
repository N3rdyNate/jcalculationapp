/**
 * Skylight conduction and solar gain components.
 *
 * Skylights are modeled similarly to windows: conduction through the
 * glazing (U × A × ΔT for heating, U × A × CLTD for cooling) plus
 * solar gain through SHGC.
 *
 * Because skylights are nearly horizontal, they receive higher solar
 * radiation than vertical glazing. We apply a horizontal-surface SCL
 * multiplier (1.5× the south-facing vertical value) per ASHRAE
 * simplified method.
 */

import { CLTD } from '@/lib/calc/constants/cltd';

/** Horizontal surface SCL multiplier relative to vertical south. */
const HORIZONTAL_SCL_MULTIPLIER = 1.5;

/** Approximate SCL for vertical south-facing glass (BTU/hr/ft²). */
const SOUTH_SCL = 110;

export function skylightHeatingConduction(args: {
  uValue: number;
  area: number;
  dT: number;
}): number {
  return args.uValue * args.area * args.dT;
}

export function skylightCoolingConduction(args: {
  uValue: number;
  area: number;
}): number {
  // Use the roof CLTD for horizontal glazing (conservative)
  return args.uValue * args.area * CLTD.roof.medium;
}

export function skylightSolarGain(args: {
  shgc: number;
  area: number;
}): number {
  return args.shgc * args.area * SOUTH_SCL * HORIZONTAL_SCL_MULTIPLIER;
}
