/**
 * Per-occupant sensible and latent cooling load by activity level.
 *
 * - sedentary: sleeping, resting, reading (bedrooms at night)
 * - light:    seated, TV, computer use (living room baseline)
 * - moderate: standing, cooking, light household work (ASHRAE default)
 * - heavy:    housework, walking, childcare
 * - vigorous: exercise, dancing, active play
 *
 * Values in BTU/hr per person. These are standard ASHRAE Handbook of
 * Fundamentals figures for an adult; female/child corrections are
 * ignored at this level of detail.
 *
 * The legacy three-level enum ('light'/'moderate'/'heavy') is preserved
 * so that scenarios saved before the expansion keep working.
 */

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'heavy'
  | 'vigorous';

export interface OccupantLoad {
  sensible: number;
  latent: number;
}

export const OCCUPANCY_ACTIVITY: Record<ActivityLevel, OccupantLoad> = {
  sedentary: { sensible: 150, latent: 100 },
  light: { sensible: 200, latent: 150 },
  moderate: { sensible: 230, latent: 200 },
  heavy: { sensible: 300, latent: 300 },
  vigorous: { sensible: 400, latent: 400 },
};
