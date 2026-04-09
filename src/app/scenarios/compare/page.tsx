import Link from 'next/link';
import { getScenariosByIds } from '@/lib/db/scenarios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatBtuh, formatTons } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const idString = searchParams.ids ?? '';
  const ids = idString
    .split(',')
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);

  const scenarios = ids.length > 0 ? getScenariosByIds(ids) : [];

  // Preserve ordering from query string
  const ordered = ids
    .map((id) => scenarios.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (ordered.length < 2) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Compare Scenarios</h1>
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            Select at least 2 scenarios to compare.{' '}
            <Link href="/scenarios" className="text-brand-600 hover:underline">
              Back to list
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  // Collect all component labels across scenarios
  const allComponents = new Set<string>();
  for (const s of ordered) {
    for (const c of s.result.components) allComponents.add(c.component);
  }
  const componentKeys = Array.from(allComponents);

  const labelMap = new Map<string, string>();
  for (const s of ordered) {
    for (const c of s.result.components) labelMap.set(c.component, c.label);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Compare Scenarios</h1>
        <Link href="/scenarios">
          <Button variant="secondary">Back to list</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left font-medium text-slate-600">Component</th>
                {ordered.map((s) => (
                  <th
                    key={s.id}
                    className="py-2 text-right font-medium text-slate-600 min-w-[180px]"
                  >
                    {s.name}
                    <div className="text-xs font-normal text-slate-500">{s.climateZone}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-red-50 border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-900">Heating total</td>
                {ordered.map((s) => (
                  <td key={s.id} className="py-2 text-right font-semibold">
                    {formatBtuh(s.heatingTotal)}
                  </td>
                ))}
              </tr>
              <tr className="bg-blue-50 border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-900">Cooling total</td>
                {ordered.map((s) => (
                  <td key={s.id} className="py-2 text-right font-semibold">
                    {formatBtuh(s.coolingTotal)}
                    <div className="text-xs font-normal text-slate-500">
                      {formatTons(s.coolingTotal)}
                    </div>
                  </td>
                ))}
              </tr>
              {componentKeys.map((key) => (
                <tr key={key} className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">{labelMap.get(key) ?? key}</td>
                  {ordered.map((s) => {
                    const c = s.result.components.find((x) => x.component === key);
                    const total = c
                      ? c.heating + c.coolingSensible + c.coolingLatent
                      : 0;
                    return (
                      <td key={s.id} className="py-2 text-right text-slate-700">
                        {total > 0 ? formatBtuh(total) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-500">Square footage</td>
                {ordered.map((s) => (
                  <td key={s.id} className="py-2 text-right text-slate-500">
                    {s.squareFootage.toLocaleString()} ft²
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-slate-500">BTU/hr per ft² (heating)</td>
                {ordered.map((s) => (
                  <td key={s.id} className="py-2 text-right text-slate-500">
                    {(s.heatingTotal / s.squareFootage).toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
