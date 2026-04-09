/**
 * Internal load presets for appliances and lighting. Occupancy is NOT
 * included here — it defaults to bedrooms+1 per Manual J convention,
 * handled in the form.
 */

export interface InternalLoadPreset {
  id: string;
  label: string;
  description: string;
  applianceWatts: number;
  lightingWatts: number;
}

export const INTERNAL_LOAD_PRESETS: InternalLoadPreset[] = [
  {
    id: 'typical_home',
    label: 'Typical home (Manual J defaults)',
    description: 'Standard kitchen + laundry appliance allowance',
    applianceWatts: 1200,
    lightingWatts: 800,
  },
  {
    id: 'efficient_home',
    label: 'Efficient (LED + ENERGY STAR appliances)',
    description: 'All-LED lighting, modern efficient appliances',
    applianceWatts: 800,
    lightingWatts: 200,
  },
  {
    id: 'heavy_use',
    label: 'Heavy use (home office, gaming)',
    description: 'Multiple computers, large displays, additional plug loads',
    applianceWatts: 2000,
    lightingWatts: 1200,
  },
];

export function getInternalLoadPreset(id: string): InternalLoadPreset | undefined {
  return INTERNAL_LOAD_PRESETS.find((p) => p.id === id);
}
