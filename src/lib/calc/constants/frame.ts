/**
 * Frame material U-value multipliers. Applied to the whole-window U-value
 * coming from the glazing preset. Aluminum frames are significant thermal
 * bridges and penalize overall U; wood/vinyl are baseline; fiberglass is
 * slightly better than vinyl.
 */

export type FrameMaterial = 'wood' | 'vinyl' | 'aluminum' | 'fiberglass';

export const FRAME_U_MULTIPLIER: Record<FrameMaterial, number> = {
  wood: 1.0,
  vinyl: 1.0,
  fiberglass: 0.95,
  aluminum: 1.25,
};
