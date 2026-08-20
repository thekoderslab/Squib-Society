import { NextResponse } from "next/server";

import { HONEYPOT_FIELD } from "@/lib/constants";
import { admin, supabaseConfigured } from "./supabase";

/**
 * Rate limiting and bot checks shared by every mutating route.
 *
 * The counter lives in Postgres rather than in memory. Serverless instances do
 * not share memory, so an in-process limiter counts separately on each cold
 * start and stops nothing at all.
 */

/** HMAC of the caller's IP. We rate limit per address without storing one. */
async function fingerprint(request: Request): Promise<string> {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";

  const secret = process.env.SESSION_SECRET ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Buffer.from(new Uint8Array(sig)).toString("base64url").slice(0, 22);
}

export type Limit = { limit: number; windowSeconds: number };

/**
 * Returns a 429 response if the bucket is over its limit, otherwise null.
 * Fails open: if the limiter itself errors we let the request through rather
 * than taking the whole site down over a rate check.
 */
export async function rateLimit(
  bucket: string,
  { limit, windowSeconds }: Limit,
): Promise<NextResponse | null> {
  if (!supabaseConfigured) return null;

  try {
    const { data, error } = await admin().rpc("rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.allowed) return null;

    const retry = Number(row?.retry_after ?? windowSeconds);
    return NextResponse.json(
      { error: "rate_limited", retryAfter: retry },
      { status: 429, headers: { "retry-after": String(retry) } },
    );
  } catch (e) {
    console.error("[squib-guard] rate limit check failed, allowing:", e);
    return null;
  }
}

/** Rate limit by IP. Use for anything reachable before there is a session. */
export async function limitByIp(
  request: Request,
  scope: string,
  limit: Limit,
): Promise<NextResponse | null> {
  return rateLimit(`${scope}:ip:${await fingerprint(request)}`, limit);
}

/** Rate limit by account. Use once a session exists. */
export async function limitByProfile(
  profileId: string,
  scope: string,
  limit: Limit,
): Promise<NextResponse | null> {
  return rateLimit(`${scope}:p:${profileId}`, limit);
}

/**
 * // INTEGRATION: sybil filtering, captcha.
 *
 * Verifies a Cloudflare Turnstile token. Set TURNSTILE_SECRET_KEY to turn it
 * on. Until that variable exists the check is skipped and a warning is logged,
 * so the site keeps working before you have signed up, and it is obvious in
 * the logs that the front door is still open.
 */
export async function verifyCaptcha(token: string, request: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[squib-guard] TURNSTILE_SECRET_KEY unset, captcha NOT verified");
    return true;
  }
  if (!token) return false;

  try {
    const fwd = request.headers.get("x-forwarded-for") ?? "";
    const body = new URLSearchParams({ secret, response: token });
    const ip = fwd.split(",")[0].trim();
    if (ip) body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch (e) {
    // A captcha provider outage must not silently let bots in.
    console.error("[squib-guard] turnstile verify failed:", e);
    return false;
  }
}

export function trippedHoneypot(body: Record<string, unknown>): boolean {
  const v = body[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}
