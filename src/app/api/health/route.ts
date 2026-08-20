import { NextResponse } from "next/server";

import { admin, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** Every table the app reads. Order matches schema.sql. */
const TABLES = [
  "profiles",
  "allowlist_entries",
  "points_ledger",
  "streaks",
  "rate_limits",
] as const;

/**
 * Setup diagnostics.
 *
 * Booleans only: which tables the service key can reach, and whether the two
 * required secrets are present. No row data and no raw Postgres messages, so
 * this is safe to leave enabled. Knowing that a table exists buys nobody
 * anything, since RLS is on with no policies and EXECUTE is revoked from
 * PUBLIC. Being able to see, in one request, exactly which piece of setup is
 * missing is worth far more than hiding the names.
 */
export async function GET() {
  const env = {
    supabaseUrl: Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    sessionSecret: Boolean(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16,
    ),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, env, tables: null, view: null });
  }

  const db = admin();
  const tables: Record<string, boolean> = {};

  for (const t of TABLES) {
    const { error } = await db.from(t).select("*", { count: "exact", head: true });
    tables[t] = !error;
  }

  const { error: viewError } = await db
    .from("leaderboard")
    .select("profile_id", { count: "exact", head: true });

  const allTables = Object.values(tables).every(Boolean);

  return NextResponse.json({
    ok: env.sessionSecret && allTables && !viewError,
    env,
    tables,
    view: { leaderboard: !viewError },
  });
}
