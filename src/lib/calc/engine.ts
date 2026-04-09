import type {
  CalculationInput,
  CalculationResult,
  ComponentLoad,
  Contributor,
  Orientation,
} from '@/lib/calc/types';
import { getClimateZone } from '@/lib/calc/constants/climate-zones';
import {
  DEFAULT_INDOOR_WINTER,
  DEFAULT_INDOOR_SUMMER,
} from '@/lib/calc/constants/physical';
import { ORIENTATIONS } from '@/lib/calc/constants/scl';
import { netWallArea, wallHeatingLoad, wallCoolingLoad } from '@/lib/calc/components/walls';
import { roofHeatingLoad, roofCoolingLoad } from '@/lib/calc/components/roof';
import {
  windowHeatingConduction,
  windowCoolingConduction,
  windowSolarGain,
} from '@/lib/calc/components/windows';
import {
  infiltrationCFM,
  infiltrationSensible,
  infiltrationLatent,
} from '@/lib/calc/components/infiltration';
import { internalSensible, internalLatent } from '@/lib/calc/components/internal';
import { foundationHeatingLoad } from '@/lib/calc/components/foundation';
import { CLTD } from '@/lib/calc/constants/cltd';

/**
 * Normalize the windows input (global OR per-orientation) to a uniform
 * per-orientation table so the engine can iterate without branching.
 */
function normalizeWindows(
  windows: CalculationInput['windows']
): Record<Orientation, { uValue: number; shgc: number; area: number }> {
  if (windows.mode === 'per_orientation') {
    return windows.byOrientation;
  }
  const result = {} as Record<
    Orientation,
    { uValue: number; shgc: number; area: number }
  >;
  for (const o of ORIENTATIONS) {
    result[o] = {
      uValue: windows.uValue,
      shgc: windows.shgc,
      area: windows.areaByOrientation[o],
    };
  }
  return result;
}

function estimatePerimeter(sqft: number, stories: number): number {
  const footprint = sqft / stories;
  return 4 * Math.sqrt(footprint);
}

function rankContributors(
  components: ComponentLoad[],
  season: 'heating' | 'cooling',
  limit = 5
): Contributor[] {
  const withTotal = components
    .map((c) => ({
      component: c.component,
      label: c.label,
      btuh:
        season === 'heating'
          ? c.heating
          : c.coolingSensible + c.coolingLatent,
    }))
    .filter((c) => c.btuh > 0);

  const sum = withTotal.reduce((acc, c) => acc + c.btuh, 0);
  return withTotal
    .sort((a, b) => b.btuh - a.btuh)
    .slice(0, limit)
    .map((c) => ({
      ...c,
      percent: sum > 0 ? (c.btuh / sum) * 100 : 0,
    }));
}

/**
 * Main entry point. Runs the full load calculation from validated input
 * and returns a structured result with per-component breakdown,
 * contributor ranking, and echo of inputs + metadata.
 */
