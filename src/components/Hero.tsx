import { MINT_VENUE, TOTAL_SUPPLY } from "@/lib/constants";
import SquibSlider from "./SquibSlider";
import { LinkButton } from "./ui/Button";
import Reveal from "./ui/Reveal";

export default function Hero() {
  return (
    <section className="relative border-b-2 border-hairline">
      {/*
        Half bleed. The grid is full width so the slide runs to the right edge,
        but the copy is padded in by exactly the gutter the nav uses, so the
        headline starts on the same vertical line as the wordmark above it.
        max() keeps it at the plain mobile gutter on narrow screens, where
        (100vw - 72rem) is negative.
      */}
      <div className="grid w-full gap-0 lg:grid-cols-[1.05fr_1fr]">
        <Reveal className="flex flex-col justify-center border-hairline py-10 pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] pr-5 sm:py-14 sm:pl-[max(2rem,calc((100vw-72rem)/2+2rem))] sm:pr-10 lg:border-r-2">
          <div>
            <p className="stamp inline-flex items-center gap-2 border-2 border-hairline bg-squib px-2.5 py-1 text-ink">
              <span className="h-1.5 w-1.5 bg-ink" aria-hidden />
              Allowlist open
            </p>

            <h1 className="mt-6 font-display text-[2.75rem] font-bold leading-[0.9] tracking-tightest text-balance sm:text-[4.25rem]">
              {TOTAL_SUPPLY} squibs.
              <br />
              Every one of them
              <br />
              is up to something.
            </h1>

            <p className="mt-6 max-w-lg border-l-4 border-hairline pl-4 text-[16px] leading-relaxed text-ink/70 text-pretty">
              Some skate. One runs a kitchen. One has not taken the paper bag off
              his head and nobody has asked him to. {TOTAL_SUPPLY} of them, each
              with their own kit and their own thing going on, arriving on{" "}
              {MINT_VENUE}.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
              <LinkButton href="/roadmap" variant="ghost" size="lg">
                What&apos;s the plan
              </LinkButton>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="border-t-2 border-hairline lg:border-t-0">
          <SquibSlider />
        </Reveal>
      </div>
    </section>
  );
}
