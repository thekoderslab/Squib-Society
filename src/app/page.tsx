import Link from "next/link";

import FeaturedSquibs from "@/components/FeaturedSquibs";
import Hero from "@/components/Hero";
import { LinkButton } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { MINT_VENUE, WL_WINNERS } from "@/lib/constants";

const STEPS = [
  {
    n: "01",
    title: "Do three small things",
    body: "Follow, like, repost. That's the whole gate — finish those and you are allowlisted. No draw, no cut.",
    href: "/allowlist",
    cta: "Start now",
  },
  {
    n: "02",
    title: "Come back and climb",
    body: `Check in daily, keep a streak, answer the quiz. The top ${WL_WINNERS} at snapshot get guaranteed spots.`,
    href: "/leaderboard",
    cta: "See the board",
  },
  {
    n: "03",
    title: `Mint on ${MINT_VENUE}`,
    body: "The vault opens, all 369 meet the internet, and minting happens off-site. This page never asks for a wallet.",
    href: "/roadmap",
    cta: "Read the roadmap",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedSquibs />

      <section className="border-t-2 border-hairline py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-semibold leading-[1.04] tracking-tightest text-balance sm:text-5xl">
              How you get one.
            </h2>
          </Reveal>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-card border-2 border-hairline bg-surface p-6 shadow-card">
                  <span className="font-mono text-xs font-bold text-ink/30">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60 text-pretty">
                    {s.body}
                  </p>
                  <Link
                    href={s.href}
                    className="mt-auto pt-5 text-sm font-medium text-squib-deep underline underline-offset-4"
                  >
                    {s.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-vault border-2 border-hairline bg-squib-wash p-7 sm:p-10">
              <div className="max-w-md">
                <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Nobody who finishes the tasks leaves empty-handed.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  The leaderboard decides the guaranteed spots. The allowlist is
                  just for showing up.
                </p>
              </div>
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
