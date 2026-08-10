"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NAV_LINKS } from "@/lib/constants";
import { LinkButton } from "./ui/Button";
import Wordmark from "./Wordmark";

export default function TopNav() {
  const [lifted, setLifted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        lifted
          ? "border-b border-hairline bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link href="/" className="rounded-full" aria-label="Squib Society, home">
          <Wordmark compact />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="mr-1 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      active
                        ? "bg-ink/[0.06] font-medium text-ink"
                        : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
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

      {/* Mobile: the nav links move to a scrollable rail rather than a burger —
          four destinations don't earn a menu that hides them. */}
      <div className="border-t border-hairline/60 md:hidden">
        <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-3 py-2">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-full px-3 py-1.5 text-[13px] transition ${
                    active ? "bg-ink text-cream" : "text-ink/60"
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
