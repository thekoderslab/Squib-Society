import { NextResponse } from "next/server";

import { POINTS } from "@/lib/constants";
import {
  badRequest,
  notConfigured,
  safeDay,
  serverError,
  unauthorized,
} from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { awardDaily, getUserState } from "@/lib/server/store";
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

    const body = (await request.json().catch(() => ({}))) as Body;
    const day = safeDay(body.day);
    if (!day) return badRequest("bad_day");

    let awarded = 0;

    switch (body.kind) {
      case "game": {
        // The score is re-scored and capped here. A tampered score cannot mint
        // more than the daily cap.
        const score = Math.max(0, Math.min(200, Math.floor(Number(body.score ?? 0))));
        const points = Math.min(score * POINTS.gamePerCatch, POINTS.gameDailyCap);
        awarded = await awardDaily(profileId, "game", points, day, { score });
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
