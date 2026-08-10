import type { Metadata } from "next";

import Faq from "@/components/Faq";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "What a squib is, which chain, how the mint works on OpenSea, and how allowlist and guaranteed spots are picked.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="The things people actually ask."
        align="center"
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <Faq />
      </div>
    </>
  );
}
