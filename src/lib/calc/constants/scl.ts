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

export type Orientation = 'N' | 'E' | 'S' | 'W';

export const SCL: Record<Orientation, number> = {
  N: 30,
  E: 75,
  S: 55,
  W: 110,
};

export const ORIENTATIONS: readonly Orientation[] = ['N', 'E', 'S', 'W'] as const;
