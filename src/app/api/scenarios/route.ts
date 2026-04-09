import { NextResponse } from 'next/server';
import { saveScenarioSchema } from '@/lib/calc/schemas';
import { calculateLoads } from '@/lib/calc/engine';
import { createScenario, listScenarios } from '@/lib/db/scenarios';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitStr = url.searchParams.get('limit');
  const climate = url.searchParams.get('climate') ?? undefined;
  const limit = limitStr ? Number(limitStr) : undefined;
  const rows = listScenarios({ limit, climateZone: climate });
  return NextResponse.json(rows);
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
    const row = createScenario({
      name: parsed.data.name,
      description: parsed.data.description,
      input: parsed.data.input,
      result,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
