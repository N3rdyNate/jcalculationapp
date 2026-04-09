import {
  VENTILATION_RECOVERY,
  type VentilationType,
} from '@/lib/calc/constants/ventilation';
import {
  AIR_SENSIBLE_CONSTANT,
  AIR_LATENT_CONSTANT,
} from '@/lib/calc/constants/physical';

/**
 * Sensible load from mechanical ventilation, accounting for heat
 * recovery on balanced systems.
 *
 *   q_sens = 1.08 * CFM * dT * (1 - sensibleRecovery)
 *
 * where sensibleRecovery is 0 for exhaust/supply-only (no recovery)
 * and 0.7-0.75 for balanced HRV/ERV.
 */
export function ventilationSensible(args: {
  type: VentilationType;
  cfm: number;
  dT: number;
  densityRatio?: number;
}): number {
  if (args.type === 'none' || args.cfm <= 0) return 0;
  const { sensibleRecovery } = VENTILATION_RECOVERY[args.type];
  const rho = args.densityRatio ?? 1.0;
  return AIR_SENSIBLE_CONSTANT * rho * args.cfm * args.dT * (1 - sensibleRecovery);
}

/**
 * Latent load from mechanical ventilation (cooling only). Balanced ERV
 * recovers both sensible and latent; HRV only recovers sensible so the
 * latent multiplier is (1 - 0) = 1.0 for HRV.
 */
export function ventilationLatent(args: {
  type: VentilationType;
  cfm: number;
  humidityRatioDelta: number;
  densityRatio?: number;
}): number {
  if (args.type === 'none' || args.cfm <= 0) return 0;
  const { latentRecovery } = VENTILATION_RECOVERY[args.type];
  const rho = args.densityRatio ?? 1.0;
  return (
    AIR_LATENT_CONSTANT * rho * args.cfm * args.humidityRatioDelta *
    (1 - latentRecovery)
  );
}
