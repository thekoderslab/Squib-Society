import { CHAIN, MINT_VENUE, TOTAL_SUPPLY, WL_WINNERS } from "@/lib/constants";
import Chip from "./ui/Chip";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

type Phase = {
  n: string;
  title: string;
  body: string;
  status: "now" | "next" | "later";
};

const PHASES: Phase[] = [
  {
    n: "01",
    title: "Allowlist and community",
    body: `Tasks, streaks and the leaderboard run until snapshot. Everyone who finishes the base tasks is allowlisted. The top ${WL_WINNERS} get guaranteed spots.`,
    status: "now",
  },
  {
    n: "02",
    title: "Snapshot and reveal",
    body: "Points freeze at the published deadline. Guaranteed spots go out, the vault opens, and all 369 squibs meet the internet at once.",
    status: "next",
  },
  {
    n: "03",
    title: `Mint on ${MINT_VENUE}`,
    body: `Minting happens on ${MINT_VENUE}, on ${CHAIN}. Allowlist first, then public if anything is left. This site never asks you to connect a wallet.`,
    status: "later",
  },
  {
    n: "04",
    title: "Holder society",
    body: `Holders get first refusal on physical vinyl runs, naming rights on future roles, and a private channel that is mostly people posting shelves.`,
    status: "later",
  },
  {
    n: "05",
    title: "Series two",
    body: `New roles, same ${TOTAL_SUPPLY}-piece discipline. Holders decide which hobbies make the cut.`,
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
    <Section
      id="roadmap"
      eyebrow="Roadmap"
      title="Five phases. No treasure map."
      intro="Short and honest. If something here slips, we will say so on the timeline rather than quietly editing this page."
    >
      {/* the spine — horizontal on desktop, vertical on mobile */}
      <ol className="relative grid gap-6 md:grid-cols-5 md:gap-4">
        <div
          aria-hidden
          className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-hairline md:left-0 md:top-[15px] md:h-px md:w-full"
        />

        {PHASES.map((p, i) => (
          <Reveal as="li" key={p.n} delay={i * 0.06} className="relative pl-11 md:pl-0">
            <span
              className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-bold md:relative ${
                p.status === "now"
                  ? "bg-squib text-white shadow-green"
                  : "border border-hairline bg-surface text-ink/55"
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
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
                  {STATUS_LABEL[p.status]}
                </p>
              )}
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60 text-pretty">
                {p.body}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
