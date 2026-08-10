import {
  CHAIN,
  COLLECTION_NAME,
  MINT_VENUE,
  OPENSEA_URL,
  TOTAL_SUPPLY,
  X_HANDLE,
  X_URL,
} from "@/lib/constants";
import { XLogo } from "./funnel/icons";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center md:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/50">
            {TOTAL_SUPPLY} designer-toy squibs. Minting on {MINT_VENUE}, on {CHAIN}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm shadow-card transition hover:border-ink/30"
          >
            <XLogo className="h-3.5 w-3.5" />
            {X_HANDLE}
          </a>
          <a
            href={OPENSEA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full border border-hairline bg-surface px-4 text-sm shadow-card transition hover:border-ink/30"
          >
            {MINT_VENUE}
          </a>
          <span className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm text-ink/60 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-squib" aria-hidden />
            {CHAIN}
          </span>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {COLLECTION_NAME}. Working name, subject
            to change.
          </p>
          <p>
            We will never DM you first, and we will never ask you to connect a
            wallet on this site.
          </p>
        </div>
      </div>
    </footer>
  );
}
