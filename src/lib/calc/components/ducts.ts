import {
  DUCT_LOSS_TABLE,
  type DuctLocation,
  type DuctRValue,
} from '@/lib/calc/constants/ducts';

/**
 * Returns the multiplier to apply to envelope totals to account for
 * duct losses. `1.0` means no loss (ducts in conditioned space).
 *
 * When `leakagePct` is provided, it overrides the table lookup.
 * The leakage percentage is the fraction of conditioned air lost
 * through duct joints and seams (e.g. 15 = 15%).
 */
export function ductLossMultiplier(
  location: DuctLocation,
  rValue: DuctRValue,
  leakagePct?: number
): number {
  return 1 + ductLossFraction(location, rValue, leakagePct);
}

/**
 * Returns just the fraction (0–0.50) for display purposes.
 *
 * When an explicit `leakagePct` is provided, it replaces the
 * table-based conduction+leakage estimate.
 */
export function ductLossFraction(
  location: DuctLocation,
  rValue: DuctRValue,
  leakagePct?: number
): number {
  if (leakagePct !== undefined && leakagePct > 0) {
    // Combine explicit leakage with a minimal conduction component
    // for unconditioned locations. Conditioned space still = 0.
    if (location === 'conditioned') return 0;
    // Base conduction from the table minus the table's own leakage
    // assumption, plus the user's measured leakage. Simplified: just
    // use the user's value directly (it subsumes both effects).
    return Math.min(leakagePct / 100, 0.5);
  }
  return DUCT_LOSS_TABLE[location][rValue];
}
