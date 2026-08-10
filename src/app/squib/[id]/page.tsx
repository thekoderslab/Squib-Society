import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SquibPhoto from "@/components/art/SquibPhoto";
import { LinkButton } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { CHAIN, COLLECTION_NAME, MINT_VENUE, TOTAL_SUPPLY } from "@/lib/constants";
import { REVEALED_SQUIBS, getSquibById } from "@/lib/mock-api";

type Params = { id: string };

const pad = (id: number) => String(id).padStart(4, "0");

/** Only revealed squibs get a page. The locked 359 aren't linkable yet. */
export function generateStaticParams(): Params[] {
  return REVEALED_SQUIBS.map((s) => ({ id: pad(s.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const squib = getSquibById(Number(id));
  if (!squib) return { title: "Squib not found" };

  return {
    title: `${squib.name} · #${pad(squib.id)}`,
    description: squib.bio,
    openGraph: {
      title: `${squib.name} — ${squib.role} · ${COLLECTION_NAME}`,
      description: squib.bio,
      images: [{ url: squib.photo, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${squib.name} — ${squib.role}`,
      description: squib.bio,
      images: [squib.photo],
    },
  };
}

export default async function SquibPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const squib = getSquibById(Number(id));
  if (!squib) notFound();

  const index = REVEALED_SQUIBS.findIndex((s) => s.id === squib.id);
  const prev = REVEALED_SQUIBS[index - 1];
  const next = REVEALED_SQUIBS[index + 1];

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-sm text-ink/55 transition hover:text-ink"
        >
          <span aria-hidden>←</span> Back to the vault
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14">
        <Reveal>
          <div className="overflow-hidden rounded-vault border border-hairline bg-surface shadow-lift">
            <SquibPhoto
              squib={squib}
              priority
              sizes="(max-width: 1024px) 92vw, 600px"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
              #{pad(squib.id)} / {TOTAL_SUPPLY}
            </p>

            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] tracking-tightest sm:text-6xl">
              {squib.name}
            </h1>

            <p className="mt-3 text-lg font-medium text-squib-deep">{squib.role}</p>

            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink/70 text-pretty">
              {squib.bio}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-hairline bg-hairline">
              <div className="bg-surface px-4 py-3.5">
                <dt className="text-xs text-ink/50">Token</dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular">
                  #{pad(squib.id)}
                </dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="text-xs text-ink/50">Role</dt>
                <dd className="mt-1 text-sm font-medium">{squib.role}</dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="text-xs text-ink/50">Shot on location</dt>
                <dd className="mt-1 text-sm font-medium">{squib.scene}</dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="text-xs text-ink/50">Chain</dt>
                <dd className="mt-1 text-sm font-medium">{CHAIN}</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
              <LinkButton href="/vault" variant="ghost" size="lg">
                See all {TOTAL_SUPPLY}
              </LinkButton>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink/45">
              Minting happens on {MINT_VENUE}, not here. This site never asks you
              to connect a wallet.
            </p>
          </div>
        </Reveal>
      </div>

      {/* prev / next through the revealed set */}
      <nav
        aria-label="More squibs"
        className="mt-16 grid gap-3 border-t border-hairline pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            href={`/squib/${pad(prev.id)}`}
            className="group flex items-center gap-4 rounded-card border border-hairline bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <SquibPhoto
              squib={prev}
              sizes="72px"
              className="h-16 w-16 shrink-0 scale-[1.3] rounded-squib object-cover"
            />
            <span className="min-w-0">
              <span className="block text-xs text-ink/45">Previous</span>
              <span className="block truncate font-display text-lg font-semibold tracking-tight">
                {prev.name}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            href={`/squib/${pad(next.id)}`}
            className="group flex items-center gap-4 rounded-card border border-hairline bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row-reverse sm:text-right"
          >
            <SquibPhoto
              squib={next}
              sizes="72px"
              className="h-16 w-16 shrink-0 scale-[1.3] rounded-squib object-cover"
            />
            <span className="min-w-0">
              <span className="block text-xs text-ink/45">Next</span>
              <span className="block truncate font-display text-lg font-semibold tracking-tight">
                {next.name}
              </span>
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
