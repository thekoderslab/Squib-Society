import { CHAIN, MINT_VENUE, TOTAL_SUPPLY } from "@/lib/constants";
import Chip from "./ui/Chip";
import Reveal from "./ui/Reveal";

type Phase = {
  n: string;
  title: string;
  body: string;
  status: "now" | "next" | "later";
};

const PHASES: Phase[] = [
  {
    n: "01",
    title: "Build the room first",
    body: "Before anything is for sale we want people who actually like the squibs. That means posting them, arguing about which one is best, and letting the group get big enough to be worth showing up for.",
    status: "now",
  },
  {
    n: "02",
    title: "Open the allowlist",
    body: "Three small tasks and you are on the list. The leaderboard runs alongside it, and the people at the top of it pick up guaranteed spots when we take the snapshot.",
    status: "now",
  },
  {
    n: "03",
    title: `Mint on ${MINT_VENUE}`,
    body: `The mint is on ${MINT_VENUE}, on ${CHAIN}, and the allowlist goes first. If the list fills the supply then that is where it ends. There may never be a public round, and we would rather say that now than pretend otherwise later.`,
    status: "next",
  },
  {
    n: "04",
    title: "Look after the holders",
    body: "First call on any physical run, a say in which squibs get made next, and a channel that is mostly people showing each other what they picked up.",
    status: "later",
  },
  {
    n: "05",
    title: "Keep making squibs",
    body: `The ${TOTAL_SUPPLY} do not change and the number never goes up. What comes after is new work, decided with the people holding them, not a sequel with a number stuck on the end.`,
    status: "later",
  },
];

const STATUS_LABEL: Record<Phase["status"], string> = {
  now: "Happening now",
  next: "Up next",
  later: "Later",
};

export default function Roadmap() {
  return (
    <ol className="relative grid gap-8 md:grid-cols-5 md:gap-4">
      <div
        aria-hidden
        className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 bg-hairline md:left-0 md:top-[15px] md:h-0.5 md:w-full"
      />

      {PHASES.map((p, i) => (
        <Reveal as="li" key={p.n} delay={i * 0.06} className="relative pl-11 md:pl-0">
          <span
            className={`absolute left-0 top-0 grid h-8 w-8 place-items-center border-2 border-hairline font-mono text-[11px] font-bold md:relative ${
              p.status === "now" ? "bg-squib text-ink shadow-card" : "bg-surface text-ink/55"
            }`}
          >
            {p.n}
          </span>

          <div className="md:mt-5 md:pr-4">
            {p.status === "now" ? (
              <Chip tone="green" className="mb-2">
                {STATUS_LABEL[p.status]}
              </Chip>
            ) : (
              <p className="stamp mb-2 text-ink/40">{STATUS_LABEL[p.status]}</p>
            )}
            <h2 className="font-display text-lg font-bold tracking-tight">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/60 text-pretty">
              {p.body}
            </p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
