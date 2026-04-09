'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatBtuh, formatTons } from '@/lib/utils/format';
import type { ScenarioRow } from '@/lib/db/scenarios';

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function fetchScenarios() {
    setLoading(true);
    try {
      const res = await fetch('/api/scenarios');
      if (res.ok) {
        setScenarios(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScenarios();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Delete this scenario?')) return;
    await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
    fetchScenarios();
    setSelected((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }

  function handleCompare() {
    if (selected.size < 2) return;
    const ids = Array.from(selected).join(',');
    router.push(`/scenarios/compare?ids=${ids}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Saved Scenarios</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleCompare}
            disabled={selected.size < 2}
          >
            Compare selected ({selected.size})
          </Button>
          <Link href="/calculate">
            <Button>New calculation</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
        </Card>
      ) : scenarios.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            No saved scenarios yet.{' '}
            <Link href="/calculate" className="text-brand-600 hover:underline">
              Create your first one
            </Link>
            .
          </p>
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="py-2 w-8"></th>
                <th className="py-2 font-medium text-slate-600">Name</th>
                <th className="py-2 font-medium text-slate-600">Climate</th>
                <th className="py-2 font-medium text-slate-600 text-right">Sq Ft</th>
                <th className="py-2 font-medium text-slate-600 text-right">Heating</th>
                <th className="py-2 font-medium text-slate-600 text-right">Cooling</th>
                <th className="py-2 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      disabled={!selected.has(s.id) && selected.size >= 4}
                    />
                  </td>
                  <td className="py-2">
                    <Link href={`/scenarios/${s.id}`} className="text-brand-600 hover:underline font-medium">
                      {s.name}
                    </Link>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                    )}
                  </td>
                  <td className="py-2 text-slate-700">{s.climateZone}</td>
                  <td className="py-2 text-slate-700 text-right">
                    {s.squareFootage.toLocaleString()}
                  </td>
                  <td className="py-2 text-slate-700 text-right">
                    {formatBtuh(s.heatingTotal)}
                  </td>
                  <td className="py-2 text-slate-700 text-right">
                    {formatTons(s.coolingTotal)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
