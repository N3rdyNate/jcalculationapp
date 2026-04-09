/**
 * Room-level load calculation.
 *
 * Each room contributes independently to the whole-house total via
 * its own walls, windows, skylights, doors, ceiling/roof, and floor.
 * Infiltration and internal loads are distributed proportionally from
 * the house-level total.
 */

import type {
  RoomInput,
  RoomResult,
  ComponentLoad,
  Orientation,
  ValidationWarning,
} from '@/lib/calc/types';
import { ORIENTATIONS } from '@/lib/calc/constants/scl';
import { SHADING_FACTORS } from '@/lib/calc/constants/shading';
import { FRAME_U_MULTIPLIER } from '@/lib/calc/constants/frame';
import { ROOF_PITCH_MULTIPLIER } from '@/lib/calc/constants/roof-pitch';
import { CLTD } from '@/lib/calc/constants/cltd';
import { overhangShadingFactor } from '@/lib/calc/constants/overhang';
import { resolveWallR, wallHeatingLoad, wallCoolingLoad } from '@/lib/calc/components/walls';
import { roofHeatingLoad, roofCoolingLoad } from '@/lib/calc/components/roof';
import {
  windowHeatingConduction,
  windowCoolingConduction,
  windowSolarGain,
} from '@/lib/calc/components/windows';
import {
  skylightHeatingConduction,
  skylightCoolingConduction,
  skylightSolarGain,
} from '@/lib/calc/components/skylight';

/** Shared context passed from the house-level engine. */
export interface HouseContext {
  dTWinter: number;
  dTSummer: number;
  groundDT: number;
  densityRatio: number;
  humidityRatioDelta: number;
  /** House-level defaults (used when room doesn't override) */
  defaultWallR: number;
  defaultWallMass: 'light' | 'medium' | 'heavy';
  defaultRoofR: number;
  defaultRoofColor: 'light' | 'medium' | 'dark';
  defaultFoundationFactor: number;
  defaultFoundationType: string;
}

/**
 * Calculate heating and cooling loads for a single room.
 *
 * @param room    The room's input data (walls, windows, skylights, etc.)
 * @param ctx     Shared house-level constants and design temps
 * @param infiltrationShare  This room's share of whole-house infiltration BTU/hr
 * @param internalShare      This room's share of internal loads
 */
