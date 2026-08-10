import {
  CHAIN,
  CHAIN_SUBTITLE,
  MINT_VENUE,
  SNAPSHOT_ISO,
  TOTAL_SUPPLY,
  WL_WINNERS,
} from "@/lib/constants";
import Reveal from "./ui/Reveal";

const SNAPSHOT_LABEL = new Date(SNAPSHOT_ISO).toLocaleString("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const QA: { q: string; a: string }[] = [
  {
    q: "What is a squib, exactly?",
    a: "An old thing from the deep dark that decided to take up a hobby. Round green head, small tentacle mouth, glossy black eyes, and a full outfit for whatever it does on weekends. They are designed as vinyl art toys first and tokens second.",
  },
  {
    q: `Why ${TOTAL_SUPPLY}?`,
    a: `Because every one of the ${TOTAL_SUPPLY} is modelled, dressed, named and shot by hand. That is the number we can do properly, so that is the number. It does not go up later.`,
  },
  {
    q: "Which chain is this on?",
    a: `${CHAIN} — ${CHAIN_SUBTITLE}. If your wallet already works with EVM addresses, you are set. The address you enter is where a squib would land.`,
  },
  {
    q: "How does the mint work?",
    a: `On ${MINT_VENUE}, not here. This site never asks you to connect a wallet or sign anything, so if you ever see a connect prompt claiming to be us, it isn't. We publish the exact ${MINT_VENUE} link before mint day.`,
  },
  {
    q: "How are allowlist and guaranteed spots picked?",
    a: `Finish the three base tasks and you are allowlisted — no draw, no cut, no waiting to see. Guaranteed spots come from two places: the top ${WL_WINNERS} on the leaderboard at snapshot, and the one-time upgrade spin you get after you submit.`,
  },
  {
    q: "When is the snapshot?",
    a: `${SNAPSHOT_LABEL} UTC. Points freeze at that moment. If the date has to move we will say so on the roadmap rather than quietly changing this line.`,
  },
  {
    q: "Can I farm the leaderboard with a big account?",
    a: "Not really the point. Points come from checking in, daily quests and the quiz — things that reward returning rather than reach. Follower count carries zero weight, and duplicate addresses and handles get removed before snapshot.",
  },
  {
    q: "When do the rest of the squibs get revealed?",
    a: `At community milestones, shown live on the vault progress bar. The full ${TOTAL_SUPPLY} come out at mint.`,
  },
];

export default function Faq() {
  return (
    <Reveal>
      <div className="mx-auto max-w-2xl divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
        {QA.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium transition hover:bg-ink/[0.02] sm:px-6">
              {item.q}
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-hairline text-ink/50 transition group-open:rotate-45 group-open:border-squib group-open:bg-squib group-open:text-white"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3">
                  <path
                    d="M6 1.5v9M1.5 6h9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-ink/60 text-pretty sm:px-6">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}
