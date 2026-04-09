/**
 * Infiltration tightness presets. Maps a construction quality label to
 * a natural ACH (air changes per hour) value.
 *
 * Natural ACH ≈ ACH50 / N, where N ≈ 17-20 for climate zone 4 with
 * average wind exposure. The ACH50 column is provided for reference /
 * display purposes.
 */

export interface InfiltrationPreset {
  id: string;
  label: string;
  description: string;
  ach: number;
  ach50Equivalent: number;
}

export const INFILTRATION_PRESETS: InfiltrationPreset[] = [
  {
    id: 'leaky_old',
    label: 'Leaky (pre-1980, no weatherstripping)',
    description: 'Drafty older construction, single-pane windows',
    ach: 1.0,
    ach50Equivalent: 18,
  },
  {
    id: 'average_existing',
    label: 'Average existing home',
    description: 'Typical 1980s-2000s construction',
    ach: 0.5,
    ach50Equivalent: 9,
  },
  {
    id: 'tight_new',
    label: 'Tight new construction (IECC 2021)',
    description: 'Code-compliant new build with air sealing',
    ach: 0.35,
    ach50Equivalent: 5,
  },
  {
    id: 'very_tight',
    label: 'Very tight (blower-door ≤3 ACH50)',
    description: 'Dedicated air-sealing with blower-door verification',
    ach: 0.18,
    ach50Equivalent: 3,
  },
  {
    id: 'passive_house',
    label: 'Passive House (≤0.6 ACH50)',
    description: 'Certified Passive House level air tightness',
    ach: 0.04,
    ach50Equivalent: 0.6,
  },
];

export function getInfiltrationPreset(id: string): InfiltrationPreset | undefined {
  return INFILTRATION_PRESETS.find((p) => p.id === id);
}
