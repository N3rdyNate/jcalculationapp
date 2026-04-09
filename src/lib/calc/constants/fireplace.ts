/**
 * Fireplace infiltration penalty. An open or vented fireplace acts as
 * an additional air-leakage path. We model it as an ACH adder applied
 * to the whole-house infiltration calculation.
 *
 * Values are approximate natural-ACH equivalents from ACCA Manual J
 * guidance and ASHRAE research on chimney draft.
 */

export type FireplaceType =
  | 'none'
  | 'wood_burning'
  | 'gas_vented'
  | 'gas_unvented';

/**
 * Extra ACH added to natural infiltration when the fireplace is
 * present but not actively burning. Sealed combustion (gas unvented
 * or direct-vent) adds negligible leakage.
 */
export const FIREPLACE_ACH_PENALTY: Record<FireplaceType, number> = {
  none: 0,
  wood_burning: 0.15, // open damper + chimney draft
  gas_vented: 0.05, // B-vent or natural-draft; some draft when pilot on
  gas_unvented: 0, // sealed combustion, no chimney
};
