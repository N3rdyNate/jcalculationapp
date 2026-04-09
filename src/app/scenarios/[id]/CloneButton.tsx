'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Props {
  id: number;
}

export function CloneButton({ id }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClone() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/scenarios/${id}/clone`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Clone failed');
      }
      const created = (await res.json()) as { id: number };
      router.push(`/scenarios/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={handleClone} disabled={busy}>
        {busy ? 'Cloning…' : 'Clone'}
      </Button>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </>
  );
}
