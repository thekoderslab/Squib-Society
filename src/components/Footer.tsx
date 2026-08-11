import Link from "next/link";

import {
  CHAIN,
  COLLECTION_NAME,
  MINT_VENUE,
  NAV_LINKS,
  OPENSEA_URL,
  TOTAL_SUPPLY,
  X_HANDLE,
  X_URL,
} from "@/lib/constants";
import { XLogo } from "./funnel/icons";
import Wordmark from "./Wordmark";

const PAGES = [...NAV_LINKS, { label: "FAQ", href: "/faq" }];

export default function Footer() {
  return (
    <footer className="border-t-2 border-hairline">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/50">
            {TOTAL_SUPPLY} designer-toy squibs. Minting on {MINT_VENUE}, on {CHAIN}.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
            Pages
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PAGES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="text-sm text-ink/60 transition hover:text-ink"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
            Elsewhere
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
              >
                <XLogo className="h-3 w-3" />
                {X_HANDLE}
              </a>
            </li>
            <li>
              <a
                href={OPENSEA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink/60 transition hover:text-ink"
              >
                {MINT_VENUE}
              </a>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 text-sm text-ink/60">
                <span className="h-1.5 w-1.5 rounded-none bg-squib" aria-hidden />
                {CHAIN}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-hairline">
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
