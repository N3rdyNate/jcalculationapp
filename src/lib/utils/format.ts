import { BTUH_PER_TON } from '@/lib/calc/constants/physical';

export function formatBtuh(btuh: number): string {
  return `${Math.round(btuh).toLocaleString()} BTU/hr`;
}

export function formatTons(btuh: number): string {
  const tons = btuh / BTUH_PER_TON;
  return `${tons.toFixed(1)} tons`;
}

export function formatKW(btuh: number): string {
  const kw = btuh / 3412;
  return `${kw.toFixed(1)} kW`;
}

export function formatPercent(pct: number): string {
  return `${pct.toFixed(0)}%`;
}
