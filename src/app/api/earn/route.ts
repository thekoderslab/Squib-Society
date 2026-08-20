import { NextResponse } from "next/server";

import { GAME, POINTS } from "@/lib/constants";
import {
  badRequest,
  notConfigured,
  safeDay,
  serverError,
  unauthorized,
} from "@/lib/server/respond";
import { limitByProfile } from "@/lib/server/guard";
import { getSessionProfileId } from "@/lib/server/session";
import { awardDaily, cooldownAward, getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

type Body = {
  kind?: string;
  /** The caller's local day, YYYY-MM-DD. Validated against UTC now. */
  day?: string;
  score?: number;
};

export async function POST(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    const limited = await limitByProfile(profileId, "earn", {
      limit: 30,
      windowSeconds: 600,
    });
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Body;
    const day = safeDay(body.day);
    if (!day) return badRequest("bad_day");

    let awarded = 0;

    switch (body.kind) {
      case "game": {
        // The score is re-scored and capped here. A tampered score cannot mint
        // more than the cap, and the cooldown is enforced in Postgres.
        const score = Math.max(0, Math.min(200, Math.floor(Number(body.score ?? 0))));
        const points = Math.min(score * POINTS.gamePerCatch, POINTS.gameDailyCap);
        const res = await cooldownAward({
          profileId,
          kind: "game",
          points,
          cooldownHours: GAME.cooldownHours,
          meta: { score },
        });
        if (!res.applied) {
          return NextResponse.json(
            { error: "cooldown", nextAt: res.nextAt },
            { status: 429 },
          );
        }
        awarded = res.awarded;
        break;
      }
      case "share":
        // One time bonus, so day is null and the once-ever index applies.
        awarded = await awardDaily(profileId, "share", POINTS.quote, null);
        break;
      default:
        return badRequest("unknown_kind");
    }

    return NextResponse.json({ awarded, progress: await getUserState(profileId) });
  } catch (e) {
    return serverError(e);
  }
}
