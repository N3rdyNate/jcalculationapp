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
};

/** House geometry and basic dimensions */
export interface HouseInput {
  squareFootage: number;
  ceilingHeight: number;
  stories: number;
  /** Optional override; if not provided, engine computes `4*sqrt(sqft/stories)` */
  perimeter?: number;
  /** Number of bedrooms (used only to default occupancy at the UI level) */
  bedrooms?: number;
}

/** Basement conditioning state — only meaningful for basement foundation types */
export type BasementConditioning = 'conditioned' | 'unconditioned' | 'semi';

/** Opaque envelope specs */
export interface EnvelopeInput {
  wallRValue: number;
  wallMass: WallMass;
  /** Square feet of exterior doors; subtracted from wall area */
  doorArea: number;
  doorUValue: number;
  roofRValue: number;
  roofColor: RoofColor;
  /** Roof slope affects surface area */
  roofPitch?: RoofPitch;
  /** Whether the attic is vented (affects roof CLTD) */
  atticVented?: boolean;
  foundationType: FoundationType;
  /** F-factor for slabs OR effective U for basement/crawl walls */
  foundationFactor: number;
  /** Multiplier applied only to crawlspace heat loss (vented = 0.5) */
  crawlFactor?: number;
  /** Conditioning state for basement-type foundations */
  basementConditioning?: BasementConditioning;
  /** Whether floor above a crawlspace / basement is insulated */
  floorInsulated?: boolean;
}

/** Glazing spec for one facade or global */
export interface GlazingSpec {
  uValue: number;
  shgc: number;
  area: number;
}

/** Windows input — discriminated union: global or per-orientation */
export type WindowsInput = (
  | {
      mode: 'global';
      uValue: number;
      shgc: number;
      /** Area keyed by up to 8 orientations; unused default to 0 */
      areaByOrientation: Partial<Record<Orientation, number>>;
    }
  | {
      mode: 'per_orientation';
      byOrientation: Partial<Record<Orientation, GlazingSpec>>;
    }
) & {
  shading?: ShadingType;
  frameMaterial?: FrameMaterial;
};

export interface InfiltrationInput {
  ach: number;
}

export interface InternalInput {
  occupants: number;
  applianceWatts: number;
  lightingWatts: number;
  /** Optional activity level override for per-occupant sensible/latent */
  activityLevel?: ActivityLevel;
  /** Optional lighting technology; when set, overrides raw lightingWatts */
  lightingType?: LightingType;
}

export interface DuctsInput {
  location: DuctLocation;
  rValue: DuctRValue;
}

export interface VentilationInput {
  type: VentilationType;
  cfm: number;
}

export interface GarageInput {
  attached: boolean;
  sharedWallArea: number;
  wallRValue: number;
}

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
}

/** A single named component load (e.g. "walls", "windows_solar_W") */
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
}
