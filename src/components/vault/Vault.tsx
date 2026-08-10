import { getRevealProgress } from "@/lib/mock-api";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import RevealBar from "./RevealBar";
import VaultGrid from "./VaultGrid";

export default async function Vault() {
  // INTEGRATION: points ledger + leaderboard (allowlist count drives reveals)
  const progress = await getRevealProgress();

  return (
    <Section
      id="peek"
      eyebrow="The vault"
      title={`${progress.revealed} are out. The other ${
        progress.total - progress.revealed
      } are still in the dark.`}
      intro="Every tile below is a squib that exists, finished, photographed and waiting. They come out when enough of you show up — not on a date we picked."
    >
      <div className="space-y-8 sm:space-y-10">
        <Reveal>
          <RevealBar progress={progress} />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-vault border border-hairline bg-surface p-4 shadow-card sm:p-6">
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
    </Section>
  );
}
