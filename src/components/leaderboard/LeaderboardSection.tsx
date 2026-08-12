import Reveal from "../ui/Reveal";
import CatchTheSquib from "./CatchTheSquib";
import DailySpin from "./DailySpin";
import LeaderboardTable from "./LeaderboardTable";

/** Body of /leaderboard. The page supplies the header. */
export default function LeaderboardSection() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal className="h-full">
          <DailySpin />
        </Reveal>
        <Reveal delay={0.06} className="h-full">
          <CatchTheSquib />
        </Reveal>
      </div>

      <Reveal>
        <LeaderboardTable />
      </Reveal>

      {/* INTEGRATION: sybil filtering. Enforced server side. This copy exists so
          the rules are public before the snapshot. */}
      <Reveal>
        <div className="border-2 border-hairline bg-surface p-5 shadow-card sm:p-6">
          <h2 className="font-display text-base font-bold tracking-tight">
            How we keep this from being farmed
          </h2>
          <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink/60 sm:grid-cols-2">
            <li>One entry per address, one per X account.</li>
            <li>Points are never weighted by follower count.</li>
            <li>Very new accounts with no history do not score.</li>
            <li>Obvious rings get pulled out before the snapshot.</li>
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
