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

const pad = (id: number) => String(id).padStart(4, "0");

export default function Hero() {
  return (
    <section className="border-b-2 border-hairline">
      <div className="mx-auto grid w-full max-w-6xl gap-0 px-0 lg:grid-cols-[1.05fr_1fr]">
        {/* left column: the type */}
        <Reveal className="border-hairline px-5 py-12 sm:px-8 sm:py-16 lg:border-r-2">
          <div>
            <p className="inline-flex items-center gap-2 border-2 border-hairline bg-squib px-2.5 py-1 stamp text-ink">
              <span className="h-1.5 w-1.5 bg-ink" aria-hidden />
              Allowlist open
            </p>

            <h1 className="mt-6 font-display text-[2.9rem] font-bold leading-[0.9] tracking-tightest text-balance sm:text-[4.5rem]">
              {TOTAL_SUPPLY} tiny old gods
              <br />
              took up hobbies.
            </h1>

            <p className="mt-6 max-w-lg border-l-4 border-hairline pl-4 text-[16px] leading-relaxed text-ink/70 text-pretty">
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

            {/* spec block — reads like a printed data table */}
            <dl className="mt-10 grid grid-cols-3 gap-px border-2 border-hairline bg-hairline">
              <div className="bg-surface px-3 py-3">
                <dt className="stamp text-ink/50">Chain</dt>
                <dd className="mt-1.5 text-sm font-medium leading-tight">
                  {CHAIN}
                  <span className="mt-0.5 block font-mono text-[10px] text-ink/45">
                    {CHAIN_SUBTITLE}
                  </span>
                </dd>
              </div>
              <div className="bg-surface px-3 py-3">
                <dt className="stamp text-ink/50">Mint</dt>
                <dd className="mt-1.5 text-sm font-medium">{MINT_VENUE}</dd>
              </div>
              <div className="bg-surface px-3 py-3">
                <dt className="stamp text-ink/50">GTD spots</dt>
                <dd className="mt-1.5 font-mono text-sm font-bold tabular">
                  {WL_WINNERS}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        {/* right column: the toy, in a ruled frame */}
        <Reveal delay={0.1} className="relative border-t-2 border-hairline lg:border-t-0">
          <div className="relative h-full bg-surface">
            <Link href={`/squib/${pad(LEAD.id)}`} className="group block">
              <SquibPhoto
                squib={LEAD}
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="h-auto w-full"
              />
              <span className="flex items-center justify-between gap-3 border-t-2 border-hairline px-5 py-3">
                <span>
                  <span className="block font-display text-lg font-bold leading-tight">
                    {LEAD.name}
                  </span>
                  <span className="block text-sm text-ink/55">{LEAD.role}</span>
                </span>
                <span className="border-2 border-hairline bg-cream px-2 py-1 font-mono text-[11px] font-bold tabular">
                  #{pad(LEAD.id)}
                </span>
              </span>
            </Link>

            {/* shelf neighbour, overlapping the frame edge */}
            <Link
              href={`/squib/${pad(SECOND.id)}`}
              className="group absolute -left-5 bottom-24 hidden w-32 border-2 border-hairline bg-surface shadow-lift transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] lg:block"
            >
              <SquibPhoto squib={SECOND} sizes="140px" className="h-auto w-full" />
              <span className="block border-t-2 border-hairline px-2 py-1 font-mono text-[10px] font-bold">
                #{pad(SECOND.id)}
              </span>
            </Link>

            <PeekingSquib
              className="-right-2 bottom-16 z-[-1] h-24 w-24 sm:h-32 sm:w-32"
              period={17}
              delay={6}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
