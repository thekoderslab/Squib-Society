import type { Metadata } from "next";

import PageHeader from "@/components/ui/PageHeader";
import Vault from "@/components/vault/Vault";
import { TOTAL_SUPPLY } from "@/lib/constants";
import { REVEALED_SQUIBS } from "@/lib/mock-api";

export const metadata: Metadata = {
  title: "The vault",
  description: `${REVEALED_SQUIBS.length} of ${TOTAL_SUPPLY} squibs are out. The rest unlock at community milestones.`,
};

/** The allowlist count is live, so don't cache this page for long. */
export const revalidate = 60;

export default function VaultPage() {
  const revealed = REVEALED_SQUIBS.length;
  return (
    <>
      <PageHeader
        eyebrow="The vault"
        title={`${revealed} are out. The other ${TOTAL_SUPPLY - revealed} are still in the dark.`}
        intro="Every tile below is a squib that exists — finished, dressed, photographed and waiting. They come out when enough of you show up, not on a date we picked."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Vault />
      </div>
    </>
  );
}
