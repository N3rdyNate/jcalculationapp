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
  const [error, setError] = useState<string | null>(null);

  async function fetchScenarios() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scenarios');
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Failed to load scenarios (${res.status})`);
      }
      setScenarios(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScenarios();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('Delete this scenario?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Delete failed (${res.status})`);
      }
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleClone(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/scenarios/${id}/clone`, { method: 'POST' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Clone failed (${res.status})`);
      }
      fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
    }
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Saved Scenarios</h1>
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

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Loading…</p>
        </Card>
      ) : scenarios.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
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
              <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 w-8"></th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400">Name</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400">Climate</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Sq Ft</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Heating</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400 text-right">Cooling</th>
                <th className="py-2 font-medium text-slate-600 dark:text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</p>
                    )}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">{s.climateZone}</td>
                  <td className="py-2 text-slate-700 dark:text-slate-300 text-right">
                    {s.squareFootage.toLocaleString()}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300 text-right">
                    {formatBtuh(s.heatingTotal)}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300 text-right">
                    {formatTons(s.coolingTotal)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleClone(s.id)}
                      className="text-xs text-brand-600 hover:underline mr-3"
                    >
                      Clone
                    </button>
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
