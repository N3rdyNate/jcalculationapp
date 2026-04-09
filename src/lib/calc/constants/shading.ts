/**
 * Solar gain multipliers by shading strategy. Multiplied into the
 * `SHGC * area * SCL` solar gain term so that shading reduces (never
 * increases) solar cooling load.
 */

export type ShadingType =
  | 'none'
  | 'interior_blinds'
  | 'exterior_blinds'
  | 'awnings'
  | 'trees';

export const SHADING_FACTORS: Record<ShadingType, number> = {
  none: 1.0,
  interior_blinds: 0.7,
  exterior_blinds: 0.25,
  awnings: 0.35,
  trees: 0.5,
};
