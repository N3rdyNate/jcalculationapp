import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase admin client. Uses the SERVICE ROLE key, which
 * bypasses Row Level Security. NEVER import this from a client
 * component — only use it in API routes, Server Components, or server
 * actions.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL      — public URL of the Supabase project
 *   SUPABASE_SERVICE_ROLE_KEY     — server-only, never exposed to client
 *
 * The client is memoized so repeated imports don't allocate new
 * connection pools.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in .env.local (dev) or Vercel project ' +
        'settings (production). See .env.example.'
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
