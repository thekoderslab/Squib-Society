import { cookies } from "next/headers";

/**
 * Admin access for /admin.
 *
 * A password held in ADMIN_PASSWORD, exchanged once for a short-lived signed
 * cookie. The password itself is never stored anywhere and never leaves the
 * server: only the signed marker travels back to the browser.
 *
 * Fails closed. With ADMIN_PASSWORD unset nobody gets in, which is the correct
 * default for a page that lists wallet addresses.
 */

const COOKIE = "squib_admin";
/** Short by design. This grants sight of every entrant's address. */
const MAX_AGE = 60 * 60 * 8;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is missing or too short");
  return s;
}

async function hmac(value: string): Promise<string> {
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

async function sha256(value: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(new Uint8Array(d)).toString("base64url");
}

/** Length-independent, byte-by-byte. Compares digests, never the secrets. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/**
 * Hashes both sides before comparing, so the comparison runs over two equal
 * length digests and cannot leak the password's length or its first differing
 * character through timing.
 */
export async function passwordMatches(attempt: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return constantTimeEqual(await sha256(attempt), await sha256(expected));
}

export async function grantAdmin(): Promise<void> {
  const expires = String(Date.now() + MAX_AGE * 1000);
  const store = await cookies();
  store.set(COOKIE, `${expires}.${await hmac(expires)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function revokeAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** True only for a cookie we signed that has not expired. */
export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;

  try {
    const raw = (await cookies()).get(COOKIE)?.value;
    if (!raw) return false;

    const dot = raw.lastIndexOf(".");
    if (dot < 1) return false;

    const expires = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);

    if (!constantTimeEqual(sig, await hmac(expires))) return false;
    return Number(expires) > Date.now();
  } catch {
    return false;
  }
}
