import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getScenario, createScenario } from '@/lib/db/scenarios';
import { calculateLoads } from '@/lib/calc/engine';

const cloneRequestSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).optional(),
  })
  .optional();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Body is optional; empty body = auto-generate name
  let body: unknown = undefined;
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = cloneRequestSchema.safeParse(body);
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
    const original = await getScenario(id);
    if (!original) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Re-run the engine on the original input so the clone always
    // matches the current engine's output, same as the POST route does.
    const result = calculateLoads(original.input);

    const row = await createScenario({
      name: parsed.data?.name ?? `Copy of ${original.name}`,
      description: parsed.data?.description ?? original.description ?? undefined,
      input: original.input,
      result,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clone failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
