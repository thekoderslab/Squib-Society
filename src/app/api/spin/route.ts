import { NextResponse } from "next/server";

import { DAILY_SPIN } from "@/lib/constants";
import { notConfigured, serverError, unauthorized } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { dailySpin, getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** Weighted pick. Weights live in constants.ts, the roll happens here. */
function pickSegment(): number {
  const total = DAILY_SPIN.segments.reduce((sum, s) => sum + s.weight, 0);

  // getRandomValues rather than Math.random: this hands out points and spots.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let roll = (buf[0] / 2 ** 32) * total;

  for (let i = 0; i < DAILY_SPIN.segments.length; i++) {
    roll -= DAILY_SPIN.segments[i].weight;
    if (roll <= 0) return i;
  }
  return DAILY_SPIN.segments.length - 1;
}

/**
 * // INTEGRATION: server-authoritative daily spin.
 *
 * The segment is chosen here and written before it is returned, so a client
 * that drops the response or replays the request cannot re-roll. `daily_spin`
 * locks the row and enforces the cooldown, which means the answer is the same
 * whether one tab asks or six do. The wheel is only told where to stop.
 */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    const segment = pickSegment();
    const seg = DAILY_SPIN.segments[segment];

    const res = await dailySpin({
      profileId,
      points: seg.points,
      cooldownHours: DAILY_SPIN.cooldownHours,
      // "Again" pays nothing and does not start the clock.
      consume: seg.kind !== "again",
      gtd: seg.kind === "gtd",
    });

    if (!res.applied) {
      return NextResponse.json(
        { error: "cooldown", nextAt: res.nextAt },
        { status: 429 },
      );
    }

    return NextResponse.json({
      segment,
      points: res.awarded,
      gtd: seg.kind === "gtd",
      again: seg.kind === "again",
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
