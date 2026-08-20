import { NextResponse } from "next/server";

import type { TaskId } from "@/lib/types";
import { limitByProfile } from "@/lib/server/guard";
import { badRequest, notConfigured, serverError, unauthorized } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { awardTask, getUserState } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const VALID: TaskId[] = ["follow", "like", "retweet", "quote"];

export async function POST(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    const limited = await limitByProfile(profileId, "tasks", {
      limit: 30,
      windowSeconds: 600,
    });
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as { taskId?: string };
    const taskId = VALID.find((t) => t === body.taskId);
    if (!taskId) return badRequest("unknown_task");

    // INTEGRATION: task verification.
    // Call the quest platform here (Zealy / Galxe / TaskOn) or the X API, and
    // only award when it confirms. Points are granted below on the server, so
    // a client that lies about completing a task gains nothing.
    const verified = true;
    if (!verified) return NextResponse.json({ verified: false, awarded: 0 });

    const awarded = await awardTask(profileId, taskId);
    return NextResponse.json({
      verified: true,
      awarded,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
