import { NextResponse } from "next/server";

import { limitByIp } from "@/lib/server/guard";
import { setSession } from "@/lib/server/session";
import { upsertProfile } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";
import {
  OAUTH_COOKIE_MAX_AGE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  authorizeUrl,
  challengeFor,
  randomToken,
  redirectUri,
  xConfigured,
} from "@/lib/server/x-oauth";

export const dynamic = "force-dynamic";

/**
 * Begins Sign in with X.
 *
 * A full page navigation rather than fetch, because the user has to end up on
 * x.com to approve. The state and PKCE verifier ride along in short-lived
 * httpOnly cookies; SameSite must be lax so they survive the redirect back,
 * and state is what makes that redirect verifiable rather than forgeable.
 */
export async function GET(request: Request) {
  // Every exit goes through /done, which hands the outcome to the tab the
  // visitor started from and closes this one. Failing straight to /allowlist
  // would leave them staring at a second copy of the page they came from.
  const back = new URL("/api/auth/x/done", request.url);

  if (!supabaseConfigured) {
    back.searchParams.set("x_error", "not_configured");
    return NextResponse.redirect(back);
  }

  // Cheap to hit and it mints rows, so cap it. Loose enough for shared IPs.
  const limited = await limitByIp(request, "session", {
    limit: 30,
    windowSeconds: 3600,
  });
  if (limited) {
    back.searchParams.set("x_error", "rate_limited");
    return NextResponse.redirect(back);
  }

  try {
    // Fallback for a deployment without X credentials: mint the old throwaway
    // account so the funnel is still walkable. Never reached once X_CLIENT_ID
    // and X_CLIENT_SECRET are set.
    if (!xConfigured()) {
      const suffix = randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "");
      const profile = await upsertProfile({
        xUserId: `mock:${suffix}`,
        handle: `demo_${suffix}`,
        displayName: "demo account",
      });
      await setSession(profile.id);
      back.searchParams.set("connected", "demo");
      return NextResponse.redirect(back);
    }

    const state = randomToken();
    const verifier = randomToken(48);
    const challenge = await challengeFor(verifier);

    const res = NextResponse.redirect(
      authorizeUrl({ state, challenge, redirectUri: redirectUri(request) }),
    );

    const cookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    };
    res.cookies.set(STATE_COOKIE, state, cookie);
    res.cookies.set(VERIFIER_COOKIE, verifier, cookie);
    return res;
  } catch (e) {
    console.error("[squib-oauth] start:", e instanceof Error ? e.message : e);
    back.searchParams.set("x_error", "start_failed");
    return NextResponse.redirect(back);
  }
}
