import { NextResponse } from "next/server";

/**
 * Signals the client that Supabase isn't wired up yet. `src/lib/api.ts` treats
 * this as "fall back to mock data" rather than as an error, which is what keeps
 * the site fully clickable before any env vars exist.
 */
export function notConfigured() {
  return NextResponse.json({ configured: false }, { status: 503 });
}

export function unauthorized() {
  return NextResponse.json({ error: "not_connected" }, { status: 401 });
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function serverError(e: unknown) {
  const message = e instanceof Error ? e.message : "unknown error";
  console.error("[squib-api]", message);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Accepts the caller's LOCAL day but refuses anything more than a day away
 * from UTC now. Timezones legitimately span ~26 hours; a client claiming next
 * week is farming the streak.
 */
export function safeDay(input: unknown): string | null {
  if (typeof input !== "string" || !DAY_RE.test(input)) return null;
  const claimed = Date.parse(`${input}T00:00:00Z`);
  if (Number.isNaN(claimed)) return null;
  const drift = Math.abs(claimed - Date.now());
  return drift <= 36 * 60 * 60 * 1000 ? input : null;
}
