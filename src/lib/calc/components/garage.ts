/**
 * Attached-garage partition wall heat loss/gain.
 *
 * The shared wall between the conditioned house and an attached
 * (but unconditioned) garage sees a smaller temperature difference
 * than the outdoor walls. Manual J treats the garage as ~halfway
 * between indoor and outdoor, so effective dT = dT / 2.
 *
 *   q_heating = (1/R) * A * (dT_winter / 2)
 *   q_cooling = (1/R) * A * (dT_summer / 2)
 *
 * Latent load from the partition is negligible and excluded.
 */
export function garagePartitionHeating(args: {
  wallRValue: number;
  area: number;
  dT: number;
}): number {
  if (!args.wallRValue || args.area <= 0) return 0;
  return (1 / args.wallRValue) * args.area * (args.dT / 2);
}

export function garagePartitionCooling(args: {
  wallRValue: number;
  area: number;
  dT: number;
}): number {
  if (!args.wallRValue || args.area <= 0) return 0;
  return (1 / args.wallRValue) * args.area * (args.dT / 2);
}
