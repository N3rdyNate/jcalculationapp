/**
 * Field verification checklist generator.
 *
 * After calculation, generates a list of items for an HVAC technician
 * to verify on-site: blower door targets, duct test targets, insulation
 * depths, window dimensions, and thermal imaging priorities.
 */

import type {
  CalculationInput,
  CalculationResult,
  FieldChecklistItem,
} from '@/lib/calc/types';

export function generateChecklist(
  input: CalculationInput,
  result: CalculationResult
): FieldChecklistItem[] {
  const items: FieldChecklistItem[] = [];

  // ---- Blower door test target -----------------------------------
  const ach = input.infiltration.ach;
  const ach50Est = ach * 18; // rough inverse of N-factor
  items.push({
    category: 'Air Sealing',
    item: `Blower door test target: ≤${ach50Est.toFixed(1)} ACH50 (based on ${ach} natural ACH input)`,
  });
  if (input.infiltration.ach50) {
    items.push({
      category: 'Air Sealing',
      item: `Blower door test result entered: ${input.infiltration.ach50} ACH50`,
    });
  }

  // ---- Duct blaster test target ----------------------------------
  if (input.ducts && input.ducts.location !== 'conditioned') {
    const leakage = input.ducts.leakagePct ?? 'estimated from table';
    items.push({
      category: 'Duct Sealing',
      item: `Duct blaster target: ≤${typeof leakage === 'number' ? leakage + '%' : leakage} leakage to outside`,
    });
    items.push({
      category: 'Duct Sealing',
      item: `Verify duct location: ${input.ducts.location}`,
    });
    items.push({
      category: 'Duct Sealing',
      item: `Verify duct insulation: R-${input.ducts.rValue}`,
    });
  }

  // ---- Attic insulation ------------------------------------------
  if (input.envelope.atticInsulationType && input.envelope.atticInsulationDepth) {
    items.push({
      category: 'Insulation',
      item: `Verify attic insulation: ${input.envelope.atticInsulationType.replace(/_/g, ' ')} at ${input.envelope.atticInsulationDepth}" depth (R-${input.envelope.roofRValue})`,
    });
  } else {
    items.push({
      category: 'Insulation',
      item: `Verify attic insulation R-value: R-${input.envelope.roofRValue}`,
    });
  }

  items.push({
    category: 'Insulation',
    item: `Verify wall insulation: R-${input.envelope.wallRValue}${input.envelope.framingPct ? ` (${(input.envelope.framingPct * 100).toFixed(0)}% framing)` : ''}`,
  });

  // ---- Foundation ------------------------------------------------
  items.push({
    category: 'Foundation',
    item: `Verify foundation type: ${input.envelope.foundationType.replace(/_/g, ' ')}`,
  });
  if (input.envelope.slabEdgeInsulated) {
    items.push({
      category: 'Foundation',
      item: `Verify slab edge insulation: R-${input.envelope.slabEdgeRValue ?? '?'} at ${input.envelope.slabEdgeDepth ?? '?'} ft depth`,
    });
  }

  // ---- Crawlspace / duct location confirmation -------------------
  if (
    input.envelope.foundationType === 'vented_crawlspace' ||
    input.envelope.foundationType === 'unvented_crawlspace'
  ) {
    items.push({
      category: 'Foundation',
      item: `Confirm crawlspace type: ${input.envelope.foundationType.replace(/_/g, ' ')}`,
    });
  }

  // ---- Windows ---------------------------------------------------
  if (input.rooms && input.rooms.length > 0) {
    for (const room of input.rooms) {
      for (const win of room.windows) {
        items.push({
          category: 'Windows',
          item: `${room.name}: ${win.orientation} window ${win.width}' × ${win.height}' — U=${win.uValue}, SHGC=${win.shgc}`,
          room: room.name,
        });
      }
    }
  } else {
    // Whole-house mode: list area by orientation
    if (input.windows.mode === 'global') {
      for (const [orient, area] of Object.entries(input.windows.areaByOrientation)) {
        if (area && area > 0) {
          items.push({
            category: 'Windows',
            item: `${orient}: ${area} ft² — U=${input.windows.uValue}, SHGC=${input.windows.shgc}`,
          });
        }
      }
    }
  }

  // ---- Thermal imaging priorities --------------------------------
  const topLoss = result.topHeatingContributors.slice(0, 5);
  for (const c of topLoss) {
    items.push({
      category: 'Thermal Imaging Priority',
      item: `${c.label}: ${c.percent.toFixed(0)}% of heating load — inspect for thermal bridging, air leaks, or missing insulation`,
    });
  }

  // ---- Fireplace -------------------------------------------------
  if (input.fireplace && input.fireplace.type !== 'none') {
    items.push({
      category: 'Air Sealing',
      item: `Fireplace: ${input.fireplace.type.replace(/_/g, ' ')} — verify damper seals tightly when closed`,
    });
  }

  return items;
}
