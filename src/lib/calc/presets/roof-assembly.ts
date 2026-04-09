/**
 * Roof / ceiling assembly presets. `rValue` is effective whole-assembly R.
 */

export interface RoofAssemblyPreset {
  id: string;
  label: string;
  description: string;
  rValue: number;
}

export const ROOF_ASSEMBLY_PRESETS: RoofAssemblyPreset[] = [
  {
    id: 'r19_vented',
    label: 'R-19 batt, vented attic',
    description: 'Pre-1990 minimum',
    rValue: 18,
  },
  {
    id: 'r30_vented',
    label: 'R-30 batt, vented attic',
    description: 'Older code minimum',
    rValue: 28,
  },
  {
    id: 'r38_vented',
    label: 'R-38 blown, vented attic',
    description: 'IECC zones 2-3',
    rValue: 36,
  },
  {
    id: 'r49_vented',
    label: 'R-49 blown, vented attic',
    description: 'IECC zones 4-6',
    rValue: 47,
  },
  {
    id: 'r60_vented',
    label: 'R-60 blown, vented attic',
    description: 'IECC zone 7-8 / high-performance',
    rValue: 57,
  },
  {
    id: 'r38_cathedral',
    label: 'R-38 cathedral (sealed)',
    description: 'No attic; spray foam or dense-pack',
    rValue: 35,
  },
  {
    id: 'sip_roof_r40',
    label: 'SIPs roof R-40',
    description: 'Structural insulated panel roof',
    rValue: 40,
  },
];

export function getRoofAssemblyPreset(id: string): RoofAssemblyPreset | undefined {
  return ROOF_ASSEMBLY_PRESETS.find((p) => p.id === id);
}
