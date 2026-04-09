/**
 * Foundation presets. Each preset encodes both the foundation TYPE
 * (slab / heated_basement / crawlspace) and the insulation level,
 * which together determine the F-factor (slab) or effective U-value
 * (basement/crawl) used in the heating calc.
 */

export type FoundationType = 'slab' | 'heated_basement' | 'crawlspace';

export interface FoundationPreset {
  id: string;
  label: string;
  description: string;
  type: FoundationType;
  /**
   * For slabs: F-factor in BTU/(hr·ft·°F) applied to perimeter × dT.
   * For basements and crawlspaces: effective U-value in BTU/(hr·ft²·°F)
   * applied to the conditioned surface area.
   */
  factor: number;
  /**
   * Crawlspace only: multiplier on the computed heat loss (0.5 for
   * vented crawl because outside air mixing reduces effective dT).
   */
  crawlFactor?: number;
}

export const FOUNDATION_PRESETS: FoundationPreset[] = [
  {
    id: 'slab_uninsulated',
    label: 'Slab-on-grade, uninsulated',
    description: 'No edge insulation',
    type: 'slab',
    factor: 0.73,
  },
  {
    id: 'slab_r5_edge',
    label: 'Slab-on-grade, R-5 edge (2 ft)',
    description: 'R-5 rigid foam, 2 ft vertical at perimeter',
    type: 'slab',
    factor: 0.55,
  },
  {
    id: 'slab_r10_edge',
    label: 'Slab-on-grade, R-10 edge (2 ft)',
    description: 'R-10 rigid foam, 2 ft vertical at perimeter',
    type: 'slab',
    factor: 0.5,
  },
  {
    id: 'slab_r10_full',
    label: 'Slab-on-grade, R-10 full under',
    description: 'Continuous R-10 under entire slab',
    type: 'slab',
    factor: 0.42,
  },
  {
    id: 'basement_uninsulated',
    label: 'Heated basement, uninsulated walls',
    description: 'Bare concrete walls below grade',
    type: 'heated_basement',
    factor: 0.35,
  },
  {
    id: 'basement_r10',
    label: 'Heated basement, R-10 walls',
    description: 'R-10 rigid foam on interior',
    type: 'heated_basement',
    factor: 0.12,
  },
  {
    id: 'basement_r15',
    label: 'Heated basement, R-15 walls',
    description: 'R-15 continuous insulation',
    type: 'heated_basement',
    factor: 0.09,
  },
  {
    id: 'crawl_vented_r19_floor',
    label: 'Vented crawl, R-19 floor above',
    description: 'R-19 batts in floor joists over vented crawl',
    type: 'crawlspace',
    factor: 0.053, // 1/R-19 ≈ 0.053
    crawlFactor: 0.5,
  },
  {
    id: 'crawl_sealed_r10_wall',
    label: 'Sealed crawl, R-10 walls',
    description: 'Encapsulated crawl with R-10 wall insulation',
    type: 'crawlspace',
    factor: 0.1,
    crawlFactor: 1.0,
  },
];

export function getFoundationPreset(id: string): FoundationPreset | undefined {
  return FOUNDATION_PRESETS.find((p) => p.id === id);
}
