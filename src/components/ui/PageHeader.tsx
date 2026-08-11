import type { ReactNode } from "react";

import Reveal from "./Reveal";

/**
 * The masthead of every page except home. A stamped eyebrow sitting in a ruled
 * box, a heavy slab headline, one paragraph, and a double rule closing it off.
 * Same shape every time — the rhythm is the design.
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
    <div className="border-b-2 border-hairline bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <Reveal>
          <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
            <p className="stamp inline-block border-2 border-hairline bg-squib px-2.5 py-1 text-ink">
              {eyebrow}
            </p>

            {/* Not uppercase: these run long, and all-caps at this size is
                slower to read for everyone. The weight and the rules carry it. */}
            <h1 className="mt-5 font-display text-4xl font-bold leading-[0.94] tracking-tightest text-balance sm:text-[3.75rem]">
              {title}
            </h1>

            {intro ? (
              <p
                className={`mt-5 border-l-4 border-hairline pl-4 text-[16px] leading-relaxed text-ink/70 text-pretty ${
                  centered ? "mx-auto max-w-xl border-l-0 pl-0" : "max-w-xl"
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
