import type { WallMass } from '@/lib/calc/constants/cltd';

/**
 * Wall assembly presets. `rValue` is the whole-assembly effective R,
 * accounting for ~15% framing factor on wood-frame walls — users do NOT
 * need to derate manually.
 */

export interface WallAssemblyPreset {
  id: string;
  label: string;
  description: string;
  rValue: number;
  mass: WallMass;
}

export const WALL_ASSEMBLY_PRESETS: WallAssemblyPreset[] = [
  {
    id: '2x4_r13',
    label: '2x4 frame, R-13 batt',
    description: 'Typical pre-2006 construction',
    rValue: 11,
    mass: 'light',
  },
  {
    id: '2x4_r15',
    label: '2x4 frame, R-15 batt',
    description: 'Mineral wool or high-density fiberglass',
    rValue: 13,
    mass: 'light',
  },
  {
    id: '2x4_r13_ci5',
    label: '2x4 frame, R-13 + R-5 continuous',
    description: 'R-13 cavity + 1" rigid foam sheathing',
    rValue: 17,
    mass: 'light',
  },
  {
    id: '2x6_r19',
    label: '2x6 frame, R-19 batt',
    description: 'Standard 2x6 with fiberglass batts',
    rValue: 16,
    mass: 'light',
  },
  {
    id: '2x6_r21',
    label: '2x6 frame, R-21 dense-pack',
    description: 'Dense-pack cellulose or mineral wool',
    rValue: 18,
    mass: 'light',
  },
  {
    id: '2x6_r21_ci5',
    label: '2x6 frame, R-21 + R-5 continuous',
    description: 'IECC 2021 zone 5-6 compliant',
    rValue: 23,
    mass: 'light',
  },
  {
    id: 'sip_r24',
    label: 'SIPs 4.5"',
    description: 'Structural insulated panel, 4.5"',
    rValue: 24,
    mass: 'medium',
  },
  {
    id: 'sip_r40',
    label: 'SIPs 8.25"',
    description: 'Structural insulated panel, 8.25"',
    rValue: 40,
    mass: 'medium',
  },
  {
    id: 'icf_r22',
    label: 'ICF (insulated concrete form)',
    description: 'R-22 effective with thermal mass benefit',
    rValue: 22,
    mass: 'heavy',
  },
  {
    id: 'brick_veneer_r13',
    label: 'Brick veneer + 2x4 R-13',
    description: 'Brick cladding over framed wall',
    rValue: 12,
    mass: 'medium',
  },
  {
    id: 'cmu_r10',
    label: '8" CMU + R-10 interior',
    description: 'Concrete block with interior insulation',
    rValue: 11,
    mass: 'heavy',
  },
];

export function getWallAssemblyPreset(id: string): WallAssemblyPreset | undefined {
  return WALL_ASSEMBLY_PRESETS.find((p) => p.id === id);
}
