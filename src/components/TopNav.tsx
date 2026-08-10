"use client";

import { useEffect, useState } from "react";

import { NAV_LINKS } from "@/lib/constants";
import { LinkButton } from "./ui/Button";
import Wordmark from "./Wordmark";

export default function TopNav() {
  const [lifted, setLifted] = useState(false);

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
        <a href="#top" className="rounded-full" aria-label="Squib Society, back to top">
          <Wordmark compact />
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="mr-1 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3 py-2 text-sm text-ink/65 transition hover:bg-ink/[0.05] hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <LinkButton href="#allowlist" size="sm">
            Join allowlist
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
