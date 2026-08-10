import { NextResponse } from "next/server";

import { GTD_SPIN_ODDS } from "@/lib/constants";
import { notConfigured, serverError, unauthorized } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { getUserState, recordSpin } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * // INTEGRATION: GTD spin (server-authoritative)
 *
 * The dice are rolled here and the result is written before it is returned, so
 * a client that drops the response or replays the request cannot re-roll —
 * `use_spin` locks the row and refuses a second attempt. The wheel in the UI is
 * only told where to stop.
 */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    // crypto.getRandomValues rather than Math.random: this decides a prize.
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const roll = buf[0] / 2 ** 32;
    const upgraded = roll < GTD_SPIN_ODDS;

    const { applied, gtd } = await recordSpin(profileId, upgraded);

    return NextResponse.json({
      // If the spin was already used, report the stored outcome, not the roll.
      upgraded: applied ? upgraded : gtd,
      alreadyUsed: !applied,
      odds: GTD_SPIN_ODDS,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
