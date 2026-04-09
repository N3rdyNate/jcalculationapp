import {
  OCCUPANT_SENSIBLE,
  OCCUPANT_LATENT,
  WATT_TO_BTUH,
} from '@/lib/calc/constants/physical';

/**
 * Internal sensible cooling load from occupants, appliances, and lighting.
 *
 *   q_sensible = OCCUPANT_SENSIBLE * people
 *              + WATT_TO_BTUH * (applianceWatts + lightingWatts)
 *
 * Per Manual J convention, internal loads are EXCLUDED from the heating
 * calculation (a conservative choice that sizes the heating system
 * without relying on incidental gains).
 */
export function internalSensible(args: {
  occupants: number;
  applianceWatts: number;
  lightingWatts: number;
}): number {
  return (
    args.occupants * OCCUPANT_SENSIBLE +
    (args.applianceWatts + args.lightingWatts) * WATT_TO_BTUH
  );
}

/**
 * Internal latent load from occupant respiration and perspiration.
 *
 *   q_latent = OCCUPANT_LATENT * people
 */
export function internalLatent(occupants: number): number {
  return occupants * OCCUPANT_LATENT;
}
