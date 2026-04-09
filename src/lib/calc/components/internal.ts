import { WATT_TO_BTUH } from '@/lib/calc/constants/physical';
import {
  OCCUPANCY_ACTIVITY,
  type ActivityLevel,
} from '@/lib/calc/constants/occupancy';
import {
  LIGHTING_W_PER_SQFT,
  type LightingType,
} from '@/lib/calc/constants/lighting';

/**
 * Resolve lighting wattage — if a type is given, use W/ft² × floor area,
 * otherwise use the explicit wattage from the form.
 */
export function resolveLightingWatts(args: {
  lightingType?: LightingType;
  lightingWatts: number;
  squareFootage: number;
}): number {
  if (args.lightingType) {
    return LIGHTING_W_PER_SQFT[args.lightingType] * args.squareFootage;
  }
  return args.lightingWatts;
}

/**
 * Internal sensible cooling load. Occupant per-person BTU depends on
 * activity level (light/moderate/heavy).
 *
 * Per Manual J convention, internal loads are EXCLUDED from the heating
 * calculation (a conservative choice that sizes the heating system
 * without relying on incidental gains).
 */
export function internalSensible(args: {
  occupants: number;
  applianceWatts: number;
  lightingWatts: number;
  activityLevel?: ActivityLevel;
}): number {
  const activity = args.activityLevel ?? 'moderate';
  const perPerson = OCCUPANCY_ACTIVITY[activity].sensible;
  return (
    args.occupants * perPerson +
    (args.applianceWatts + args.lightingWatts) * WATT_TO_BTUH
  );
}

/**
 * Internal latent load from occupant respiration and perspiration.
 */
export function internalLatent(args: {
  occupants: number;
  activityLevel?: ActivityLevel;
}): number {
  const activity = args.activityLevel ?? 'moderate';
  return args.occupants * OCCUPANCY_ACTIVITY[activity].latent;
}
