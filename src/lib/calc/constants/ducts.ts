/**
 * Duct heat loss fractions by location and insulation level. This is a
 * multiplier applied to the TOTAL envelope load to account for air
 * leakage and conduction from ductwork outside the conditioned space.
 *
 * - Ducts inside conditioned space: zero loss (the heat stays in the house)
 * - Ducts in the attic, garage, or crawlspace: losses scale with dT and
 *   inversely with insulation R-value
 *
 * Values below are typical Manual J / ACCA Manual D recommendations.
 */

export type DuctLocation =
  | 'conditioned'
  | 'attic'
  | 'garage'
  | 'crawlspace';

export type DuctRValue = 0 | 4 | 8 | 15;

type DuctLossTable = Record<DuctLocation, Record<DuctRValue, number>>;

export const DUCT_LOSS_TABLE: DuctLossTable = {
  conditioned: { 0: 0, 4: 0, 8: 0, 15: 0 },
  attic: { 0: 0.35, 4: 0.22, 8: 0.15, 15: 0.1 },
  garage: { 0: 0.28, 4: 0.18, 8: 0.12, 15: 0.08 },
  crawlspace: { 0: 0.2, 4: 0.14, 8: 0.1, 15: 0.07 },
};

export function getDuctLossFraction(
  location: DuctLocation,
  rValue: DuctRValue
): number {
  return DUCT_LOSS_TABLE[location][rValue];
}
