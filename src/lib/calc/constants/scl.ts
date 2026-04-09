/**
 * Solar Cooling Load (SCL) factors by orientation.
 *
 * Units: BTU/(hr·ft² of glass area). Represents the peak-hour solar heat
 * gain through a unit area of reference clear double-glazed window at
 * ~40°N latitude. Multiplied by actual SHGC and area to get the solar
 * cooling load contribution for that facade.
 *
 * West is the dominant afternoon solar contributor due to the coincidence
 * of low sun angle and peak outdoor temperature.
 */

export type Orientation =
  | 'N'
  | 'NE'
  | 'E'
  | 'SE'
  | 'S'
  | 'SW'
  | 'W'
  | 'NW';

export const SCL: Record<Orientation, number> = {
  N: 30,
  NE: 50,
  E: 75,
  SE: 70,
  S: 55,
  SW: 90,
  W: 110,
  NW: 80,
};

export const ORIENTATIONS: readonly Orientation[] = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

/** Original 4 cardinal orientations, kept for back-compat and form defaults. */
export const CARDINAL_ORIENTATIONS: readonly Orientation[] = [
  'N',
  'E',
  'S',
  'W',
] as const;
