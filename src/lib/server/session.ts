import { cookies } from "next/headers";

/**
 * Minimal signed-cookie session.
 *
 * // INTEGRATION: X OAuth — when the real OAuth flow lands, this is where the
 * verified X user id gets exchanged for a profile. Until then the cookie is
 * still HMAC-signed, because an unsigned cookie holding a profile id would let
 * anyone paste someone else's id and farm points into their account.
 */

const COOKIE = "squib_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a random 32+ character string.",
    );
  }
  return s;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

/** Constant-time-ish compare so the signature can't be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function setSession(profileId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, `${profileId}.${await sign(profileId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** The signed-in profile id, or null. Never throws on a malformed cookie. */
export async function getSessionProfileId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;

  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    return safeEqual(sig, await sign(id)) ? id : null;
  } catch {
    return null;
  }
}
