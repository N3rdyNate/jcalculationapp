import { zipPrefixToZone } from '@/lib/calc/constants/zip-to-climate';

/**
 * Resolve a US ZIP code to an IECC climate zone ID used by this app
 * (e.g. "4A", "2B"). Returns `null` if the ZIP is invalid or not in
 * the approximate prefix table.
 *
 * Accepts 5 or 9 digit ZIPs, with or without surrounding whitespace
 * and an optional 4-digit suffix.
 */
export function lookupClimateZoneByZip(zip: string): string | null {
  if (typeof zip !== 'string') return null;
  const cleaned = zip.trim().replace(/[\s-]/g, '');
  if (!/^\d{5}(\d{4})?$/.test(cleaned)) return null;
  const prefix3 = cleaned.slice(0, 3);
  return zipPrefixToZone(prefix3);
}
