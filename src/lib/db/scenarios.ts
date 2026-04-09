import { getSupabaseAdmin } from '@/lib/db/client';
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
  input_json: CalculationInput;
  result_json: CalculationResult;
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
    input: row.input_json,
    result: row.result_json,
    heatingTotal: row.heating_total,
    coolingTotal: row.cooling_total,
    climateZone: row.climate_zone,
    squareFootage: row.square_footage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createScenario(args: {
  name: string;
  description?: string;
  input: CalculationInput;
  result: CalculationResult;
}): Promise<ScenarioRow> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('scenarios')
    .insert({
      name: args.name,
      description: args.description ?? null,
      input_json: args.input,
      result_json: args.result,
      heating_total: args.result.heatingTotal,
      cooling_total: args.result.coolingTotal,
      climate_zone: args.input.climateZoneId,
      square_footage: args.input.house.squareFootage,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save scenario: ${error?.message ?? 'unknown error'}`);
  }

  // Log to calculation_history (fire-and-forget; don't block the save response
  // if history logging fails)
  void db
    .from('calculation_history')
    .insert({
      scenario_id: data.id,
      input_json: args.input,
      result_json: args.result,
    })
    .then(({ error: histErr }) => {
      if (histErr) {
        console.error('Failed to log calculation history:', histErr.message);
      }
    });

  return rowToScenario(data as ScenarioDBRow);
}

export async function listScenarios(opts?: {
  limit?: number;
  climateZone?: string;
}): Promise<ScenarioRow[]> {
  const db = getSupabaseAdmin();
  const limit = opts?.limit ?? 100;

  let query = db
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.climateZone) {
    query = query.eq('climate_zone', opts.climateZone);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list scenarios: ${error.message}`);
  }
  return (data as ScenarioDBRow[]).map(rowToScenario);
}

export async function getScenario(id: number): Promise<ScenarioRow | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get scenario: ${error.message}`);
  }
  return data ? rowToScenario(data as ScenarioDBRow) : null;
}

export async function deleteScenario(id: number): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { error, count } = await db
    .from('scenarios')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete scenario: ${error.message}`);
  }
  return (count ?? 0) > 0;
}

export async function getScenariosByIds(ids: number[]): Promise<ScenarioRow[]> {
  if (ids.length === 0) return [];
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('scenarios')
    .select('*')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to fetch scenarios: ${error.message}`);
  }
  return (data as ScenarioDBRow[]).map(rowToScenario);
}
