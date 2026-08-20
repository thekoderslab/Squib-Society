import { NextResponse } from "next/server";

import { notConfigured, serverError } from "@/lib/server/respond";
import { clearSession } from "@/lib/server/session";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * Sign out.
 *
 * There is deliberately no POST here any more. Sessions are created only by
 * completing the real X flow at /api/auth/x/callback. The old POST minted a
 * profile on request, which was fine while it was the only way to demo the
 * funnel and is a hole now that OAuth exists: anyone could have kept calling
 * it to manufacture allowlist accounts without ever touching X.
 */
export async function DELETE() {
  if (!supabaseConfigured) return notConfigured();
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
