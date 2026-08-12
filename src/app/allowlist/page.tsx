import type { Metadata } from "next";

import AllowlistFunnel from "@/components/funnel/AllowlistFunnel";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Allowlist",
  description:
    "Follow, like, repost, drop in an address. No wallet to connect and nothing to sign.",
};

export default function AllowlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Allowlist"
        title="Three things, then you're on the list."
        intro="There is no wallet to connect here and nothing to sign. You do three small things on X, tell us where to send a squib, and that is the whole process. Takes about a minute."
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
