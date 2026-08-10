import Link from "next/link";

import {
  CHAIN,
  CHAIN_SUBTITLE,
  MINT_VENUE,
  TOTAL_SUPPLY,
  WL_WINNERS,
} from "@/lib/constants";
import { getSquibById } from "@/lib/mock-api";
import PeekingSquib from "./art/PeekingSquib";
import SquibPhoto from "./art/SquibPhoto";
import { LinkButton } from "./ui/Button";
import Reveal from "./ui/Reveal";

const LEAD = getSquibById(9)!; // Mage, the skater — the most legible silhouette
const SECOND = getSquibById(369)!; // Skullknit, for contrast

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* studio light: one soft warm pool, no gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-[620px] max-w-4xl rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(244,239,230,0))",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-10">
        <Reveal>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-ink/65 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-squib" aria-hidden />
              Allowlist is open
            </p>

            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[0.94] tracking-tightest text-balance sm:text-[4.25rem] lg:text-[4.75rem]">
              {TOTAL_SUPPLY} tiny old gods
              <br />
              took up hobbies.
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink/70 text-pretty">
              Squibs are ancient things from the deep dark who now skate, cook,
              shoot longbows and stand around marinas in a good cardigan. A
              collection of {TOTAL_SUPPLY} designer toys, minting on {MINT_VENUE},
              on {CHAIN}.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
              <LinkButton href="/vault" variant="ghost" size="lg">
                Open the vault
              </LinkButton>
            </div>

            <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-hairline pt-6 text-sm">
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
                <dd className="font-mono font-medium tabular">{WL_WINNERS}</dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative">
            <Link
              href={`/squib/${String(LEAD.id).padStart(4, "0")}`}
              className="group relative block overflow-hidden rounded-vault border border-hairline bg-surface shadow-lift"
            >
              <SquibPhoto
                squib={LEAD}
                priority
                sizes="(max-width: 1024px) 92vw, 520px"
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-surface via-surface/80 to-transparent px-5 pb-4 pt-14">
                <span>
                  <span className="block font-display text-lg font-semibold tracking-tight">
                    {LEAD.name}
                  </span>
                  <span className="block text-sm text-ink/55">{LEAD.role}</span>
                </span>
                <span className="font-mono text-xs text-ink/45">
                  #{String(LEAD.id).padStart(4, "0")}
                </span>
              </span>
            </Link>

            {/* second toy, tucked at the corner like a shelf neighbour */}
            <Link
              href={`/squib/${String(SECOND.id).padStart(4, "0")}`}
              className="group absolute -bottom-6 -left-4 hidden w-36 overflow-hidden rounded-card border border-hairline bg-surface shadow-lift sm:block lg:-left-10 lg:w-44"
            >
              <SquibPhoto
                squib={SECOND}
                sizes="180px"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <span className="block px-3 pb-2 pt-1 font-mono text-[10px] text-ink/45">
                #{String(SECOND.id).padStart(4, "0")} {SECOND.name}
              </span>
            </Link>

            <PeekingSquib
              className="-right-3 bottom-10 z-[-1] h-28 w-28 sm:h-36 sm:w-36"
              period={17}
              delay={6}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
