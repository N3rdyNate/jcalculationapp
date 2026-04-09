/**
 * Roof surface-area multiplier by pitch. The factor is the ratio of
 * slope length to horizontal run, so a 2000 ft² footprint becomes
 * `2000 * multiplier` of actual roof surface.
 *
 *   multiplier = sqrt(run² + rise²) / run   (run = 12)
 *
 * Legacy values ('flat'/'low'/'standard'/'steep') are kept alongside
 * the granular X/12 values so that previously saved scenarios in the
 * database continue to render without migration.
 */

export type RoofPitch =
  // Legacy coarse buckets — kept for backwards compatibility with
  // scenarios saved before the granular pitches were added.
  | 'flat'
  | 'low'
  | 'standard'
  | 'steep'
  // Granular rise/run pitches.
  | '1_12'
  | '2_12'
  | '3_12'
  | '4_12'
  | '5_12'
  | '6_12'
  | '7_12'
  | '8_12'
  | '9_12'
  | '10_12'
  | '11_12'
  | '12_12';

export const ROOF_PITCH_MULTIPLIER: Record<RoofPitch, number> = {
  // Legacy aliases
  flat: 1.0,
  low: 1.06, // ≈ 2/12
  standard: 1.12, // ≈ 6/12
  steep: 1.41, // ≈ 12/12
  // Granular (computed from sqrt(144 + rise²) / 12, rounded to 3dp)
  '1_12': 1.003,
  '2_12': 1.014,
  '3_12': 1.031,
  '4_12': 1.054,
  '5_12': 1.083,
  '6_12': 1.118,
  '7_12': 1.158,
  '8_12': 1.202,
  '9_12': 1.25,
  '10_12': 1.302,
  '11_12': 1.357,
  '12_12': 1.414,
};
