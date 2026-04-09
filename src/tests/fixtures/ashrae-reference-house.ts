import type { CalculationInput } from '@/lib/calc/types';

/**
 * Reference house used for end-to-end engine tests.
 *
 * Specs:
 * - 2000 ft² single-story
 * - Climate zone 4A (NYC): 14°F winter / 89°F summer
 * - Walls: R-13 (2x4 frame, effective R-11), light mass
 * - Roof: R-30 (effective R-28), medium color
 * - Windows: 300 ft² total, distributed 75 per orientation,
 *   double low-e (U=0.33, SHGC=0.42)
 * - Slab-on-grade, R-5 edge (F=0.55)
 * - 0.5 ACH (average existing home)
 * - 4 occupants, 1200W appliances, 800W lighting
 *
 * These specs are typical of a 1990s-2000s New York state single-family
 * home. The expected load totals below were computed by hand from the
 * formulas in the plan to serve as a regression target.
 */
export const referenceHouse: CalculationInput = {
  climateZoneId: '4A',
  house: {
    squareFootage: 2000,
    ceilingHeight: 8,
    stories: 1,
    bedrooms: 3,
  },
  envelope: {
    wallRValue: 11,
    wallMass: 'light',
    doorArea: 40,
    doorUValue: 0.4,
    roofRValue: 28,
    roofColor: 'medium',
    foundationType: 'slab',
    foundationFactor: 0.55,
  },
  windows: {
    mode: 'global',
    uValue: 0.33,
    shgc: 0.42,
    areaByOrientation: { N: 75, E: 75, S: 75, W: 75 },
  },
  infiltration: { ach: 0.5 },
  internal: {
    occupants: 4,
    applianceWatts: 1200,
    lightingWatts: 800,
  },
};

/**
 * Hand-computed reference totals (±5% tolerance in test).
 *
 * perimeter = 4*sqrt(2000/1) = 178.9 ft
 * gross wall area = 178.9 * 8 * 1 = 1431 ft²
 * net wall area = 1431 - 300 - 40 = 1091 ft²
 * volume = 2000 * 8 = 16000 ft³
 * CFM = 0.5 * 16000 / 60 = 133.3
 * dT_winter = 70 - 14 = 56
 * dT_summer = 89 - 75 = 14
 *
 * Heating:
 *   walls:       (1/11) * 1091 * 56    ≈ 5554
 *   roof:        (1/28) * 2000 * 56    ≈ 4000
 *   windows:     0.33 * 300 * 56       ≈ 5544
 *   doors:       0.4 * 40 * 56         ≈ 896
 *   infil:       1.08 * 133.3 * 56     ≈ 8064
 *   foundation:  0.55 * 178.9 * 56     ≈ 5511
 *                                      ----
 *                                      ≈ 29569 BTU/hr
 *
 * Cooling sensible:
 *   walls:       (1/11) * 1091 * 22    ≈ 2182
 *   roof:        (1/28) * 2000 * 46    ≈ 3286
 *   win cond:    0.33 * 300 * 14       ≈ 1386
 *   win solar:   0.42 * 75 * (30+75+55+110) = 0.42*75*270 ≈ 8505
 *   doors:       0.4 * 40 * 15         ≈ 240
 *   infil sens:  1.08 * 133.3 * 14     ≈ 2016
 *   internal:    4*230 + 3.412*(1200+800) ≈ 920 + 6824 ≈ 7744
 *                                       -----
 *                                       ≈ 25359
 *
 * Cooling latent:
 *   infil:       0.68 * 133.3 * 20     ≈ 1813
 *   internal:    4 * 200                = 800
 *                                        -----
 *                                        ≈ 2613
 *
 * Cooling total: ≈ 27972 BTU/hr
 */
export const referenceResults = {
  heating: 29569,
  coolingSensible: 25359,
  coolingLatent: 2613,
  cooling: 27972,
};
