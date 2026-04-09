import { NextResponse } from 'next/server';
import { calculationInputSchema } from '@/lib/calc/schemas';
import { calculateLoads } from '@/lib/calc/engine';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = calculationInputSchema.safeParse(body);
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
    const result = calculateLoads(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calculation failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
