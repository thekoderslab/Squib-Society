import type { Metadata } from "next";

import Roadmap from "@/components/Roadmap";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Five phases from allowlist to series two. Short, honest, and updated on the page rather than quietly edited.",
};

export default function RoadmapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Roadmap"
        title="Five phases. No treasure map."
        intro="Short and honest. If something here slips, we will say so on the timeline rather than quietly editing this page."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Roadmap />
      </div>
    </>
  );
}
