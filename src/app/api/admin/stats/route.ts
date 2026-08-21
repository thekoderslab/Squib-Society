import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/server/admin";
import { notConfigured, serverError } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { admin, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * The analytics payload. Admin only.
 *
 * Returns 404 rather than 403 to anyone who is not an admin, so the endpoint
 * does not confirm it exists to someone poking at URLs.
 */
export async function GET(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!(await isAdmin(profileId))) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const days = Math.min(
      90,
      Math.max(7, Number(new URL(request.url).searchParams.get("days") ?? 14)),
    );

    const { data, error } = await admin().rpc("admin_stats", { p_days: days });
    if (error) throw error;

    return NextResponse.json({ ok: true, days, stats: data });
  } catch (e) {
    return serverError(e);
  }
}
