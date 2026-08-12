"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { LOGO } from "@/lib/constants";

type Splat = { id: number; x: number; y: number; dx: number; dy: number; r: number };

let nextId = 0;

/**
 * Wraps a section and does two things inside it:
 *   1. swaps the pointer for a small squib head
 *   2. throws a handful of squibs out from wherever you click, which blur and
 *      fade as they scatter
 *
 * Only on real pointers. Touch devices keep their normal behaviour, and the
 * whole thing turns itself off under prefers-reduced-motion, since a cursor
 * that trails and bursts is exactly what that setting exists to stop.
 */
export default function SquibCursor({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [inside, setInside] = useState(false);
  const [splats, setSplats] = useState<Splat[]>([]);
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setActive(fine.matches && !calm.matches);
    decide();
    fine.addEventListener("change", decide);
    calm.addEventListener("change", decide);
    return () => {
      fine.removeEventListener("change", decide);
      calm.removeEventListener("change", decide);
    };
  }, []);

  /** Position is written straight to the node, never through state. */
  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      const { clientX, clientY } = e;
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        if (dot.current) {
          dot.current.style.transform = `translate3d(${clientX - 16}px, ${clientY - 16}px, 0)`;
        }
      });
    },
    [active],
  );

  const burst = useCallback(
    (e: React.MouseEvent) => {
      if (!active) return;
      const target = e.target as HTMLElement;
      if (!target.closest("a, button")) return;

      const x = e.clientX;
      const y = e.clientY;
      const made: Splat[] = Array.from({ length: 9 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * 130;
        return {
          id: nextId++,
          x,
          y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 40,
          r: 26 + Math.random() * 34,
        };
      });

      setSplats((s) => [...s, ...made]);
      const ids = new Set(made.map((m) => m.id));
      window.setTimeout(() => {
        setSplats((s) => s.filter((p) => !ids.has(p.id)));
      }, 750);
    },
    [active],
  );

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      className={`${className} ${active && inside ? "cursor-none" : ""}`}
      onMouseMove={onMove}
      onMouseEnter={() => setInside(true)}
      onMouseLeave={() => setInside(false)}
      onClick={burst}
    >
      {children}

      {active && inside ? (
        <div
          ref={dot}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[70] h-8 w-8 will-change-transform"
          style={{
            backgroundImage: `url(${LOGO.mark})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : null}

      {splats.map((p) => (
        <span
          key={p.id}
          aria-hidden
          className="squib-splat pointer-events-none fixed z-[69]"
          style={
            {
              left: p.x,
              top: p.y,
              width: p.r,
              height: p.r,
              marginLeft: -p.r / 2,
              marginTop: -p.r / 2,
              backgroundImage: `url(${LOGO.mark})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
