import type { FoundationType } from '@/lib/calc/presets/foundation';

/**
 * Foundation heating loss. Three formulations depending on type:
 *
 * - slab: F-factor method, q = F * perimeter * dT
 * - heated_basement: U * area_below * (T_indoor - T_ground)
 *     Ground temperature is approximated by the annual average outdoor
 *     temp; below-grade area is approximated as perimeter * 7 ft (typical
 *     basement wall height).
 * - crawlspace: U * floor_area * dT * crawlFactor
 *     crawlFactor=0.5 for vented crawls (outside air mixing), 1.0 for
 *     sealed.
 *
 * All formulations return BTU/hr. Cooling contribution from foundations
 * is typically negligible in residential Manual J and is excluded.
 */
export function foundationHeatingLoad(args: {
  type: FoundationType;
  factor: number;
  perimeter: number;
  floorArea: number;
  dT: number;
  /** For basements: T_indoor - T_ground; for slab/crawl: same as dT winter */
  groundDT?: number;
  crawlFactor?: number;
}): number {
  switch (args.type) {
    case 'slab':
      return args.factor * args.perimeter * args.dT;

    case 'heated_basement': {
      // Approximate below-grade wall area as perimeter * 7 ft
      const wallArea = args.perimeter * 7;
      const gDT = args.groundDT ?? args.dT;
      return args.factor * wallArea * gDT;
    }

    case 'crawlspace': {
      const mult = args.crawlFactor ?? 0.5;
      return args.factor * args.floorArea * args.dT * mult;
    }
  }
}
