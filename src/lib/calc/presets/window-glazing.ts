/**
 * Window glazing presets with representative NFRC-style U-values and SHGC.
 * Values are whole-window (not center-of-glass) and are typical rather
 * than manufacturer-specific.
 */

export interface WindowGlazingPreset {
  id: string;
  label: string;
  description: string;
  uValue: number;
  shgc: number;
  /** Visible transmittance (reserved for future daylighting calcs) */
  vt: number;
}

export const WINDOW_GLAZING_PRESETS: WindowGlazingPreset[] = [
  {
    id: 'single_clear',
    label: 'Single pane, clear',
    description: 'Legacy / unconditioned spaces',
    uValue: 1.04,
    shgc: 0.75,
    vt: 0.82,
  },
  {
    id: 'double_clear',
    label: 'Double pane, clear',
    description: '1/2" air gap, no coatings',
    uValue: 0.49,
    shgc: 0.61,
    vt: 0.71,
  },
  {
    id: 'double_lowe',
    label: 'Double pane, low-e',
    description: 'Standard builder-grade low-e',
    uValue: 0.33,
    shgc: 0.42,
    vt: 0.62,
  },
  {
    id: 'double_lowe_argon',
    label: 'Double pane, low-e, argon fill',
    description: 'ENERGY STAR northern zones',
    uValue: 0.28,
    shgc: 0.38,
    vt: 0.58,
  },
  {
    id: 'double_lowe_argon_warm',
    label: 'Double pane, low-e², argon, warm-edge',
    description: 'ENERGY STAR southern (solar-control)',
    uValue: 0.25,
    shgc: 0.28,
    vt: 0.52,
  },
  {
    id: 'triple_lowe_argon',
    label: 'Triple pane, low-e, argon fill',
    description: 'Cold-climate high-performance',
    uValue: 0.2,
    shgc: 0.34,
    vt: 0.5,
  },
  {
    id: 'triple_lowe_krypton',
    label: 'Triple pane, low-e², krypton fill',
    description: 'Passive House grade',
    uValue: 0.15,
    shgc: 0.26,
    vt: 0.45,
  },
  {
    id: 'impact_double_lowe',
    label: 'Impact-rated double, low-e (hurricane)',
    description: 'Laminated, coastal code compliant',
    uValue: 0.35,
    shgc: 0.3,
    vt: 0.5,
  },
];

export function getWindowGlazingPreset(id: string): WindowGlazingPreset | undefined {
  return WINDOW_GLAZING_PRESETS.find((p) => p.id === id);
}
