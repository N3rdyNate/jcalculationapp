import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getScenario } from '@/lib/db/scenarios';
import { ResultsPanel } from '@/components/results/ResultsPanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PrintButton } from '@/components/PrintButton';
import { CloneButton } from './CloneButton';

export const dynamic = 'force-dynamic';

export default async function ScenarioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const scenario = await getScenario(id);
  if (!scenario) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{scenario.name}</h1>
          {scenario.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{scenario.description}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Created {new Date(scenario.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 print-hide">
          <PrintButton />
          <CloneButton id={scenario.id} />
          <Link href="/scenarios">
            <Button variant="secondary">Back to list</Button>
          </Link>
          <Link href="/calculate">
            <Button>New calculation</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card title="Inputs">
            <dl className="text-sm space-y-1">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Climate zone</dt>
                <dd className="font-medium">{scenario.input.climateZoneId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Square footage</dt>
                <dd className="font-medium">
                  {scenario.input.house.squareFootage.toLocaleString()} ft²
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Stories</dt>
                <dd className="font-medium">{scenario.input.house.stories}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Ceiling height</dt>
                <dd className="font-medium">
                  {scenario.input.house.ceilingHeight} ft
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Wall R</dt>
                <dd className="font-medium">
                  R-{scenario.input.envelope.wallRValue} ({scenario.input.envelope.wallMass})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Roof R</dt>
                <dd className="font-medium">
                  R-{scenario.input.envelope.roofRValue} ({scenario.input.envelope.roofColor})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Foundation</dt>
                <dd className="font-medium">
                  {scenario.input.envelope.foundationType}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Infiltration</dt>
                <dd className="font-medium">{scenario.input.infiltration.ach} ACH</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Occupants</dt>
                <dd className="font-medium">{scenario.input.internal.occupants}</dd>
              </div>
            </dl>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <ResultsPanel result={scenario.result} />
        </div>
      </div>
    </div>
  );
}