export function calculateLoads(input: CalculationInput): CalculationResult {
  const zone = getClimateZone(input.climateZoneId);
  if (!zone) {
    throw new Error(`Unknown climate zone: ${input.climateZoneId}`);
  }

  const dTWinter = DEFAULT_INDOOR_WINTER - zone.winterDesignTemp;
  const dTSummer = zone.summerDesignTemp - DEFAULT_INDOOR_SUMMER;

  const perimeter =
    input.house.perimeter ??
    estimatePerimeter(input.house.squareFootage, input.house.stories);
  const volume =
    input.house.squareFootage * input.house.ceilingHeight;
  const ceilingArea = input.house.squareFootage / input.house.stories;

  // ---- Windows (normalize global → per-orientation) ----------------
  const windowsByOrientation = normalizeWindows(input.windows);
  const totalWindowArea = ORIENTATIONS.reduce(
    (sum, o) => sum + windowsByOrientation[o].area,
    0
  );

  const components: ComponentLoad[] = [];

  // ---- Walls -------------------------------------------------------
  const wallNetArea = netWallArea({
    perimeter,
    ceilingHeight: input.house.ceilingHeight,
    stories: input.house.stories,
    windowArea: totalWindowArea,
    doorArea: input.envelope.doorArea,
  });

  components.push({
    component: 'walls',
    label: 'Walls',
    heating: wallHeatingLoad({
      rValue: input.envelope.wallRValue,
      netArea: wallNetArea,
      dT: dTWinter,
    }),
    coolingSensible: wallCoolingLoad({
      rValue: input.envelope.wallRValue,
      netArea: wallNetArea,
      mass: input.envelope.wallMass,
    }),
    coolingLatent: 0,
  });

  // ---- Roof --------------------------------------------------------
  components.push({
    component: 'roof',
    label: 'Roof / Ceiling',
    heating: roofHeatingLoad({
      rValue: input.envelope.roofRValue,
      area: ceilingArea,
      dT: dTWinter,
    }),
    coolingSensible: roofCoolingLoad({
      rValue: input.envelope.roofRValue,
      area: ceilingArea,
      color: input.envelope.roofColor,
    }),
    coolingLatent: 0,
  });

  // ---- Windows: conduction + solar per orientation -----------------
  let winCondHeating = 0;
  let winCondCooling = 0;
  for (const o of ORIENTATIONS) {
    const w = windowsByOrientation[o];
    winCondHeating += windowHeatingConduction({
      uValue: w.uValue,
      area: w.area,
      dT: dTWinter,
    });
    winCondCooling += windowCoolingConduction({
      uValue: w.uValue,
      area: w.area,
    });
  }
  components.push({
    component: 'windows_conduction',
    label: 'Windows (conduction)',
    heating: winCondHeating,
    coolingSensible: winCondCooling,
    coolingLatent: 0,
  });

  for (const o of ORIENTATIONS) {
    const w = windowsByOrientation[o];
    const solar = windowSolarGain({
      shgc: w.shgc,
      area: w.area,
      orientation: o,
    });
    components.push({
      component: `windows_solar_${o}`,
      label: `Windows solar ${o}`,
      heating: 0,
      coolingSensible: solar,
      coolingLatent: 0,
    });
  }

  // ---- Doors -------------------------------------------------------
  const doorHeating =
    input.envelope.doorUValue * input.envelope.doorArea * dTWinter;
  const doorCooling =
    input.envelope.doorUValue * input.envelope.doorArea * CLTD.door;
  components.push({
    component: 'doors',
    label: 'Doors',
    heating: doorHeating,
    coolingSensible: doorCooling,
    coolingLatent: 0,
  });

  // ---- Infiltration ------------------------------------------------
  const cfm = infiltrationCFM(input.infiltration.ach, volume);
  components.push({
    component: 'infiltration',
    label: 'Infiltration',
    heating: infiltrationSensible({ cfm, dT: dTWinter }),
    coolingSensible: infiltrationSensible({ cfm, dT: dTSummer }),
    coolingLatent: infiltrationLatent({
      cfm,
      humidityRatioDelta: zone.humidityRatioDelta,
    }),
  });

  // ---- Internal loads (cooling only) -------------------------------
  components.push({
    component: 'internal',
    label: 'Internal (occupants, appliances, lighting)',
    heating: 0,
    coolingSensible: internalSensible({
      occupants: input.internal.occupants,
      applianceWatts: input.internal.applianceWatts,
      lightingWatts: input.internal.lightingWatts,
    }),
    coolingLatent: internalLatent(input.internal.occupants),
  });

  // ---- Foundation (heating only) -----------------------------------
  const groundDT = DEFAULT_INDOOR_WINTER - zone.annualAvgTemp;
  components.push({
    component: 'foundation',
    label: 'Foundation',
    heating: foundationHeatingLoad({
      type: input.envelope.foundationType,
      factor: input.envelope.foundationFactor,
      perimeter,
      floorArea: ceilingArea,
      dT: dTWinter,
      groundDT,
      crawlFactor: input.envelope.crawlFactor,
    }),
    coolingSensible: 0,
    coolingLatent: 0,
  });

  // ---- Aggregate ---------------------------------------------------
  const heatingTotal = components.reduce((acc, c) => acc + c.heating, 0);
  const coolingSensibleTotal = components.reduce(
    (acc, c) => acc + c.coolingSensible,
    0
  );
  const coolingLatentTotal = components.reduce(
    (acc, c) => acc + c.coolingLatent,
    0
  );
  const coolingTotal = coolingSensibleTotal + coolingLatentTotal;

  return {
    heatingTotal,
    coolingSensibleTotal,
    coolingLatentTotal,
    coolingTotal,
    components,
    topHeatingContributors: rankContributors(components, 'heating'),
    topCoolingContributors: rankContributors(components, 'cooling'),
    inputs: input,
    meta: {
      climateZoneLabel: zone.label,
      representativeCity: zone.representativeCity,
      winterDesignTemp: zone.winterDesignTemp,
      summerDesignTemp: zone.summerDesignTemp,
      dTWinter,
      dTSummer,
      calculatedAt: new Date().toISOString(),
    },
  };
}