export function calculateRoomLoad(
  room: RoomInput,
  ctx: HouseContext,
  infiltrationShare: { heating: number; coolingSensible: number; coolingLatent: number },
  internalShare: { coolingSensible: number; coolingLatent: number }
): RoomResult {
  const components: ComponentLoad[] = [];
  const warnings: ValidationWarning[] = [];

  // ---- Walls -------------------------------------------------------
  let totalWallArea = 0;
  let totalWindowArea = 0;
  let totalDoorArea = 0;

  for (const door of room.doors ?? []) {
    totalDoorArea += door.area;
  }

  for (const win of room.windows) {
    totalWindowArea += win.width * win.height;
  }

  for (const wall of room.walls) {
    if (wall.partyWall) continue; // shared interior wall, no load

    const wallHeight = room.ceilingHeight;
    const grossArea = wall.length * wallHeight;
    // Subtract windows and doors on this orientation
    const winAreaOnWall = room.windows
      .filter((w) => w.orientation === wall.orientation)
      .reduce((s, w) => s + w.width * w.height, 0);
    const doorAreaOnWall = (room.doors ?? [])
      .filter((d) => d.orientation === wall.orientation)
      .reduce((s, d) => s + d.area, 0);
    const netArea = Math.max(0, grossArea - winAreaOnWall - doorAreaOnWall);
    totalWallArea += grossArea;

    const rEff = resolveWallR({
      rValue: wall.rValue,
      framingPct: wall.framingPct,
      studDepth: wall.studDepth,
    });

    components.push({
      component: `wall_${wall.orientation}`,
      label: `Wall ${wall.orientation} (${room.name})`,
      heating: wallHeatingLoad({ rValue: rEff, netArea, dT: ctx.dTWinter }),
      coolingSensible: wallCoolingLoad({ rValue: rEff, netArea, mass: wall.mass }),
      coolingLatent: 0,
    });
  }

  // ---- Windows (conduction + solar) --------------------------------
  let winCondHeating = 0;
  let winCondCooling = 0;
  for (const win of room.windows) {
    const area = win.width * win.height;
    const frameMult = FRAME_U_MULTIPLIER[win.frameMaterial ?? 'vinyl'];
    const uAdj = win.uValue * frameMult;

    winCondHeating += windowHeatingConduction({ uValue: uAdj, area, dT: ctx.dTWinter });
    winCondCooling += windowCoolingConduction({ uValue: uAdj, area });

    // Solar gain
    const shading = win.shading ?? 'none';
    const shadeFactor = SHADING_FACTORS[shading];
    const ovhFactor = win.overhangDepth
      ? overhangShadingFactor(win.overhangDepth, win.height, win.orientation)
      : 1.0;

    const solar = windowSolarGain({
      shgc: win.shgc,
      area,
      orientation: win.orientation,
    }) * shadeFactor * ovhFactor;

    components.push({
      component: `window_solar_${win.orientation}_${room.name}`,
      label: `Window solar ${win.orientation} (${room.name})`,
      heating: 0,
      coolingSensible: solar,
      coolingLatent: 0,
    });
  }
  if (winCondHeating > 0 || winCondCooling > 0) {
    components.push({
      component: `windows_cond_${room.name}`,
      label: `Windows conduction (${room.name})`,
      heating: winCondHeating,
      coolingSensible: winCondCooling,
      coolingLatent: 0,
    });
  }

  // ---- Skylights ---------------------------------------------------
  if (room.skylights && room.skylights.length > 0) {
    let skyH = 0, skyCS = 0, skySol = 0;
    for (const sky of room.skylights) {
      skyH += skylightHeatingConduction({ uValue: sky.uValue, area: sky.area, dT: ctx.dTWinter });
      skyCS += skylightCoolingConduction({ uValue: sky.uValue, area: sky.area });
      skySol += skylightSolarGain({ shgc: sky.shgc, area: sky.area });
    }
    components.push({
      component: `skylights_${room.name}`,
      label: `Skylights (${room.name})`,
      heating: skyH,
      coolingSensible: skyCS + skySol,
      coolingLatent: 0,
    });
  }

  // ---- Doors -------------------------------------------------------
  for (const door of room.doors ?? []) {
    components.push({
      component: `door_${door.orientation}_${room.name}`,
      label: `Door ${door.orientation} (${room.name})`,
      heating: door.uValue * door.area * ctx.dTWinter,
      coolingSensible: door.uValue * door.area * CLTD.door,
      coolingLatent: 0,
    });
  }

  // ---- Ceiling / roof ----------------------------------------------
  const ceilingType = room.ceilingType ?? 'flat';
  const pitch = ceilingType !== 'flat' && room.ceilingPitch
    ? ROOF_PITCH_MULTIPLIER[room.ceilingPitch] ?? 1.0
    : 1.0;
  const roofArea = room.squareFootage * pitch;

  components.push({
    component: `roof_${room.name}`,
    label: `Roof / Ceiling (${room.name})`,
    heating: roofHeatingLoad({ rValue: ctx.defaultRoofR, area: roofArea, dT: ctx.dTWinter }),
    coolingSensible: roofCoolingLoad({ rValue: ctx.defaultRoofR, area: roofArea, color: ctx.defaultRoofColor }),
    coolingLatent: 0,
  });

  // ---- Infiltration share ------------------------------------------
  components.push({
    component: `infiltration_${room.name}`,
    label: `Infiltration (${room.name})`,
    ...infiltrationShare,
  });

  // ---- Internal loads share ----------------------------------------
  components.push({
    component: `internal_${room.name}`,
    label: `Internal (${room.name})`,
    heating: 0,
    ...internalShare,
  });

  // ---- Window-to-wall ratio ----------------------------------------
  const grossWallArea = totalWallArea > 0 ? totalWallArea : room.squareFootage;
  const wwr = grossWallArea > 0 ? totalWindowArea / grossWallArea : 0;
  if (wwr > 0.2) {
    warnings.push({
      severity: 'warn',
      component: 'windows',
      message: `Window-to-wall ratio is ${(wwr * 100).toFixed(0)}% (exceeds 20% guideline)`,
      room: room.name,
    });
  }

  // ---- Aggregate ---------------------------------------------------
  const heating = components.reduce((s, c) => s + c.heating, 0);
  const coolingSensible = components.reduce((s, c) => s + c.coolingSensible, 0);
  const coolingLatent = components.reduce((s, c) => s + c.coolingLatent, 0);

  // Room load sanity checks
  const btuhPerSqft = (heating + coolingSensible + coolingLatent) / room.squareFootage;
  if (btuhPerSqft > 60) {
    warnings.push({
      severity: 'warn',
      component: 'total',
      message: `Room load is ${btuhPerSqft.toFixed(0)} BTU/sqft — unusually high. Check inputs.`,
      room: room.name,
    });
  }
  if (btuhPerSqft < 5 && room.squareFootage > 50) {
    warnings.push({
      severity: 'info',
      component: 'total',
      message: `Room load is ${btuhPerSqft.toFixed(0)} BTU/sqft — unusually low.`,
      room: room.name,
    });
  }

  return {
    name: room.name,
    squareFootage: room.squareFootage,
    heating,
    coolingSensible,
    coolingLatent,
    coolingTotal: coolingSensible + coolingLatent,
    components,
    windowToWallRatio: wwr,
    warnings,
  };
}
