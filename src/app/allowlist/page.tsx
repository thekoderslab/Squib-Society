import type { Metadata } from "next";

import AllowlistPage from "@/components/AllowlistPage";

export const metadata: Metadata = {
  title: "Allowlist",
  description:
    "Follow, like, repost, drop in an address. No wallet to connect and nothing to sign.",
  alternates: { canonical: "/allowlist" },
};

export default function Page() {
  return <AllowlistPage />;
}
