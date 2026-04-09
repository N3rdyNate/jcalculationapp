import type {
  CalculationInput,
  CalculationResult,
  ComponentLoad,
  Contributor,
  Orientation,
  GlazingSpec,
} from '@/lib/calc/types';
import { getClimateZone } from '@/lib/calc/constants/climate-zones';
import {
  DEFAULT_INDOOR_WINTER,
  DEFAULT_INDOOR_SUMMER,
} from '@/lib/calc/constants/physical';
import { ORIENTATIONS } from '@/lib/calc/constants/scl';
import { SHADING_FACTORS } from '@/lib/calc/constants/shading';
import { FRAME_U_MULTIPLIER } from '@/lib/calc/constants/frame';
import { ALTITUDE_DENSITY_RATIO } from '@/lib/calc/constants/altitude';
import { ROOF_PITCH_MULTIPLIER } from '@/lib/calc/constants/roof-pitch';
import { CLTD } from '@/lib/calc/constants/cltd';
import { FIREPLACE_ACH_PENALTY } from '@/lib/calc/constants/fireplace';
import { atticRValue } from '@/lib/calc/constants/attic-insulation';
import { overhangShadingFactor } from '@/lib/calc/constants/overhang';
import { netWallArea, resolveWallR, wallHeatingLoad, wallCoolingLoad } from '@/lib/calc/components/walls';
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
  ach50ToNaturalAch,
  estimateAchFromQuality,
} from '@/lib/calc/components/infiltration';
import {
  internalSensible,
  internalLatent,
  resolveLightingWatts,
} from '@/lib/calc/components/internal';
import { foundationHeatingLoad } from '@/lib/calc/components/foundation';
import { ductLossMultiplier, ductLossFraction } from '@/lib/calc/components/ducts';
import {
  ventilationSensible,
  ventilationLatent,
} from '@/lib/calc/components/ventilation';
import {
  garagePartitionHeating,
  garagePartitionCooling,
} from '@/lib/calc/components/garage';
import {
  skylightHeatingConduction,
  skylightCoolingConduction,
  skylightSolarGain,
} from '@/lib/calc/components/skylight';

/**
 * Normalize the windows input to a uniform per-orientation table so the
 * engine can iterate without branching on `mode`.
 */
