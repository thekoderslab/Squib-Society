import { NextResponse } from "next/server";

import { limitByIp } from "@/lib/server/guard";
import { notConfigured, serverError } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** The authoritative copy of the viewer's progress. */
export async function GET(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  // Called on every page load, so this is deliberately loose. It only exists to
  // stop something scraping it in a tight loop.
  const limited = await limitByIp(request, "me", { limit: 600, windowSeconds: 300 });
  if (limited) return limited;

  try {
    const profileId = await getSessionProfileId();
    // Not connected is a normal state, not an error — the funnel starts here.
    if (!profileId) return NextResponse.json({ connected: false, progress: null });

    return NextResponse.json({
      connected: true,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
