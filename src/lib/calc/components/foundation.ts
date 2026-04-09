import type {
  FoundationType,
  BasementConditioning,
} from '@/lib/calc/types';

/**
 * Foundation heating loss. Branches on foundation type:
 *
 * - slab: F-factor method, q = F * perimeter * dT
 * - heated_basement / unheated_basement: U * area_below * (T_indoor - T_ground)
 *     where area_below ≈ perimeter * 7 ft (typical basement wall height).
 *     Unheated basement is only ~half the conditioned load because it
 *     buffers outdoor air before reaching the conditioned floor above.
 *     Semi-conditioned basements get 50% of the full conditioned load.
 * - vented_crawlspace: U_floor * floor_area * dT * 0.5
 *     (0.5 because the vented air partially buffers outdoor temperature)
 * - unvented_crawlspace: U_wall * floor_area * dT (no derate)
 *
 * Cooling contribution from foundations is negligible in residential
 * Manual J and is excluded.
 */
export function foundationHeatingLoad(args: {
  type: FoundationType;
  factor: number;
  perimeter: number;
  floorArea: number;
  dT: number;
  groundDT?: number;
  crawlFactor?: number;
  basementConditioning?: BasementConditioning;
}): number {
  switch (args.type) {
    case 'slab':
      return args.factor * args.perimeter * args.dT;

    case 'heated_basement': {
      const wallArea = args.perimeter * 7;
      const gDT = args.groundDT ?? args.dT;
      const base = args.factor * wallArea * gDT;
      // Conditioning modifier: conditioned=1.0, semi=0.5, unconditioned=0 (treated as unheated)
      const cond = args.basementConditioning ?? 'conditioned';
      if (cond === 'unconditioned') return base * 0.5;
      if (cond === 'semi') return base * 0.75;
      return base;
    }

    case 'unheated_basement': {
      // Heat loss through the FLOOR above the unheated basement, not through
      // the below-grade walls directly. ~50% of what a heated basement would be.
      const wallArea = args.perimeter * 7;
      const gDT = args.groundDT ?? args.dT;
      return args.factor * wallArea * gDT * 0.5;
    }

    case 'vented_crawlspace': {
      const mult = args.crawlFactor ?? 0.5;
      return args.factor * args.floorArea * args.dT * mult;
    }

    case 'unvented_crawlspace': {
      const mult = args.crawlFactor ?? 1.0;
      return args.factor * args.floorArea * args.dT * mult;
    }
  }
}
