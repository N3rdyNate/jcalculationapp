'use client';

import type { CalculationResult } from '@/lib/calc/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatBtuh, formatTons, formatKW, formatPercent } from '@/lib/utils/format';
import { BreakdownChart } from './BreakdownChart';

interface Props {
  result: CalculationResult;
  onSave?: () => void;
}

function handlePrint() {
  if (typeof window !== 'undefined') window.print();
}

export function ResultsPanel({ result, onSave }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-r border-slate-200 dark:border-slate-700 pr-4">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-medium">Heating Load</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {formatBtuh(result.heatingTotal)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatKW(result.heatingTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-medium">Cooling Load</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formatBtuh(result.coolingTotal)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatTons(result.coolingTotal)} ({formatBtuh(result.coolingSensibleTotal)} sensible + {formatBtuh(result.coolingLatentTotal)} latent)
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 print-hide">
          {onSave && (
            <Button onClick={onSave} variant="secondary" className="flex-1">
              Save as scenario
            </Button>
          )}
          <Button
            onClick={handlePrint}
            variant="secondary"
            className={onSave ? 'flex-1' : 'w-full'}
          >
            Print results
          </Button>
        </div>
      </Card>

      <Card title="Component breakdown">
        <BreakdownChart components={result.components} />
      </Card>

      <Card title="Top contributors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-medium mb-2">Heating</p>
            <ul className="space-y-1">
              {result.topHeatingContributors.map((c) => (
                <li key={c.component} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {formatBtuh(c.btuh)} <span className="text-slate-500 dark:text-slate-400">({formatPercent(c.percent)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-medium mb-2">Cooling</p>
            <ul className="space-y-1">
              {result.topCoolingContributors.map((c) => (
                <li key={c.component} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {formatBtuh(c.btuh)} <span className="text-slate-500 dark:text-slate-400">({formatPercent(c.percent)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Full component table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400">Component</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Heating</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Cooling (sens.)</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Cooling (lat.)</th>
              </tr>
            </thead>
            <tbody>
              {result.components.map((c) => (
                <tr key={c.component} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 text-slate-700 dark:text-slate-300">{c.label}</td>
                  <td className="py-2 text-right text-slate-900 dark:text-slate-100">
                    {c.heating > 0 ? formatBtuh(c.heating) : '—'}
                  </td>
                  <td className="py-2 text-right text-slate-900 dark:text-slate-100">
                    {c.coolingSensible > 0 ? formatBtuh(c.coolingSensible) : '—'}
                  </td>
                  <td className="py-2 text-right text-slate-900 dark:text-slate-100">
                    {c.coolingLatent > 0 ? formatBtuh(c.coolingLatent) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{formatBtuh(result.heatingTotal)}</td>
                <td className="py-2 text-right">{formatBtuh(result.coolingSensibleTotal)}</td>
                <td className="py-2 text-right">{formatBtuh(result.coolingLatentTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Methodology" description="Simplified Manual J / ASHRAE">
        <dl className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex justify-between">
            <dt>Climate zone</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{result.meta.climateZoneLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Winter / summer design</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {result.meta.winterDesignTemp}°F / {result.meta.summerDesignTemp}°F
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>dT winter / summer</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {result.meta.dTWinter}°F / {result.meta.dTSummer}°F
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          Results are within ~5% of ACCA Manual J 8th for typical residential
          cases. Not a substitute for certified Manual J software. Does not
          model duct losses, mechanical ventilation, shading, or room-by-room
          distribution.
        </p>
      </Card>
    </div>
  );
}
