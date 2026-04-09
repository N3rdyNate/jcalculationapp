import { db } from '@/lib/db/client';
import type { CalculationInput, CalculationResult } from '@/lib/calc/types';

export interface ScenarioRow {
  id: number;
  name: string;
  description: string | null;
  input: CalculationInput;
  result: CalculationResult;
  heatingTotal: number;
  coolingTotal: number;
  climateZone: string;
  squareFootage: number;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioDBRow {
  id: number;
  name: string;
  description: string | null;
  input_json: string;
  result_json: string;
  heating_total: number;
  cooling_total: number;
  climate_zone: string;
  square_footage: number;
  created_at: string;
  updated_at: string;
}

function rowToScenario(row: ScenarioDBRow): ScenarioRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    input: JSON.parse(row.input_json) as CalculationInput,
    result: JSON.parse(row.result_json) as CalculationResult,
    heatingTotal: row.heating_total,
    coolingTotal: row.cooling_total,
    climateZone: row.climate_zone,
    squareFootage: row.square_footage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createScenario(args: {
  name: string;
  description?: string;
  input: CalculationInput;
  result: CalculationResult;
}): ScenarioRow {
  const stmt = db.prepare(`
    INSERT INTO scenarios (
      name, description, input_json, result_json,
      heating_total, cooling_total, climate_zone, square_footage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    args.name,
    args.description ?? null,
    JSON.stringify(args.input),
    JSON.stringify(args.result),
    args.result.heatingTotal,
    args.result.coolingTotal,
    args.input.climateZoneId,
    args.input.house.squareFootage
  );
  // Also log to calculation_history
  db.prepare(`
    INSERT INTO calculation_history (scenario_id, input_json, result_json)
    VALUES (?, ?, ?)
  `).run(
    info.lastInsertRowid,
    JSON.stringify(args.input),
    JSON.stringify(args.result)
  );
  return getScenario(info.lastInsertRowid as number)!;
}

export function listScenarios(opts?: {
  limit?: number;
  climateZone?: string;
}): ScenarioRow[] {
  const limit = opts?.limit ?? 100;
  let rows: ScenarioDBRow[];
  if (opts?.climateZone) {
    rows = db
      .prepare(
        `SELECT * FROM scenarios WHERE climate_zone = ? ORDER BY created_at DESC LIMIT ?`
      )
      .all(opts.climateZone, limit) as ScenarioDBRow[];
  } else {
    rows = db
      .prepare(`SELECT * FROM scenarios ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as ScenarioDBRow[];
  }
  return rows.map(rowToScenario);
}

export function getScenario(id: number): ScenarioRow | null {
  const row = db
    .prepare(`SELECT * FROM scenarios WHERE id = ?`)
    .get(id) as ScenarioDBRow | undefined;
  return row ? rowToScenario(row) : null;
}

export function deleteScenario(id: number): boolean {
  const info = db.prepare(`DELETE FROM scenarios WHERE id = ?`).run(id);
  return info.changes > 0;
}

export function getScenariosByIds(ids: number[]): ScenarioRow[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT * FROM scenarios WHERE id IN (${placeholders})`)
    .all(...ids) as ScenarioDBRow[];
  return rows.map(rowToScenario);
}
