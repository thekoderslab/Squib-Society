import { NextResponse } from "next/server";

import { DAILY_SPIN } from "@/lib/constants";
import { notConfigured, serverError, unauthorized } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { dailySpin, getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * // INTEGRATION: server-authoritative daily spin.
 *
 * The segment is picked here and written before it is returned, so a client
 * that drops the response or replays the request cannot re-roll. `daily_spin`
 * locks the row and enforces the 24 hour cooldown, which means the answer is
 * the same whether one tab asks or six do.
 */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    // getRandomValues rather than Math.random: this hands out points.
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const segment = buf[0] % DAILY_SPIN.prizes.length;
    const points = DAILY_SPIN.prizes[segment];

    const res = await dailySpin(profileId, points, DAILY_SPIN.cooldownHours);

    if (!res.applied) {
      return NextResponse.json(
        { error: "cooldown", nextAt: res.nextAt },
        { status: 429 },
      );
    }

    return NextResponse.json({
      segment,
      points: res.awarded,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
