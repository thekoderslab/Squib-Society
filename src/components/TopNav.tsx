"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_LINKS } from "@/lib/constants";
import { LinkButton } from "./ui/Button";
import Wordmark from "./Wordmark";

/**
 * Solid, ruled, immovable. No blur, no translucency, no shrink-on-scroll —
 * a printed masthead sitting on the page.
 */
export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-hairline bg-cream">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link href="/" aria-label="Squib Society, home">
          <Wordmark compact />
        </Link>

        <div className="flex items-center gap-2">
          <ul className="mr-2 hidden items-stretch md:flex">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`block border-2 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors ${
                      active
                        ? "border-hairline bg-ink text-cream"
                        : "border-transparent text-ink/70 hover:border-hairline hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <LinkButton href="/allowlist" size="sm">
            Join allowlist
          </LinkButton>
        </div>
      </nav>

      {/* Mobile: a ruled rail rather than a burger — four destinations don't
          earn a menu that hides them. */}
      <div className="border-t-2 border-hairline md:hidden">
        <ul className="mx-auto flex w-full max-w-6xl divide-x-2 divide-hairline">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href} className="flex-1">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-2 py-2 text-center font-display text-[11px] font-semibold uppercase tracking-wide ${
                    active ? "bg-ink text-cream" : "text-ink/70"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
