import { LinkButton } from "@/components/ui/Button";
import SquibHead from "@/components/art/SquibHead";
import { TOTAL_SUPPLY } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
      <SquibHead size={200} className="h-28 w-28 animate-bob" />
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tightest sm:text-5xl">
        Nothing here.
      </h1>
      <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-ink/65">
        Either this squib has not been shown yet, or the link is wrong. Only a few
        of the {TOTAL_SUPPLY} have pages so far.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/allowlist" size="lg">
          Join allowlist
        </LinkButton>
        <LinkButton href="/" variant="ghost" size="lg">
          Back home
        </LinkButton>
      </div>
    </div>
  );
}
