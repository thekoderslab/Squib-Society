import { NextResponse } from "next/server";

import { EVM_ADDRESS_RE } from "@/lib/constants";
import { badRequest, notConfigured, serverError, unauthorized } from "@/lib/server/respond";
import { getSessionProfileId } from "@/lib/server/session";
import { getUserState, submitAllowlist } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  try {
    const profileId = await getSessionProfileId();
    if (!profileId) return unauthorized();

    const body = (await request.json().catch(() => ({}))) as {
      evmAddress?: string;
      captchaToken?: string;
    };

    const address = (body.evmAddress ?? "").trim();
    if (!EVM_ADDRESS_RE.test(address)) return badRequest("bad_address");

    // INTEGRATION: sybil filtering.
    // Verify the captcha token with hCaptcha/Turnstile here, and apply the
    // account-age and follower-floor rules against the stored X profile before
    // letting the insert through. The one-per-address and one-per-account rules
    // are already enforced by unique indexes in schema.sql, so they hold even
    // if this check is ever skipped.
    if (!body.captchaToken) return badRequest("captcha_required");

    // The base tasks are the gate. Server-side check so a client can't skip it.
    const before = await getUserState(profileId);
    const baseDone =
      before.tasks.follow === "done" &&
      before.tasks.like === "done" &&
      before.tasks.retweet === "done";
    if (!baseDone) return badRequest("tasks_incomplete");

    const result = await submitAllowlist(profileId, address);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      rank: result.rank,
      points: result.points,
      allowlisted: true,
      progress: await getUserState(profileId),
    });
  } catch (e) {
    return serverError(e);
  }
}
