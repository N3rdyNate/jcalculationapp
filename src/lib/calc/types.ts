import type { FoundationType } from '@/lib/calc/presets/foundation';
import type { WallMass, RoofColor } from '@/lib/calc/constants/cltd';
import type { Orientation } from '@/lib/calc/constants/scl';
import type { ShadingType } from '@/lib/calc/constants/shading';
import type { FrameMaterial } from '@/lib/calc/constants/frame';
import type { AltitudeBand } from '@/lib/calc/constants/altitude';
import type { RoofPitch } from '@/lib/calc/constants/roof-pitch';
import type { DuctLocation, DuctRValue } from '@/lib/calc/constants/ducts';
import type { ActivityLevel } from '@/lib/calc/constants/occupancy';
import type { LightingType } from '@/lib/calc/constants/lighting';
import type { VentilationType } from '@/lib/calc/constants/ventilation';
import type { FireplaceType } from '@/lib/calc/constants/fireplace';
import type { AtticInsulationType } from '@/lib/calc/constants/attic-insulation';
import type { StudDepth } from '@/lib/calc/constants/thermal-bridging';

export type {
  FoundationType,
  WallMass,
  RoofColor,
  Orientation,
  ShadingType,
  FrameMaterial,
  AltitudeBand,
  RoofPitch,
  DuctLocation,
  DuctRValue,
  ActivityLevel,
  LightingType,
  VentilationType,
  FireplaceType,
  AtticInsulationType,
  StudDepth,
};

// ---------------------------------------------------------------------------
// House geometry
// ---------------------------------------------------------------------------

export interface HouseInput {
  squareFootage: number;
  ceilingHeight: number;
  stories: number;
  perimeter?: number;
  bedrooms?: number;
}

export type BasementConditioning = 'conditioned' | 'unconditioned' | 'semi';

// ---------------------------------------------------------------------------
// Opaque envelope
// ---------------------------------------------------------------------------

export interface EnvelopeInput {
  wallRValue: number;
  wallMass: WallMass;
  doorArea: number;
  doorUValue: number;
  roofRValue: number;
  roofColor: RoofColor;
  roofPitch?: RoofPitch;
  atticVented?: boolean;
  foundationType: FoundationType;
  foundationFactor: number;
  crawlFactor?: number;
  basementConditioning?: BasementConditioning;
  floorInsulated?: boolean;

  // --- Phase 1 additions ---
  /** Framing percentage for thermal bridging (e.g. 0.25 = 25% studs) */
  framingPct?: number;
  /** Stud depth for thermal bridging calc (3.5 for 2×4, 5.5 for 2×6) */
  studDepth?: StudDepth;
  /** Whether slab edge is insulated (slab foundation only) */
  slabEdgeInsulated?: boolean;
  /** R-value of slab edge insulation (used when slabEdgeInsulated=true) */
  slabEdgeRValue?: number;
  /** Depth of slab edge insulation in feet */
  slabEdgeDepth?: number;
  /** Attic insulation material type */
  atticInsulationType?: AtticInsulationType;
  /** Attic insulation depth in inches */
  atticInsulationDepth?: number;
  /** Floor insulation R-value (over crawlspace/basement) */
  floorRValue?: number;
  /** Floor type (for room-level override in Phase 2) */
  floorType?: 'slab' | 'over_crawlspace' | 'over_basement';
}

// ---------------------------------------------------------------------------
// Glazing
// ---------------------------------------------------------------------------

export interface GlazingSpec {
  uValue: number;
  shgc: number;
  area: number;
}

export type WindowsInput = (
  | {
      mode: 'global';
      uValue: number;
      shgc: number;
      areaByOrientation: Partial<Record<Orientation, number>>;
    }
  | {
      mode: 'per_orientation';
      byOrientation: Partial<Record<Orientation, GlazingSpec>>;
    }
) & {
  shading?: ShadingType;
  frameMaterial?: FrameMaterial;
  /** Roof overhang depth in feet (reduces solar gain) */
  overhangDepth?: number;
};

// ---------------------------------------------------------------------------
// Skylights (Phase 1 addition)
// ---------------------------------------------------------------------------

export interface SkylightInput {
  area: number;
  orientation: Orientation;
  uValue: number;
  shgc: number;
}

// ---------------------------------------------------------------------------
// Infiltration (expanded for ACH50 method)
// ---------------------------------------------------------------------------

export type InfiltrationMethod = 'natural_ach' | 'ach50' | 'estimate';
export type ConstructionQuality = 'leaky' | 'average' | 'tight' | 'very_tight' | 'passive';

export interface InfiltrationInput {
  ach: number;
  /** Method used to determine ACH; 'natural_ach' is the legacy default */
  method?: InfiltrationMethod;
  /** Blower door test result (used when method='ach50') */
  ach50?: number;
  /** Construction quality estimate (used when method='estimate') */
  constructionQuality?: ConstructionQuality;
}

// ---------------------------------------------------------------------------
// Internal loads
// ---------------------------------------------------------------------------

export interface InternalInput {
  occupants: number;
  applianceWatts: number;
  lightingWatts: number;
  activityLevel?: ActivityLevel;
  lightingType?: LightingType;
}

// ---------------------------------------------------------------------------
// Ducts (expanded for leakage percentage)
// ---------------------------------------------------------------------------

export interface DuctsInput {
  location: DuctLocation;
  rValue: DuctRValue;
  /** Explicit duct leakage percentage (0–50). When provided, overrides the table lookup. */
  leakagePct?: number;
}

