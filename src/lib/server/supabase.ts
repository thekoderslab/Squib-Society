import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client, using the SERVICE ROLE key.
 *
 * The service role bypasses RLS, which is exactly why it must never reach the
 * browser. Every table in schema.sql has RLS on with zero policies, so the anon
 * key can read nothing — all access goes through route handlers that use this
 * client. That is what makes the points ledger unforgeable.
 */

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** False until the env vars are set — the site falls back to mock data. */
export const supabaseConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

export function admin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("The service-role client must never be created in the browser.");
  }
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
