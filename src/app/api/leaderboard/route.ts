import { NextResponse } from "next/server";

import { limitByIp } from "@/lib/server/guard";
import { notConfigured, serverError } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { getLeaderboardRows, getProfile } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  const limited = await limitByIp(request, "board", { limit: 120, windowSeconds: 300 });
  if (limited) return limited;

  try {
    const [rows, profileId] = await Promise.all([
      getLeaderboardRows(50),
      getSessionProfileId(),
    ]);

    let entries = rows;
    let you = null;

    if (profileId) {
      const profile = await getProfile(profileId);
      if (profile) {
        entries = rows.map((r) =>
          r.handle === profile.handle ? { ...r, isYou: true } : r,
        );
        you = entries.find((e) => e.isYou) ?? null;
      }
    }

    return NextResponse.json({ entries, you });
  } catch (e) {
    return serverError(e);
  }
}