// ---------------------------------------------------------------------------
// Ventilation
// ---------------------------------------------------------------------------

export interface VentilationInput {
  type: VentilationType;
  cfm: number;
}

// ---------------------------------------------------------------------------
// Garage (expanded)
// ---------------------------------------------------------------------------

export type GarageType = 'none' | 'detached' | 'attached_conditioned' | 'attached_unconditioned';

export interface GarageInput {
  /** Legacy boolean kept for backwards compat; overridden by `type` when present */
  attached: boolean;
  sharedWallArea: number;
  wallRValue: number;
  /** Expanded garage type (Phase 1) */
  type?: GarageType;
}

// ---------------------------------------------------------------------------
// Fireplace (Phase 1 addition)
// ---------------------------------------------------------------------------

export interface FireplaceInput {
  type: FireplaceType;
}

// ---------------------------------------------------------------------------
// Top-level calculation input
// ---------------------------------------------------------------------------

export interface CalculationInput {
  climateZoneId: string;
  altitude?: AltitudeBand;
  house: HouseInput;
  envelope: EnvelopeInput;
  windows: WindowsInput;
  infiltration: InfiltrationInput;
  internal: InternalInput;
  ducts?: DuctsInput;
  ventilation?: VentilationInput;
  garage?: GarageInput;
  /** Phase 1 additions */
  skylights?: SkylightInput[];
  fireplace?: FireplaceInput;
  /** Phase 2: room-by-room inputs (optional; when missing = whole-house mode) */
  rooms?: RoomInput[];
}

// ---------------------------------------------------------------------------
// Room-level inputs (Phase 2)
// ---------------------------------------------------------------------------

export type CeilingType = 'flat' | 'vaulted' | 'cathedral';
export type RoomFloorType = 'slab' | 'over_crawlspace' | 'over_basement';

export interface RoomWallInput {
  orientation: Orientation;
  length: number;
  rValue: number;
  mass: WallMass;
  /** True if this wall is shared with a conditioned neighbor (dT ≈ 0) */
  partyWall: boolean;
  /** Framing percentage override for this wall */
  framingPct?: number;
  studDepth?: StudDepth;
}

export interface RoomWindowInput {
  orientation: Orientation;
  width: number;
  height: number;
  uValue: number;
  shgc: number;
  shading?: ShadingType;
  frameMaterial?: FrameMaterial;
  overhangDepth?: number;
}

export interface RoomDoorInput {
  orientation: Orientation;
  area: number;
  uValue: number;
}

export interface RoomInput {
  name: string;
  squareFootage: number;
  ceilingHeight: number;
  ceilingType?: CeilingType;
  ceilingPitch?: RoofPitch;
  walls: RoomWallInput[];
  windows: RoomWindowInput[];
  skylights?: SkylightInput[];
  doors?: RoomDoorInput[];
  floorType?: RoomFloorType;
  floorRValue?: number;
}

// ---------------------------------------------------------------------------
// Calculation output
// ---------------------------------------------------------------------------

export interface ComponentLoad {
  component: string;
  label: string;
  heating: number;
  coolingSensible: number;
  coolingLatent: number;
}

export interface Contributor {
  component: string;
  label: string;
  btuh: number;
  percent: number;
}

// ---------------------------------------------------------------------------
// Validation + outputs (Phase 3)
// ---------------------------------------------------------------------------

export type WarningSeverity = 'info' | 'warn' | 'error';

export interface ValidationWarning {
  severity: WarningSeverity;
  component: string;
  message: string;
  room?: string;
}

export interface EquipmentSizing {
  coolingTons: number;
  coolingBtuh: number;
  heatingBtuh: number;
  heatingMBH: number;
  note: string;
}

export interface RuleOfThumbComparison {
  ruleOfThumbBtuh: number;
  calculatedBtuh: number;
  deviationPct: number;
  flagged: boolean;
  explanation?: string;
}

export interface FieldChecklistItem {
  category: string;
  item: string;
  targetValue?: string;
  room?: string;
}

export interface RoomResult {
  name: string;
  squareFootage: number;
  heating: number;
  coolingSensible: number;
  coolingLatent: number;
  coolingTotal: number;
  components: ComponentLoad[];
  windowToWallRatio: number;
  warnings: ValidationWarning[];
}

// ---------------------------------------------------------------------------
// Top-level calculation result
// ---------------------------------------------------------------------------

export interface CalculationResult {
  heatingTotal: number;
  coolingSensibleTotal: number;
  coolingLatentTotal: number;
  coolingTotal: number;
  components: ComponentLoad[];
  topHeatingContributors: Contributor[];
  topCoolingContributors: Contributor[];
  inputs: CalculationInput;
  meta: {
    climateZoneLabel: string;
    representativeCity: string;
    winterDesignTemp: number;
    summerDesignTemp: number;
    dTWinter: number;
    dTSummer: number;
    altitudeBand: AltitudeBand;
    densityRatio: number;
    ductLossFraction: number;
    calculatedAt: string;
  };

  // --- Phase 2 additions ---
  /** Per-room results (empty array in whole-house mode) */
  rooms: RoomResult[];

  // --- Phase 3 additions ---
  latentSensiblePct?: { sensiblePct: number; latentPct: number };
  equipmentSizing?: EquipmentSizing;
  ruleOfThumbComparison?: RuleOfThumbComparison;
  warnings: ValidationWarning[];
  fieldChecklist: FieldChecklistItem[];
}
