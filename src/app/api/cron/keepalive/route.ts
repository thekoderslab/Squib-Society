import { NextResponse } from "next/server";

import { admin, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * Keeps the Supabase project awake and tidies up after the rate limiter.
 *
 * Free Supabase projects pause after about a week with no activity, and a
 * paused project means every route starts failing. pg_cron alone is not a
 * reliable fix, because Supabase measures activity partly on API traffic and an
 * internal job may not register. A real request from Vercel definitely does,
 * so this route makes an actual query rather than just returning 200.
 *
 * Scheduled from vercel.json. Vercel sends `Authorization: Bearer $CRON_SECRET`
 * when that variable is set, and this refuses anything else so the endpoint
 * cannot be used as a free way to hammer the database.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  try {
    const db = admin();

    // A real read, so the project registers genuine activity.
    const { count, error } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw error;

    // Piggyback the housekeeping rather than paying for a second cron slot.
    const { data: pruned, error: pruneError } = await db.rpc("prune_rate_limits");
    if (pruneError) throw pruneError;

    return NextResponse.json({
      ok: true,
      profiles: count ?? 0,
      prunedRateLimits: Number(pruned ?? 0),
      at: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[squib-cron]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
