/**
 * Mechanical ventilation defaults and recovery efficiencies.
 *
 * - none: no mechanical ventilation, load is zero
 * - exhaust_only: full outside air load (no recovery)
 * - supply_only: full outside air load (no recovery)
 * - balanced_erv: heat AND moisture recovery (sensible + latent)
 * - balanced_hrv: heat recovery only (sensible, not latent)
 *
 * Typical ASHRAE 62.2 residential ventilation rate:
 *   cfm ≈ 0.03 * conditioned_floor_area + 7.5 * (bedrooms + 1)
 * The form captures `cfm` directly and the engine does not compute a
 * default.
 */

export type VentilationType =
  | 'none'
  | 'exhaust_only'
  | 'supply_only'
  | 'balanced_erv'
  | 'balanced_hrv';

export interface VentilationRecovery {
  sensibleRecovery: number;
  latentRecovery: number;
}

export const VENTILATION_RECOVERY: Record<VentilationType, VentilationRecovery> = {
  none: { sensibleRecovery: 1.0, latentRecovery: 1.0 },
  exhaust_only: { sensibleRecovery: 0.0, latentRecovery: 0.0 },
  supply_only: { sensibleRecovery: 0.0, latentRecovery: 0.0 },
  balanced_erv: { sensibleRecovery: 0.75, latentRecovery: 0.6 },
  balanced_hrv: { sensibleRecovery: 0.7, latentRecovery: 0.0 },
};
