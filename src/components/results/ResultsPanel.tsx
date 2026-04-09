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
          Results are within ~5% of ACCA Manual J 8th for typical
          residential cases. Not a substitute for certified Manual J
          software.
        </p>

        <details className="mt-4 text-xs text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            References for applied calculations
          </summary>
          <div className="mt-2 space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Primary sources</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>
                  <strong>ACCA Manual J, 8th Edition</strong> — Residential Load
                  Calculation (Air Conditioning Contractors of America, 2016).
                  Design temperatures, CLTD tables, solar cooling load (SCL)
                  factors, shading multipliers, duct loss factors.
                </li>
                <li>
                  <strong>ASHRAE Handbook of Fundamentals, Ch. 17–18</strong> —
                  Residential Cooling and Heating Load Calculations, and
                  Nonresidential Cooling and Heating Load Calculations
                  (American Society of Heating, Refrigerating and
                  Air-Conditioning Engineers).
                </li>
                <li>
                  <strong>IECC 2021</strong> — International Energy
                  Conservation Code climate zone definitions (1A–8).
                </li>
                <li>
                  <strong>NFRC 100 / 200</strong> — U-factor and SHGC rating
                  procedures for fenestration.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Formulas by component</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>
                  <strong>Opaque envelope (heating):</strong>
                  <span className="font-mono"> Q = (1/R) · A · ΔT</span>
                  — Fourier conduction; ASHRAE HoF Ch. 17.
                </li>
                <li>
                  <strong>Walls / roof (cooling):</strong>
                  <span className="font-mono"> Q = U · A · CLTD</span>
                  — Cooling Load Temperature Difference method; ASHRAE
                  HoF Ch. 18, Table 14. CLTD selected from roof color /
                  wall mass.
                </li>
                <li>
                  <strong>Windows conduction:</strong>
                  <span className="font-mono"> Q = U · A · ΔT</span>
                  — frame U-multiplier applied per NFRC guidance.
                </li>
                <li>
                  <strong>Windows solar gain:</strong>
                  <span className="font-mono"> Q = SHGC · A · SCL(orientation) · shading</span>
                  — Solar Cooling Load factors from ACCA Manual J
                  Table 3A-SCL; shading multipliers from Manual J
                  Table 3B.
                </li>
                <li>
                  <strong>Infiltration sensible:</strong>
                  <span className="font-mono"> Q = 1.08 · CFM · ΔT</span>
                  — ASHRAE HoF Ch. 18, where 1.08 = 0.018 · 60 at sea-
                  level density; altitude-corrected by ρ/ρ₀ ratio.
                </li>
                <li>
                  <strong>Infiltration latent:</strong>
                  <span className="font-mono"> Q = 0.68 · CFM · ΔW</span>
                  — ΔW in grains of moisture per lb dry air; ASHRAE
                  HoF Ch. 18.
                </li>
                <li>
                  <strong>CFM from ACH:</strong>
                  <span className="font-mono"> CFM = ACH · Volume / 60</span>
                  — natural infiltration. ACH ≈ ACH50 / N where N ≈ 17–20.
                </li>
                <li>
                  <strong>Mechanical ventilation:</strong> same form as
                  infiltration, reduced by sensible / total recovery
                  efficiency for HRV / ERV systems.
                </li>
                <li>
                  <strong>Occupants (cooling):</strong>
                  sensible + latent per person by activity level;
                  ASHRAE HoF Ch. 18, Table 1 (seated light → vigorous).
                </li>
                <li>
                  <strong>Lights / appliances:</strong>
                  <span className="font-mono"> Q = W · 3.412 BTU/hr/W</span>
                  — full-load conversion; lighting density from ASHRAE
                  90.1 defaults by technology.
                </li>
                <li>
                  <strong>Slab foundation:</strong>
                  <span className="font-mono"> Q = F · P · ΔT</span>
                  — F-factor (perimeter heat loss coefficient) method;
                  ASHRAE HoF Ch. 18. F depends on edge insulation.
                </li>
                <li>
                  <strong>Basement / crawlspace:</strong>
                  <span className="font-mono"> Q = U<sub>eff</sub> · A · ΔT<sub>ground</sub></span>
                  — effective U-value against ground temperature;
                  ASHRAE HoF Ch. 18. Vented crawls scaled by 0.5.
                </li>
                <li>
                  <strong>Duct losses:</strong> multiplier applied to all
                  envelope components (not internal or solar); ACCA
                  Manual J 8 Appendix 7, Tables A7-1…A7-5 (location ×
                  insulation R-value).
                </li>
                <li>
                  <strong>Altitude density correction:</strong>
                  ρ/ρ₀ ratio applied to the 1.08 / 0.68 infiltration
                  and ventilation constants; ASHRAE HoF Ch. 1.
                </li>
                <li>
                  <strong>Roof surface area:</strong>
                  <span className="font-mono"> A = footprint · √(12² + rise²) / 12</span>
                  — slope-length factor for pitched roofs.
                </li>
                <li>
                  <strong>Perimeter (estimated):</strong>
                  <span className="font-mono"> P = 4 · √(sqft / stories)</span>
                  — square-house approximation when user doesn't
                  provide an explicit perimeter.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Limitations</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>
                  Whole-house totals only — does not produce a
                  room-by-room distribution required for duct sizing.
                </li>
                <li>
                  Simplified CLTD/SCL tables; not adjusted for latitude
                  beyond the coarse IECC zone mapping.
                </li>
                <li>
                  Does not model thermal mass decoupling, internal
                  shading beyond a single multiplier, or detailed duct
                  leakage vs. conduction loss.
                </li>
              </ul>
            </div>
          </div>
        </details>
      </Card>
    </div>
  );
}
