"use client";

import { useEffect, useRef, useState } from "react";

import { LOGO } from "@/lib/constants";

type Splat = { id: number; x: number; y: number; dx: number; dy: number; r: number };

let nextId = 0;

/** Fields keep their own cursor, otherwise you lose the text caret. */
const FIELD = "input, textarea, select, [contenteditable='true']";
/** What a click has to land on to throw squibs. */
const HITTABLE = "a, button, [role='button'], summary";

/**
 * Site-wide squib cursor.
 *
 * Rendered once in the root layout. It listens on `document` rather than
 * wrapping the tree, so it adds no element to the layout and cannot disturb the
 * page's flex column. Two behaviours:
 *
 *   1. the pointer becomes a small squib head
 *   2. clicking a link or button throws a handful of squibs out from the click,
 *      which scatter, blur and vanish
 *
 * Off entirely on touch devices and under prefers-reduced-motion. Hiding the
 * system cursor is a real cost for anyone who relies on it, so those two escape
 * hatches are not optional.
 */
export default function SquibCursor() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [splats, setSplats] = useState<Splat[]>([]);
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  // Decide once whether this pointer should get the treatment at all.
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

  // Hide the system cursor only while ours is actually running.
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add("squib-cursor-on");
    else root.classList.remove("squib-cursor-on");
    return () => root.classList.remove("squib-cursor-on");
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function onMove(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      // Over a text field, stand down and let the caret through.
      setVisible(!target?.closest?.(FIELD));

      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        if (dot.current) {
          dot.current.style.transform = `translate3d(${e.clientX - 16}px, ${
            e.clientY - 16
          }px, 0)`;
        }
      });
    }

    function onLeave() {
      setVisible(false);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.(HITTABLE)) return;

      const { clientX: x, clientY: y } = e;
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
      window.setTimeout(() => setSplats((s) => s.filter((p) => !ids.has(p.id))), 750);
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick, true);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        ref={dot}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-[200] h-8 w-8 will-change-transform ${
          visible ? "" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url(${LOGO.mark})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />

      {splats.map((p) => (
        <span
          key={p.id}
          aria-hidden
          className="squib-splat pointer-events-none fixed z-[199]"
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
    </>
  );
}
