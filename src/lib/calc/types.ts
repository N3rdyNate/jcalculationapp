import type { FoundationType } from '@/lib/calc/presets/foundation';
import type { WallMass, RoofColor } from '@/lib/calc/constants/cltd';
import type { Orientation } from '@/lib/calc/constants/scl';

export type { FoundationType, WallMass, RoofColor, Orientation };

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

/** Opaque envelope specs */
export interface EnvelopeInput {
  wallRValue: number;
  wallMass: WallMass;
  /** Square feet of exterior doors; subtracted from wall area */
  doorArea: number;
  doorUValue: number;
  roofRValue: number;
  roofColor: RoofColor;
  foundationType: FoundationType;
  /** F-factor for slabs OR effective U for basement/crawl walls */
  foundationFactor: number;
  /** Multiplier applied only to crawlspace heat loss (vented = 0.5) */
  crawlFactor?: number;
}

/** Window input — discriminated union: global or per-orientation */
export type WindowsInput =
  | {
      mode: 'global';
      uValue: number;
      shgc: number;
      areaByOrientation: Record<Orientation, number>;
    }
  | {
      mode: 'per_orientation';
      byOrientation: Record<
        Orientation,
        { uValue: number; shgc: number; area: number }
      >;
    };

export interface InfiltrationInput {
  ach: number;
}

export interface InternalInput {
  occupants: number;
  applianceWatts: number;
  lightingWatts: number;
}

export interface CalculationInput {
  climateZoneId: string;
  house: HouseInput;
  envelope: EnvelopeInput;
  windows: WindowsInput;
  infiltration: InfiltrationInput;
  internal: InternalInput;
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
    calculatedAt: string;
  };
}
