import { SNAPSHOT_ISO, WL_WINNERS } from "@/lib/constants";
import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import CatchTheSquib from "./CatchTheSquib";
import Countdown from "./Countdown";
import DailyCheckIn from "./DailyCheckIn";
import DailyQuestCard from "./DailyQuest";
import LeaderboardTable from "./LeaderboardTable";
import LoreTrivia from "./LoreTrivia";

/** Fixed locale + UTC so server and client render the same string. */
const SNAPSHOT_LABEL = new Date(SNAPSHOT_ISO).toLocaleString("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function LeaderboardSection() {
  return (
    <Section
      id="leaderboard"
      eyebrow="Leaderboard"
      title="The people who keep showing up get the guaranteed spots."
      intro={`Points come from returning, not from reach. Follower count is worth nothing here — a big account that shows up once will sit below someone on a thirty-day streak.`}
    >
      <div className="space-y-8 sm:space-y-10">
        {/* snapshot bar */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-card border border-hairline bg-surface p-5 shadow-card sm:p-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-squib-deep">
                Snapshot in
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
                Top {WL_WINNERS} at snapshot receive guaranteed spots.
                <br />
                <span className="font-mono text-xs text-ink/45">
                  {SNAPSHOT_LABEL} UTC
                </span>
              </p>
            </div>
            <Countdown />
          </div>
        </Reveal>

        {/* the repeatable stuff */}
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="h-full">
            <DailyCheckIn />
          </Reveal>
          <Reveal delay={0.05} className="h-full">
            <DailyQuestCard />
          </Reveal>
          <Reveal delay={0.1} className="h-full">
            <LoreTrivia />
          </Reveal>
          <Reveal delay={0.15} className="h-full">
            <CatchTheSquib />
          </Reveal>
        </div>

        <Reveal>
          <LeaderboardTable />
        </Reveal>

        {/* INTEGRATION: sybil filtering — these rules are enforced server-side;
            the copy exists so the rules are public before the snapshot. */}
        <Reveal>
          <div className="rounded-card border border-hairline bg-surface p-5 shadow-card sm:p-6">
            <h3 className="font-display text-base font-semibold tracking-tight">
              How we keep this from being farmed
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink/60 sm:grid-cols-2">
              <li>One entry per EVM address, one per X account.</li>
              <li>Points are never weighted by follower count.</li>
              <li>Accounts under a minimum age and follower floor don&apos;t score.</li>
              <li>Captcha at submit, and obvious rings get removed before snapshot.</li>
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
