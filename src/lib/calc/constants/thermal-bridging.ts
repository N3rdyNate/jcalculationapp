/**
 * Thermal bridging adjustment for framed walls.
 *
 * In a typical wood-frame wall, studs (R ≈ 1.0 per inch for softwood,
 * i.e. ~R-4.4 for a 2×4 and ~R-6.9 for a 2×6) short-circuit the
 * cavity insulation. The parallel-path method computes the overall
 * effective R from the framing fraction and the stud R-value:
 *
 *   U_eff = framingPct × U_stud + (1 - framingPct) × U_cavity
 *   R_eff = 1 / U_eff
 *
 * Typical framing fractions:
 *   Standard 16" OC: 23–25%
 *   Advanced framing 24" OC: 15–18%
 *   OVE (Optimum Value Engineered): 12–15%
 *
 * Reference: ASHRAE Handbook of Fundamentals, Ch. 27 (Thermal
 * Insulation and Vapor Retarders).
 */

/**
 * R-value per inch for solid-sawn softwood lumber (SPF / Douglas fir).
 * Used to compute stud R from wall depth.
 */
export const WOOD_R_PER_INCH = 1.1;

/** Common stud depths */
export type StudDepth = 3.5 | 5.5; // 2×4 = 3.5", 2×6 = 5.5"

/**
 * Compute the effective (whole-wall) R-value accounting for thermal
 * bridging through the framing.
 *
 * @param cavityR   Nominal cavity insulation R-value (e.g. 13 for R-13 batts)
 * @param framingPct Fraction of wall area that is studs (e.g. 0.23)
 * @param studDepth  Stud depth in inches (3.5 for 2×4, 5.5 for 2×6)
 * @returns Effective R-value (always ≤ cavityR)
 */
export function effectiveWallR(
  cavityR: number,
  framingPct: number,
  studDepth: StudDepth = 3.5
): number {
  if (cavityR <= 0 || framingPct <= 0) return cavityR;
  if (framingPct >= 1) return studDepth * WOOD_R_PER_INCH;
  const studR = studDepth * WOOD_R_PER_INCH;
  const uStud = 1 / studR;
  const uCavity = 1 / cavityR;
  const uEff = framingPct * uStud + (1 - framingPct) * uCavity;
  return 1 / uEff;
}
