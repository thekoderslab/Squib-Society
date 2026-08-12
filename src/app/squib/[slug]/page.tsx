import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SquibPhoto from "@/components/art/SquibPhoto";
import { LinkButton } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { CHAIN, COLLECTION_NAME, MINT_VENUE } from "@/lib/constants";
import { SQUIBS, getSquibBySlug } from "@/lib/mock-api";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SQUIBS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const squib = getSquibBySlug(slug);
  if (!squib) return { title: "Not found" };

  return {
    title: squib.name,
    description: squib.bio,
    openGraph: {
      title: `${squib.name}, ${squib.role.toLowerCase()} · ${COLLECTION_NAME}`,
      description: squib.bio,
      images: [{ url: squib.photo, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${squib.name}, ${squib.role.toLowerCase()}`,
      description: squib.bio,
      images: [squib.photo],
    },
  };
}

export default async function SquibPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const squib = getSquibBySlug(slug);
  if (!squib) notFound();

  const index = SQUIBS.findIndex((s) => s.slug === squib.slug);
  const prev = SQUIBS[index - 1];
  const next = SQUIBS[index + 1];

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink/55 transition hover:text-ink"
        >
          <span aria-hidden>←</span> Back
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-14">
        <Reveal>
          <div className="overflow-hidden border-2 border-hairline bg-surface shadow-lift">
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
            <p className="stamp text-squib-deep">{squib.role}</p>

            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.94] tracking-tightest sm:text-6xl">
              {squib.name}
            </h1>

            <p className="mt-6 max-w-md border-l-4 border-hairline pl-4 text-[17px] leading-relaxed text-ink/70 text-pretty">
              {squib.bio}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px border-2 border-hairline bg-hairline">
              <div className="bg-surface px-4 py-3.5">
                <dt className="stamp text-ink/50">Doing</dt>
                <dd className="mt-1.5 text-sm font-medium">{squib.role}</dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="stamp text-ink/50">Shot at</dt>
                <dd className="mt-1.5 text-sm font-medium">{squib.scene}</dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="stamp text-ink/50">Chain</dt>
                <dd className="mt-1.5 text-sm font-medium">{CHAIN}</dd>
              </div>
              <div className="bg-surface px-4 py-3.5">
                <dt className="stamp text-ink/50">Mint</dt>
                <dd className="mt-1.5 text-sm font-medium">{MINT_VENUE}</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/allowlist" size="lg">
                Join allowlist
              </LinkButton>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink/45">
              Minting happens on {MINT_VENUE}, not here. This site never asks you
              to connect a wallet.
            </p>
          </div>
        </Reveal>
      </div>

      <nav
        aria-label="More squibs"
        className="mt-16 grid gap-3 border-t-2 border-hairline pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            href={`/squib/${prev.slug}`}
            className="flex items-center gap-4 border-2 border-hairline bg-surface p-4 shadow-card transition hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift"
          >
            <SquibPhoto
              squib={prev}
              sizes="72px"
              className="h-16 w-16 shrink-0 scale-[1.3] object-cover"
            />
            <span className="min-w-0">
              <span className="stamp block text-ink/45">Before</span>
              <span className="mt-1 block truncate font-display text-lg font-bold">
                {prev.name}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link
            href={`/squib/${next.slug}`}
            className="flex items-center gap-4 border-2 border-hairline bg-surface p-4 shadow-card transition hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-lift sm:flex-row-reverse sm:text-right"
          >
            <SquibPhoto
              squib={next}
              sizes="72px"
              className="h-16 w-16 shrink-0 scale-[1.3] object-cover"
            />
            <span className="min-w-0">
              <span className="stamp block text-ink/45">After</span>
              <span className="mt-1 block truncate font-display text-lg font-bold">
                {next.name}
              </span>
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
