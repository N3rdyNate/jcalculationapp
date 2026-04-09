/**
 * Per-occupant sensible and latent cooling load by activity level.
 *
 * - light: seated, light TV/computer use (baseline for bedrooms, living room)
 * - moderate: standing, cooking, light household work (ASHRAE default)
 * - heavy: exercise, dancing, active play
 *
 * Values in BTU/hr per person. These are standard ASHRAE Handbook of
 * Fundamentals figures for an adult male; female/child corrections are
 * ignored at this level of detail.
 */

export type ActivityLevel = 'light' | 'moderate' | 'heavy';

export interface OccupantLoad {
  sensible: number;
  latent: number;
}

export const OCCUPANCY_ACTIVITY: Record<ActivityLevel, OccupantLoad> = {
  light: { sensible: 200, latent: 150 },
  moderate: { sensible: 230, latent: 200 },
  heavy: { sensible: 300, latent: 300 },
};
