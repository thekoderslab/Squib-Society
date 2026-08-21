import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";
import PageHeader from "@/components/ui/PageHeader";
import { isAdmin } from "@/lib/server/admin";

export const metadata: Metadata = {
  title: "Squib Society",
  // Not linked from anywhere and not for search engines.
  robots: { index: false, follow: false },
};

/** Reads the admin cookie, so it can never be statically rendered. */
export const dynamic = "force-dynamic";

/**
 * Gated on the server, not in the browser.
 *
 * When locked, the page IS the password field: no heading, no description, and
 * none of the dashboard markup is sent at all. Hiding it client side would
 * still ship the whole thing to anyone who opened view-source.
 */
export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="The numbers."
        intro="Everything the site knows, counted."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <AdminDashboard />
      </div>
    </>
  );
}
