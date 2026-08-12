import type { Metadata } from "next";

import AllowlistPage from "@/components/AllowlistPage";

export const metadata: Metadata = {
  title: "Allowlist",
  description:
    "Follow, like, repost, drop in an address. No wallet to connect and nothing to sign.",
  // The same body lives at /allowlist, so point search engines at that one.
  alternates: { canonical: "/allowlist" },
};

/** Landing straight in the funnel. The squibs themselves live at /squib. */
export default function HomePage() {
  return <AllowlistPage />;
}
