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
import { awardDaily, checkIn, getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

type Body = {
  kind?: string;
  /** The caller's local day, YYYY-MM-DD. Validated against UTC now. */
  day?: string;
  score?: number;
  correct?: boolean;
};

/** All the repeatable point sources behind one endpoint. */
export async function POST(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    const body = (await request.json().catch(() => ({}))) as Body;
    const day = safeDay(body.day);
    if (!day) return badRequest("bad_day");

    let awarded = 0;
    let streak: number | undefined;

    switch (body.kind) {
      case "checkin": {
        const res = await checkIn(profileId, day);
        awarded = res.awarded;
        streak = res.streak;
        break;
      }
      case "quest":
        awarded = await awardDaily(profileId, "quest", POINTS.dailyQuest, day);
        break;
      case "trivia":
        // A wrong answer still burns the day — that's what makes it a quiz.
        awarded = await awardDaily(
          profileId,
          "trivia",
          body.correct ? POINTS.trivia : 0,
          day,
          { correct: !!body.correct },
        );
        break;
      case "game": {
        const score = Math.max(0, Math.min(200, Math.floor(Number(body.score ?? 0))));
        const points = Math.min(score * POINTS.gamePerCatch, POINTS.gameDailyCap);
        awarded = await awardDaily(profileId, "game", points, day, { score });
        break;
      }
      case "share":
        // One-time bonus: day is null so the once-ever index applies.
        awarded = await awardDaily(profileId, "share", POINTS.quote, null);
        break;
      default:
        return badRequest("unknown_kind");
    }

    return NextResponse.json({
      awarded,
      streak,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
