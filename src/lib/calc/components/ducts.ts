import {
  DUCT_LOSS_TABLE,
  type DuctLocation,
  type DuctRValue,
} from '@/lib/calc/constants/ducts';

/**
 * Returns the multiplier to apply to envelope totals to account for
 * duct losses. `1.0` means no loss (ducts in conditioned space).
 *
 * Usage in engine:
 *   totalLoad *= ductLossMultiplier(location, rValue)
 */
export function ductLossMultiplier(
  location: DuctLocation,
  rValue: DuctRValue
): number {
  return 1 + DUCT_LOSS_TABLE[location][rValue];
}

/**
 * Returns just the fraction (0–0.35) for display purposes.
 */
export function ductLossFraction(
  location: DuctLocation,
  rValue: DuctRValue
): number {
  return DUCT_LOSS_TABLE[location][rValue];
}
