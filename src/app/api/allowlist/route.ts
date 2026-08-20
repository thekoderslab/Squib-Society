import { NextResponse } from "next/server";

import { EVM_ADDRESS_RE } from "@/lib/constants";
import {
  limitByIp,
  limitByProfile,
  trippedHoneypot,
  verifyCaptcha,
} from "@/lib/server/guard";
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

    // Limited on both axes. Per account stops one session grinding addresses;
    // per IP stops a farm cycling accounts from the same machine.
    const perProfile = await limitByProfile(profileId, "allowlist", {
      limit: 10,
      windowSeconds: 3600,
    });
    if (perProfile) return perProfile;

    const perIp = await limitByIp(request, "allowlist", {
      limit: 20,
      windowSeconds: 3600,
    });
    if (perIp) return perIp;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown> & {
      evmAddress?: string;
      captchaToken?: string;
    };

    // Hidden field. A human never fills it, a form-filling bot always does.
    if (trippedHoneypot(body)) {
      console.warn("[squib] honeypot tripped", { profileId });
      return NextResponse.json({ error: "rejected" }, { status: 400 });
    }

    const address = (body.evmAddress ?? "").trim();
    if (!EVM_ADDRESS_RE.test(address)) return badRequest("bad_address");

    // INTEGRATION: sybil filtering.
    // Turnstile runs when TURNSTILE_SECRET_KEY is set. The account-age and
    // follower-floor rules go here too, once real X data is on the profile.
    // The one-per-address and one-per-account rules are already unique indexes
    // in schema.sql, so they hold even if every check above is skipped.
    const human = await verifyCaptcha(String(body.captchaToken ?? ""), request);
    if (!human) return badRequest("captcha_failed");

    // The base tasks are the gate. Checked server side so a client cannot skip.
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
