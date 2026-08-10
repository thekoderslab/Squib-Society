import { NextResponse } from "next/server";

import { notConfigured, serverError } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** The authoritative copy of the viewer's progress. */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();

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
