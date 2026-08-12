import { MINT_VENUE, OPENSEA_URL, X_HANDLE, X_URL } from "@/lib/constants";
import { XLogo } from "./funnel/icons";
import Wordmark from "./Wordmark";

/** One line. Logo, X, OpenSea. Nothing else earns the space. */
export default function Footer() {
  return (
    <footer className="border-t-2 border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Wordmark compact />

        <div className="flex items-center gap-2">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 border-2 border-hairline bg-surface px-3 font-display text-xs font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
          >
            <XLogo className="h-3 w-3" />
            {X_HANDLE}
          </a>
          <a
            href={OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center border-2 border-hairline bg-surface px-3 font-display text-xs font-semibold uppercase tracking-wide shadow-card transition hover:bg-ink hover:text-cream"
          >
            {MINT_VENUE}
          </a>
        </div>
      </div>
    </footer>
  );
}
