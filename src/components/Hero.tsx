import {
  CHAIN,
  CHAIN_SUBTITLE,
  MINT_VENUE,
  TOTAL_SUPPLY,
  WL_WINNERS,
} from "@/lib/constants";
import { REVEALED_SQUIBS } from "@/lib/mock-api";
import PeekingSquib from "./art/PeekingSquib";
import SquibImage from "./art/SquibImage";
import { LinkButton } from "./ui/Button";
import Reveal from "./ui/Reveal";

const HERO_SQUIB = REVEALED_SQUIBS.find((s) => s.variant === "boxer")!;
const HERO_SQUIB_ALT = REVEALED_SQUIBS.find((s) => s.variant === "baseball")!;

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
      {/* studio light: one soft warm pool behind the shelf, nothing gradient-y */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[560px] max-w-4xl rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(244,239,230,0))",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
        <Reveal>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-ink/65 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-squib" aria-hidden />
              Allowlist is open
            </p>

            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[0.98] tracking-tightest text-balance sm:text-6xl lg:text-[4.2rem]">
              {TOTAL_SUPPLY} tiny old gods
              <br />
              took up hobbies.
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink/70 text-pretty">
              Squibs are ancient things from the deep dark who now box, skate,
              garden and play third base. A collection of {TOTAL_SUPPLY} designer
              toys, minting on {MINT_VENUE}, on {CHAIN}.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="#allowlist" size="lg">
                Join allowlist
              </LinkButton>
              <LinkButton href="#peek" variant="ghost" size="lg">
                Peek inside
              </LinkButton>
            </div>

            <dl className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-6 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="text-ink/50">Chain</dt>
                <dd className="font-medium">
                  {CHAIN}{" "}
                  <span className="font-mono text-[11px] text-ink/45">
                    {CHAIN_SUBTITLE}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-ink/50">Mint</dt>
                <dd className="font-medium">{MINT_VENUE}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-ink/50">Guaranteed spots</dt>
                <dd className="font-mono font-medium tabular">
                  {WL_WINNERS}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative">
            {/* the shelf: two squibs, studio-lit, standing on a hairline */}
            <div className="studio-grain relative overflow-hidden rounded-vault border border-hairline bg-surface px-6 pb-0 pt-8 shadow-lift sm:px-10 sm:pt-12">
              <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-6">
                <div className="w-[42%] max-w-[190px] translate-y-2 opacity-95 sm:w-[38%]">
                  <SquibImage
                    squib={HERO_SQUIB_ALT}
                    className="h-auto w-full"
                    priority
                  />
                </div>
                <div className="w-[58%] max-w-[280px] sm:w-[56%]">
                  <SquibImage squib={HERO_SQUIB} className="h-auto w-full" priority />
                </div>
              </div>
              <div
                className="relative z-10 h-px w-full bg-hairline"
                aria-hidden
              />
              <div className="relative z-10 flex items-center justify-between py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/45">
                <span>
                  #{String(HERO_SQUIB_ALT.id).padStart(4, "0")} {HERO_SQUIB_ALT.name}
                </span>
                <span>
                  #{String(HERO_SQUIB.id).padStart(4, "0")} {HERO_SQUIB.name}
                </span>
              </div>

              {/* ambient moment — peeks in from behind the shelf edge */}
              <PeekingSquib
                variant="ninja"
                className="-right-2 bottom-0 z-0 h-40 w-32 sm:h-52 sm:w-40"
                period={16}
                delay={5}
              />
            </div>

            <p className="mt-4 text-center text-xs text-ink/45">
              2 of {TOTAL_SUPPLY} out of the vault. The rest are still in the dark.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
