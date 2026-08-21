import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/AdminDashboard";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Numbers",
  // Not linked from anywhere and not for search engines.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="The numbers."
        intro="Everything the site knows, counted. Visible only to accounts listed in ADMIN_X_IDS."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <AdminDashboard />
      </div>
    </>
  );
}
