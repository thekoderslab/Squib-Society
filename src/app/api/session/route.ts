import { NextResponse } from "next/server";

import { limitByIp } from "@/lib/server/guard";
import { notConfigured, serverError } from "@/lib/server/respond";
import { clearSession, setSession } from "@/lib/server/session";
import { upsertProfile } from "@/lib/server/store";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * // INTEGRATION: X OAuth
 *
 * Today this mints a throwaway identity so the funnel is walkable end to end.
 * The real version replaces the block marked below with the OAuth 2.0 PKCE
 * callback: exchange the code, read `id`, `username`, `name`, `profile_image_url`
 * and `created_at` from /2/users/me, and pass those to upsertProfile. Nothing
 * else in this file changes — the profile row and the signed cookie stay the same.
 */
const MOCK_ACCOUNTS = [
  { handle: "tentaclepilled", displayName: "tentacle pilled" },
  { handle: "vinylgoblin", displayName: "vinyl goblin" },
  { handle: "shelfappeal", displayName: "shelf appeal" },
  { handle: "softcosmic", displayName: "soft cosmic" },
];

export async function POST(request: Request) {
  if (!supabaseConfigured) return notConfigured();

  // Connecting is what mints a profile row, so this is the route a bot would
  // hammer first. Tight cap per address.
  const limited = await limitByIp(request, "session", { limit: 8, windowSeconds: 3600 });
  if (limited) return limited;

  try {
    // ── replace this block with the real OAuth exchange ──────────────────
    const pick = MOCK_ACCOUNTS[Math.floor(Math.random() * MOCK_ACCOUNTS.length)];
    const suffix = Math.random().toString(36).slice(2, 8);
    const account = {
      xUserId: `mock:${pick.handle}:${suffix}`,
      handle: `${pick.handle}_${suffix}`,
      displayName: pick.displayName,
    };
    // ─────────────────────────────────────────────────────────────────────

    const profile = await upsertProfile(account);
    await setSession(profile.id);

    return NextResponse.json({
      handle: profile.handle,
      displayName: profile.display_name ?? profile.handle,
      seed: profile.handle,
    });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE() {
  if (!supabaseConfigured) return notConfigured();
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
