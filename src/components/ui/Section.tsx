import type { ReactNode } from "react";

import Reveal from "./Reveal";

export default function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
  headerClassName = "",
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal>
          <header className={`max-w-2xl ${headerClassName}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-squib-deep">
              {eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.06] tracking-tightest text-balance sm:text-5xl">
              {title}
            </h2>
            {intro ? (
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/65 text-pretty sm:text-base">
                {intro}
              </p>
            ) : null}
          </header>
        </Reveal>
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}