function normalizeWindows(
  windows: CalculationInput['windows']
): Record<Orientation, GlazingSpec> {
  const result = {} as Record<Orientation, GlazingSpec>;
  for (const o of ORIENTATIONS) {
    result[o] = { uValue: 0, shgc: 0, area: 0 };
  }
  if (windows.mode === 'global') {
    for (const o of ORIENTATIONS) {
      const area = windows.areaByOrientation[o] ?? 0;
      result[o] = {
        uValue: windows.uValue,
        shgc: windows.shgc,
        area,
      };
    }
  } else {
    for (const o of ORIENTATIONS) {
      const spec = windows.byOrientation[o];
      if (spec) result[o] = spec;
    }
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
 * Resolve the effective natural ACH from the infiltration input.
 * Supports three methods:
 *   - natural_ach (legacy): use the `ach` field directly
 *   - ach50: convert blower-door result to natural ACH
 *   - estimate: map construction quality label to ACH
 * Falls back to the `ach` field for backwards compatibility.
 */
function resolveInfiltrationACH(
  input: CalculationInput['infiltration'],
  stories: number
): number {
  const method = input.method ?? 'natural_ach';
  if (method === 'ach50' && input.ach50 !== undefined) {
    return ach50ToNaturalAch(input.ach50, stories);
  }
  if (method === 'estimate' && input.constructionQuality) {
    return estimateAchFromQuality(input.constructionQuality);
  }
  return input.ach;
}

export function calculateLoads(input: CalculationInput): CalculationResult {
  const zone = getClimateZone(input.climateZoneId);
  if (!zone) {
    throw new Error(`Unknown climate zone: ${input.climateZoneId}`);
  }

  const dTWinter = DEFAULT_INDOOR_WINTER - zone.winterDesignTemp;
  const dTSummer = zone.summerDesignTemp - DEFAULT_INDOOR_SUMMER;

  const altitudeBand = input.altitude ?? 'sea_level';
  const densityRatio = ALTITUDE_DENSITY_RATIO[altitudeBand];

  const perimeter =
    input.house.perimeter ??
    estimatePerimeter(input.house.squareFootage, input.house.stories);
  const volume = input.house.squareFootage * input.house.ceilingHeight;
  const footprint = input.house.squareFootage / input.house.stories;

  // Roof R-value: use attic insulation depth/material if provided
  let roofR = input.envelope.roofRValue;
  if (input.envelope.atticInsulationType && input.envelope.atticInsulationDepth) {
    roofR = atticRValue(
      input.envelope.atticInsulationType,
      input.envelope.atticInsulationDepth
    );
  }

  // Roof area modulated by pitch
  const roofPitch = input.envelope.roofPitch ?? 'flat';
  const roofArea = footprint * ROOF_PITCH_MULTIPLIER[roofPitch];

  // Wall R-value: apply thermal bridging if framing% provided
  const wallR = resolveWallR({
    rValue: input.envelope.wallRValue,
    framingPct: input.envelope.framingPct,
    studDepth: input.envelope.studDepth,
  });

  // Shading and frame material adjustments
  const shading = input.windows.shading ?? 'none';
  const shadingFactor = SHADING_FACTORS[shading];
  const frameMaterial = input.windows.frameMaterial ?? 'vinyl';
  const frameMultiplier = FRAME_U_MULTIPLIER[frameMaterial];
  const overhangDepth = input.windows.overhangDepth ?? 0;

  // Normalize windows and apply frame U multiplier
  const windowsByOrientation = normalizeWindows(input.windows);
  for (const o of ORIENTATIONS) {
    windowsByOrientation[o] = {
      ...windowsByOrientation[o],
      uValue: windowsByOrientation[o].uValue * frameMultiplier,
    };
  }
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
      rValue: wallR,
      netArea: wallNetArea,
      dT: dTWinter,
    }),
    coolingSensible: wallCoolingLoad({
      rValue: wallR,
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
      rValue: roofR,
      area: roofArea,
      dT: dTWinter,
    }),
    coolingSensible: roofCoolingLoad({
      rValue: roofR,
      area: roofArea,
      color: input.envelope.roofColor,
    }),
    coolingLatent: 0,
  });

  // ---- Windows: conduction (all 8 orientations pooled) ------------
  let winCondHeating = 0;
  let winCondCooling = 0;
  for (const o of ORIENTATIONS) {
    const w = windowsByOrientation[o];
    if (w.area <= 0) continue;
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

  // ---- Windows: solar gain per orientation (with shading + overhang)
  for (const o of ORIENTATIONS) {
    const w = windowsByOrientation[o];
    if (w.area <= 0) continue;

    // Compute overhang factor (assumes 4ft window height as default for
    // whole-house mode; per-room mode in Phase 2 will use actual height)
    const ovhFactor =
      overhangDepth > 0
        ? overhangShadingFactor(overhangDepth, 4, o)
        : 1.0;

    const solar =
      windowSolarGain({
        shgc: w.shgc,
        area: w.area,
        orientation: o,
      }) *
      shadingFactor *
      ovhFactor;

    components.push({
      component: `windows_solar_${o}`,
      label: `Windows solar ${o}`,
      heating: 0,
      coolingSensible: solar,
      coolingLatent: 0,
    });
  }

  // ---- Skylights (Phase 1) ------------------------------------------
  if (input.skylights && input.skylights.length > 0) {
    let skyCondHeating = 0;
    let skyCondCooling = 0;
    let skySolar = 0;
    for (const sky of input.skylights) {
      skyCondHeating += skylightHeatingConduction({
        uValue: sky.uValue,
        area: sky.area,
        dT: dTWinter,
      });
      skyCondCooling += skylightCoolingConduction({
        uValue: sky.uValue,
        area: sky.area,
      });
      skySolar += skylightSolarGain({
        shgc: sky.shgc,
        area: sky.area,
      });
    }
    components.push({
      component: 'skylights_conduction',
      label: 'Skylights (conduction)',
      heating: skyCondHeating,
      coolingSensible: skyCondCooling,
      coolingLatent: 0,
    });
    components.push({
      component: 'skylights_solar',
      label: 'Skylights (solar)',
      heating: 0,
      coolingSensible: skySolar,
      coolingLatent: 0,
    });
  }

  // ---- Doors -------------------------------------------------------
  components.push({
    component: 'doors',
    label: 'Doors',
    heating: input.envelope.doorUValue * input.envelope.doorArea * dTWinter,
    coolingSensible:
      input.envelope.doorUValue * input.envelope.doorArea * CLTD.door,
    coolingLatent: 0,
  });

  // ---- Infiltration (altitude-corrected, method-resolved) ----------
  const resolvedACH = resolveInfiltrationACH(
    input.infiltration,
    input.house.stories
  );

  // Add fireplace infiltration penalty
  const fireplaceACH =
    input.fireplace
      ? FIREPLACE_ACH_PENALTY[input.fireplace.type]
      : 0;
  const totalACH = resolvedACH + fireplaceACH;

  const cfm = infiltrationCFM(totalACH, volume);
  components.push({
    component: 'infiltration',
    label: fireplaceACH > 0
      ? `Infiltration (incl. ${input.fireplace!.type} fireplace)`
      : 'Infiltration',
    heating: infiltrationSensible({ cfm, dT: dTWinter, densityRatio }),
    coolingSensible: infiltrationSensible({
      cfm,
      dT: dTSummer,
      densityRatio,
    }),
    coolingLatent: infiltrationLatent({
      cfm,
      humidityRatioDelta: zone.humidityRatioDelta,
      densityRatio,
    }),
  });

  // ---- Mechanical ventilation (optional) --------------------------
  if (input.ventilation && input.ventilation.type !== 'none') {
    components.push({
      component: 'mechanical_ventilation',
      label: `Mech ventilation (${input.ventilation.type})`,
      heating: ventilationSensible({
        type: input.ventilation.type,
        cfm: input.ventilation.cfm,
        dT: dTWinter,
        densityRatio,
      }),
      coolingSensible: ventilationSensible({
        type: input.ventilation.type,
        cfm: input.ventilation.cfm,
        dT: dTSummer,
        densityRatio,
      }),
      coolingLatent: ventilationLatent({
        type: input.ventilation.type,
        cfm: input.ventilation.cfm,
        humidityRatioDelta: zone.humidityRatioDelta,
        densityRatio,
      }),
    });
  }

  // ---- Internal loads (cooling only) -------------------------------
  const resolvedLightingWatts = resolveLightingWatts({
    lightingType: input.internal.lightingType,
    lightingWatts: input.internal.lightingWatts,
    squareFootage: input.house.squareFootage,
  });
  components.push({
    component: 'internal',
    label: 'Internal (occupants, appliances, lighting)',
    heating: 0,
    coolingSensible: internalSensible({
      occupants: input.internal.occupants,
      applianceWatts: input.internal.applianceWatts,
      lightingWatts: resolvedLightingWatts,
      activityLevel: input.internal.activityLevel,
    }),
    coolingLatent: internalLatent({
      occupants: input.internal.occupants,
      activityLevel: input.internal.activityLevel,
    }),
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
      floorArea: footprint,
      dT: dTWinter,
      groundDT,
      crawlFactor: input.envelope.crawlFactor,
      basementConditioning: input.envelope.basementConditioning,
    }),
    coolingSensible: 0,
    coolingLatent: 0,
  });

  // ---- Garage partition (optional) ---------------------------------
  // Resolve garage: new `type` field takes precedence over legacy `attached`
  const garageAttached = input.garage
    ? input.garage.type
      ? input.garage.type === 'attached_unconditioned'
      : input.garage.attached
    : false;

  if (garageAttached && input.garage && input.garage.sharedWallArea > 0) {
    components.push({
      component: 'garage_partition',
      label: 'Garage partition wall',
      heating: garagePartitionHeating({
        wallRValue: input.garage.wallRValue,
        area: input.garage.sharedWallArea,
        dT: dTWinter,
      }),
      coolingSensible: garagePartitionCooling({
        wallRValue: input.garage.wallRValue,
        area: input.garage.sharedWallArea,
        dT: dTSummer,
      }),
      coolingLatent: 0,
    });
  }

  // ---- Duct losses: applied as a multiplier on totals -------------
  const ductInput = input.ducts ?? { location: 'conditioned' as const, rValue: 8 as const };
  const ductMult = ductLossMultiplier(
    ductInput.location,
    ductInput.rValue,
    ductInput.leakagePct
  );

  // Apply duct multiplier to every non-zero envelope component. Internal
  // and solar gains don't travel through ducts so they're excluded.
  const scaledComponents = components.map((c) => {
    if (
      c.component === 'internal' ||
      c.component.startsWith('windows_solar_') ||
      c.component === 'skylights_solar'
    ) {
      return c;
    }
    return {
      ...c,
      heating: c.heating * ductMult,
      coolingSensible: c.coolingSensible * ductMult,
      coolingLatent: c.coolingLatent * ductMult,
    };
  });

  // ---- Aggregate ---------------------------------------------------
  const heatingTotal = scaledComponents.reduce((acc, c) => acc + c.heating, 0);
  const coolingSensibleTotal = scaledComponents.reduce(
    (acc, c) => acc + c.coolingSensible,
    0
  );
  const coolingLatentTotal = scaledComponents.reduce(
    (acc, c) => acc + c.coolingLatent,
    0
  );
  const coolingTotal = coolingSensibleTotal + coolingLatentTotal;

  return {
    heatingTotal,
    coolingSensibleTotal,
    coolingLatentTotal,
    coolingTotal,
    components: scaledComponents,
    topHeatingContributors: rankContributors(scaledComponents, 'heating'),
    topCoolingContributors: rankContributors(scaledComponents, 'cooling'),
    inputs: input,
    meta: {
      climateZoneLabel: zone.label,
      representativeCity: zone.representativeCity,
      winterDesignTemp: zone.winterDesignTemp,
      summerDesignTemp: zone.summerDesignTemp,
      dTWinter,
      dTSummer,
      altitudeBand,
      densityRatio,
      ductLossFraction: ductLossFraction(
        ductInput.location,
        ductInput.rValue,
        ductInput.leakagePct
      ),
      calculatedAt: new Date().toISOString(),
    },
    // Phase 2/3 placeholders — populated by later phases
    rooms: [],
    warnings: [],
    fieldChecklist: [],
  };
}
