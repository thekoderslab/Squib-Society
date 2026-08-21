import { NextResponse } from "next/server";

import { admin, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * The exact column list the app selects from each table.
 *
 * `select *` is useless as a check: it succeeds even when a column the code
 * asks for is missing, which is precisely the failure that is hard to find.
 * These lists mirror store.ts, so a mismatch between deployed code and the
 * schema shows up here by name.
 */
const READS: { table: string; columns: string }[] = [
  { table: "profiles", columns: "id, x_user_id, handle, display_name, avatar_url, x_created_at" },
  { table: "allowlist_entries", columns: "id, profile_id, evm_address, gtd, created_at" },
  { table: "points_ledger", columns: "id, profile_id, kind, points, day, meta, created_at" },
  { table: "streaks", columns: "profile_id, current_streak, longest_streak, last_spin_at" },
  { table: "rate_limits", columns: "bucket, hits, window_start" },
  { table: "leaderboard", columns: "profile_id, handle, display_name, avatar_url, points, streak, joined_at" },
];

/**
 * Setup diagnostics.
 *
 * Reports which reads the service key can perform and whether the required
 * secrets are present. No row data is returned. Postgres messages are included
 * only for failures, and only ever name schema objects: RLS is on with no
 * policies and EXECUTE is revoked from PUBLIC, so a table or column name buys
 * nobody anything, while being able to see the exact mismatch in one request
 * saves a deploy cycle per guess.
 */
export async function GET() {
  const env = {
    supabaseUrl: Boolean(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    sessionSecret: Boolean(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16,
    ),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, env, reads: null, functions: null });
  }

  const db = admin();
  const reads: Record<string, string | true> = {};

  for (const { table, columns } of READS) {
    const { error } = await db.from(table).select(columns).limit(1);
    reads[table] = error ? error.message : true;
  }

  /**
   * Function presence, without side effects. Every one is called with a
   * deliberately absent profile id: PostgREST resolves the signature first, so
   * a missing function fails differently from one that simply found no rows.
   */
  const ghost = "00000000-0000-0000-0000-000000000000";
  const probes: [string, Record<string, unknown>][] = [
    ["rate_limit", { p_bucket: `health:${Date.now()}`, p_limit: 1, p_window_seconds: 1 }],
    ["prune_rate_limits", {}],
    ["award_points", { p_profile: ghost, p_kind: "health", p_points: 0 }],
    ["daily_spin", { p_profile: ghost, p_points: 0, p_cooldown_hours: 24 }],
    ["cooldown_award", { p_profile: ghost, p_kind: "health", p_points: 0, p_cooldown_hours: 24 }],
    ["admin_stats", { p_days: 1 }],
  ];

  const functions: Record<string, string | true> = {};
  for (const [name, args] of probes) {
    const { error } = await db.rpc(name, args);
    // A foreign key complaint means the function exists and ran, which is all
    // we are asking. Only "not found" counts as missing.
    const missing =
      error &&
      (error.message.toLowerCase().includes("could not find the function") ||
        error.message.toLowerCase().includes("does not exist"));
    functions[name] = missing ? error.message : true;
  }

  const ok =
    env.sessionSecret &&
    Object.values(reads).every((v) => v === true) &&
    Object.values(functions).every((v) => v === true);

  return NextResponse.json({ ok, env, reads, functions });
}
