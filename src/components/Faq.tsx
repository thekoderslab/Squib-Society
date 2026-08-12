import { CHAIN, CHAIN_SUBTITLE, MINT_VENUE, TOTAL_SUPPLY } from "@/lib/constants";
import Reveal from "./ui/Reveal";

const QA: { q: string; a: string }[] = [
  {
    q: "What is a squib?",
    a: "A character. Round green head, small tentacle mouth, two very shiny eyes, and whatever outfit fits what they are into. Some skate, one cooks, one has a paper bag on his head. There are 369 of them and no two are the same.",
  },
  {
    q: `Why ${TOTAL_SUPPLY} of them?`,
    a: `Because each one is modelled, dressed, named and shot on its own. That is the number we can do properly. It does not go up later, and there is no secret second batch waiting.`,
  },
  {
    q: "Which chain is this on?",
    a: `${CHAIN}, which is ${CHAIN_SUBTITLE}. If your wallet already handles EVM addresses you are fine. The address you give us is where a squib would land.`,
  },
  {
    q: "How does the mint work?",
    a: `On ${MINT_VENUE}, not on this site. We never ask you to connect a wallet or sign anything here, so if you ever see a connect prompt claiming to be us, it is not us. The real ${MINT_VENUE} link goes out before mint day.`,
  },
  {
    q: "How do I get a guaranteed spot?",
    a: "Finish the three tasks and you are on the allowlist. That part is not a competition. Guaranteed spots go to the people sitting at the top of the leaderboard when we take the snapshot, which is decided by how often you come back rather than how big your account is.",
  },
  {
    q: "Will there be a public mint?",
    a: "Maybe not. The allowlist goes first, and if it fills the supply then that is where it ends. We would rather tell you that now than let you assume there is a second chance coming.",
  },
  {
    q: "Can I farm the leaderboard with a big account?",
    a: "Not really the point. Points come from spinning each day and playing the game, so a hundred thousand followers is worth exactly nothing here. Duplicate addresses and handles get pulled out before the snapshot.",
  },
  {
    q: "When do I see the rest of them?",
    a: "We are showing a few at a time on the way to mint. All 369 turn up on mint day.",
  },
];

export default function Faq() {
  return (
    <Reveal>
      <div className="mx-auto max-w-2xl divide-y-2 divide-hairline overflow-hidden border-2 border-hairline bg-surface shadow-card">
        {QA.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium transition hover:bg-ink/[0.03] sm:px-6">
              {item.q}
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center border-2 border-hairline text-ink/50 transition group-open:rotate-45 group-open:bg-squib group-open:text-ink"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3">
                  <path
                    d="M6 1.5v9M1.5 6h9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-ink/65 text-pretty sm:px-6">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}
