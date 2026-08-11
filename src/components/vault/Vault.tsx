import { readRevealProgress } from "@/lib/server/reveal";
import Reveal from "../ui/Reveal";
import RevealBar from "./RevealBar";
import VaultGrid from "./VaultGrid";

/** Body of /vault. The page supplies the header. */
export default async function Vault() {
  // INTEGRATION: points ledger — the live allowlist count drives the reveals.
  // Falls back to the mock number when Supabase isn't configured.
  const progress = await readRevealProgress();

  return (
    <div className="space-y-8 sm:space-y-10">
      <Reveal>
        <RevealBar progress={progress} />
      </Reveal>

      <Reveal delay={0.08}>
        <div className="rounded-vault border-2 border-hairline bg-surface p-4 shadow-card sm:p-6">
          <VaultGrid />
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="text-center text-sm text-ink/50">
          Tap a revealed squib to meet them. The locked ones do not appreciate
          being poked.
        </p>
      </Reveal>
    </div>
  );
}
