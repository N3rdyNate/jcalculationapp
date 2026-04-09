import { NextResponse } from 'next/server';
import { saveScenarioSchema } from '@/lib/calc/schemas';
import { calculateLoads } from '@/lib/calc/engine';
import { createScenario, listScenarios } from '@/lib/db/scenarios';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitStr = url.searchParams.get('limit');
    const climate = url.searchParams.get('climate') ?? undefined;
    let limit: number | undefined;
    if (limitStr !== null) {
      const parsed = Number(limitStr);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: 'Invalid limit parameter' },
          { status: 400 }
        );
      }
      limit = Math.min(Math.floor(parsed), 500);
    }
    const rows = await listScenarios({ limit, climateZone: climate });
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = saveScenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    // Server re-runs the engine — never trust client-supplied results
    const result = calculateLoads(parsed.data.input);
    const row = await createScenario({
      name: parsed.data.name,
      description: parsed.data.description,
      input: parsed.data.input,
      result,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
