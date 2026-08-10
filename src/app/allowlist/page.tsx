import type { Metadata } from "next";

import AllowlistFunnel from "@/components/funnel/AllowlistFunnel";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Allowlist",
  description:
    "Three small things and you're on the list. No wallet connection, no signature, nothing to approve.",
};

export default function AllowlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Allowlist"
        title="Three small things and you're on the list."
        intro="No wallet connection, no signature, nothing to approve. We ask for an address as plain text and that is the extent of it."
        align="center"
      />
      <div className="bg-squib-wash/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <Reveal>
            <AllowlistFunnel />
          </Reveal>
        </div>
      </div>
    </>
  );
}
