import { NextResponse } from 'next/server';
import { compareRequestSchema } from '@/lib/calc/schemas';
import { getScenariosByIds } from '@/lib/db/scenarios';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = compareRequestSchema.safeParse(body);
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
    const scenarios = await getScenariosByIds(parsed.data.ids);
    if (scenarios.length === 0) {
      return NextResponse.json({ error: 'No scenarios found' }, { status: 404 });
    }
    return NextResponse.json({ scenarios });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
