import { REVEAL_MILESTONES, TOTAL_SUPPLY } from "@/lib/constants";
import { REVEALED_SQUIBS, getRevealProgress as mockRevealProgress } from "@/lib/mock-api";
import type { RevealProgress } from "@/lib/types";
import { getAllowlistedCount } from "./store";
import { supabaseConfigured } from "./supabase";

/**
 * Used by both the /api/reveal route and the Vault server component, so the
 * number on the page and the number in the API can't drift apart.
 *
 * Which squibs are revealed stays curated in mock-api.ts — that's art
 * direction, not data. Only the allowlist count is live.
 */
export async function readRevealProgress(): Promise<RevealProgress> {
  if (!supabaseConfigured) return mockRevealProgress();

  try {
    const allowlisted = await getAllowlistedCount();
    const next = REVEAL_MILESTONES.find((m) => m.allowlisted > allowlisted) ?? null;
    return {
      revealed: REVEALED_SQUIBS.length,
      total: TOTAL_SUPPLY,
      allowlisted,
      nextMilestone: next ? { ...next } : null,
    };
  } catch (e) {
    // A dead database should not take the whole page down — the vault is
    // decorative enough to degrade to the mock number.
    console.error("[squib] reveal progress fell back to mock:", e);
    return mockRevealProgress();
  }
}
