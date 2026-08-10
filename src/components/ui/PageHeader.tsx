import type { ReactNode } from "react";

import Reveal from "./Reveal";

/**
 * The top of every page except home. One shape, one rhythm — the eyebrow in
 * mono, a large display headline, and one paragraph. Nothing else competes.
 */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  align = "left",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div className="border-b border-hairline">
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
        <Reveal>
          <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-squib-deep">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.98] tracking-tightest text-balance sm:text-6xl">
              {title}
            </h1>
            {intro ? (
              <p
                className={`mt-5 text-[17px] leading-relaxed text-ink/65 text-pretty ${
                  centered ? "mx-auto max-w-xl" : "max-w-xl"
                }`}
              >
                {intro}
              </p>
            ) : null}
            {children ? <div className="mt-7">{children}</div> : null}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
