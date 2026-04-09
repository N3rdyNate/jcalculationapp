'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalculationForm } from '@/components/form/CalculationForm';
import { ResultsPanel } from '@/components/results/ResultsPanel';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PrintButton } from '@/components/PrintButton';
import type { CalculationInput, CalculationResult } from '@/lib/calc/types';

export default function CalculatePage() {
  const router = useRouter();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [input, setInput] = useState<CalculationInput | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleSave() {
    if (!input) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, input }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Save failed');
      }
      setShowSaveModal(false);
      setName('');
      setDescription('');
      router.push('/scenarios');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 print-stack">
      <div className="lg:col-span-3 print-hide">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Calculate Load</h1>
        <CalculationForm
          onResult={(r, i) => {
            setResult(r);
            setInput(i);
          }}
        />
      </div>
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4 print-hide">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Results</h2>
          {result && <PrintButton />}
        </div>
        <div className="sticky top-4">
          {result ? (
            <ResultsPanel
              result={result}
              onSave={() => setShowSaveModal(true)}
            />
          ) : (
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                Fill in the form and click <strong>Calculate loads</strong> to see results.
              </p>
            </Card>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print-hide"
          onClick={() => setShowSaveModal(false)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Save scenario</h3>
            <div className="space-y-3">
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Current house baseline"
                />
              </Field>
              <Field label="Description (optional)">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about this scenario"
                />
              </Field>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                variant="secondary"
                onClick={() => setShowSaveModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
