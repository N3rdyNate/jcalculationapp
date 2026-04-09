/**
 * Roof overhang solar shading factor.
 *
 * An overhang of depth D above a window of height H shades a fraction
 * of the glass that depends on the sun angle. Rather than computing
 * exact solar geometry (which requires latitude + hour angle), we use
 * a simplified lookup that Manual J recommends: the overhang ratio
 *
 *   R = D / H
 *
 * maps to a shading reduction multiplier applied to the window's
 * solar cooling load. The factor is 1.0 (no reduction) when R = 0 and
 * decreases as the overhang grows relative to the window height.
 *
 * Approximate values for mid-latitudes (35–45°N), south/SW/SE facing:
 *
 *   R = 0    → 1.00  (no overhang)
 *   R = 0.25 → 0.85
 *   R = 0.5  → 0.65
 *   R = 0.75 → 0.50
 *   R ≥ 1.0  → 0.40  (deep porch / fully shaded)
 *
 * For east/west-facing windows the sun strikes at a low angle and
 * overhangs are less effective; we apply a 50% penalty (factor moves
 * halfway back toward 1.0).
 *
 * Reference: ACCA Manual J 8th, Table 3B notes on exterior shading.
 */

import type { Orientation } from '@/lib/calc/constants/scl';

/** Pre-computed breakpoints for interpolation. */
const OVERHANG_TABLE: [ratio: number, factor: number][] = [
  [0, 1.0],
  [0.25, 0.85],
  [0.5, 0.65],
  [0.75, 0.5],
  [1.0, 0.4],
];

function interpolateOverhangFactor(ratio: number): number {
  if (ratio <= 0) return 1.0;
  for (let i = 1; i < OVERHANG_TABLE.length; i++) {
    const [r0, f0] = OVERHANG_TABLE[i - 1];
    const [r1, f1] = OVERHANG_TABLE[i];
    if (ratio <= r1) {
      const t = (ratio - r0) / (r1 - r0);
      return f0 + t * (f1 - f0);
    }
  }
  return OVERHANG_TABLE[OVERHANG_TABLE.length - 1][1]; // cap at deepest
}

/** Orientations where overhangs are less effective (low sun angle). */
const LOW_SUN: Set<Orientation> = new Set(['E', 'W', 'NE', 'NW']);

/**
 * Compute the overhang shading multiplier for a window.
 *
 * @param overhangDepth  Horizontal projection of the overhang (ft)
 * @param windowHeight   Height of the window opening (ft)
 * @param orientation    Cardinal/intercardinal direction the window faces
 * @returns Multiplier in [0.4, 1.0] applied to the solar cooling load
 */
export function overhangShadingFactor(
  overhangDepth: number,
  windowHeight: number,
  orientation: Orientation
): number {
  if (overhangDepth <= 0 || windowHeight <= 0) return 1.0;
  const ratio = overhangDepth / windowHeight;
  const baseFactor = interpolateOverhangFactor(ratio);

  // East/west: overhang is half as effective due to low sun angle
  if (LOW_SUN.has(orientation)) {
    return 1.0 - (1.0 - baseFactor) * 0.5;
  }
  // North: sun rarely strikes directly; overhang has minimal effect
  if (orientation === 'N') return 1.0;

  return baseFactor;
}
