import type { Metadata } from "next";

import LeaderboardSection from "@/components/leaderboard/LeaderboardSection";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Spin once a day, play the game, climb. The people at the top pick up guaranteed spots.",
};

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title="The people who keep turning up end up at the top."
        intro="Points come from coming back, not from how many followers you have. A big account that shows up once will sit below someone who has been spinning every day for a month."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <LeaderboardSection />
      </div>
    </>
  );
}
