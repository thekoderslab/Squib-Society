import { NextResponse } from "next/server";

import {
  adminConfigured,
  grantAdmin,
  passwordMatches,
  revokeAdmin,
} from "@/lib/server/admin";
import { limitByIp } from "@/lib/server/guard";
import { serverError } from "@/lib/server/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Hard cap. This is the one endpoint on the site worth brute forcing, and a
  // password is only as good as the number of attempts allowed against it.
  const limited = await limitByIp(request, "admin-login", {
    limit: 10,
    windowSeconds: 900,
  });
  if (limited) return limited;

  try {
    if (!adminConfigured()) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as { password?: string };
    if (!(await passwordMatches(String(body.password ?? "")))) {
      // Deliberately vague: a wrong password and an unknown one look identical.
      return NextResponse.json({ error: "wrong" }, { status: 401 });
    }

    await grantAdmin();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE() {
  try {
    await revokeAdmin();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e);
  }
}
