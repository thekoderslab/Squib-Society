import type { Metadata } from "next";

import Roadmap from "@/components/Roadmap";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Community first, then the allowlist, then the mint. There may never be a public round.",
};

export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        eyebrow="The plan"
        title="Community first. Everything else after that."
        intro="Five things, in the order they actually happen. If a date moves we will say so here rather than quietly changing the page and hoping nobody kept a screenshot."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Roadmap />
      </div>
    </>
  );
}
