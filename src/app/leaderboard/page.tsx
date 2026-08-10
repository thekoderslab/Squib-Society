import type { Metadata } from "next";

import LeaderboardSection from "@/components/leaderboard/LeaderboardSection";
import PageHeader from "@/components/ui/PageHeader";
import { WL_WINNERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: `Check in daily, keep a streak, climb. The top ${WL_WINNERS} at snapshot receive guaranteed spots.`,
};

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title="The people who keep showing up get the guaranteed spots."
        intro="Points come from returning, not from reach. Follower count is worth nothing here — a big account that shows up once will sit below someone on a thirty-day streak."
      />
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <LeaderboardSection />
      </div>
    </>
  );
}
