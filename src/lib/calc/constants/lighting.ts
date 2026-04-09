/**
 * Default lighting power density by technology (W/ft²). When a lighting
 * type is selected, the engine computes
 *
 *   lightingWatts = density * squareFootage
 *
 * and overrides the raw lightingWatts field. Selecting 'mixed' matches
 * the current builder-default of ~1.2 W/ft² which is roughly the
 * existing 800W / 2000 ft² baseline from v1.
 */

export type LightingType =
  | 'incandescent'
  | 'halogen'
  | 'fluorescent'
  | 'led'
  | 'mixed';

export const LIGHTING_W_PER_SQFT: Record<LightingType, number> = {
  incandescent: 2.5,
  halogen: 2.0,
  fluorescent: 1.0,
  led: 0.5,
  mixed: 1.2,
};
