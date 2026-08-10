import { NextResponse } from "next/server";

import { notConfigured, serverError } from "@/lib/server/respond";
import { readRevealProgress } from "@/lib/server/reveal";
import { supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  try {
    return NextResponse.json(await readRevealProgress());
  } catch (e) {
    return serverError(e);
  }
}
