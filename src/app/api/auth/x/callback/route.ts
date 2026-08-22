import { NextResponse } from "next/server";

import { setSession } from "@/lib/server/session";
import { upsertProfile } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";
import {
  STATE_COOKIE,
  VERIFIER_COOKIE,
  completeLogin,
  redirectUri,
} from "@/lib/server/x-oauth";

export const dynamic = "force-dynamic";

/**
 * Where X sends the user back.
 *
 * Verifies state, exchanges the code, reads the profile, and writes the
 * session. Every outcome lands back on /allowlist carrying a code the page can
 * explain, because a blank screen after leaving the site is the worst possible
 * end to an auth flow.
 */
export async function GET(request: Request) {
  const back = new URL("/allowlist", request.url);

  const fail = (code: string, detail?: unknown) => {
    if (detail) {
      console.error("[squib-oauth] callback:", code, detail);
    }
    back.searchParams.set("x_error", code);
    const res = NextResponse.redirect(back);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(VERIFIER_COOKIE);
    return res;
  };

  if (!supabaseConfigured) return fail("not_configured");

  const url = new URL(request.url);

  // The user pressed cancel on X's consent screen. Not an error worth shouting
  // about, but they should still land somewhere that makes sense.
  const denied = url.searchParams.get("error");
  if (denied) return fail(denied === "access_denied" ? "cancelled" : "denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail("missing_code");

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  const verifier = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${VERIFIER_COOKIE}=`))
    ?.split("=")[1];

  // If state does not match, this redirect did not originate from our start
  // route, and the code must not be exchanged.
  if (!cookieState || !state || cookieState !== state) return fail("bad_state");
  if (!verifier) return fail("expired");

  try {
    const user = await completeLogin({
      code,
      verifier,
      redirectUri: redirectUri(request),
    });

    // x_user_id is the numeric X id, which is stable across renames. That is
    // what one-account-one-entry rests on.
    const profile = await upsertProfile({
      xUserId: user.id,
      handle: user.username,
      displayName: user.name,
      avatarUrl: user.avatarUrl,
      xCreatedAt: user.createdAt,
    });

    await setSession(profile.id);

    back.searchParams.set("connected", "1");
    const res = NextResponse.redirect(back);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(VERIFIER_COOKIE);
    return res;
  } catch (e) {
    return fail("exchange_failed", e instanceof Error ? e.message : e);
  }
}
