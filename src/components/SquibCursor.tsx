"use client";

import { useEffect, useRef, useState } from "react";

import { LOGO } from "@/lib/constants";

type Splat = { id: number; x: number; y: number; dx: number; dy: number; r: number };

let nextId = 0;

/** Fields keep their own cursor, otherwise you lose the text caret. */
const FIELD = "input, textarea, select, [contenteditable='true']";

/**
 * Squibs everywhere.
 *
 * Rendered once in the root layout. It listens on `document` rather than
 * wrapping the tree, so it adds no element to the layout and cannot disturb the
 * page's flex column.
 *
 * Two behaviours, deliberately decoupled:
 *
 *   · the pointer becomes a small squib head. Desktop only, because a phone has
 *     no cursor to replace.
 *   · any click or tap throws a handful of squibs out from that point, which
 *     scatter, blur and vanish. Runs on every device.
 *
 * Both stop under prefers-reduced-motion, and hiding the system cursor is a
 * real cost for anyone who relies on it, so that escape hatch is not optional.
 */
export default function SquibCursor() {
  /** Custom pointer: needs a fine pointer and motion allowed. */
  const [cursorOn, setCursorOn] = useState(false);
  /** Click burst: any device, motion allowed. */
  const [burstOn, setBurstOn] = useState(false);
  const [visible, setVisible] = useState(false);
  const [splats, setSplats] = useState<Splat[]>([]);
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      setBurstOn(!calm.matches);
      setCursorOn(fine.matches && !calm.matches);
    };
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
    if (cursorOn) root.classList.add("squib-cursor-on");
    else root.classList.remove("squib-cursor-on");
    return () => root.classList.remove("squib-cursor-on");
  }, [cursorOn]);

  // ── the pointer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cursorOn) return;

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

    const onLeave = () => setVisible(false);

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [cursorOn]);

  // ── the burst ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!burstOn) return;

    /**
     * `click` rather than `pointerdown` on purpose. A tap that turns into a
     * scroll fires pointerdown but never fires click, so this way flicking
     * down a page on a phone does not spray squibs the whole way.
     */
    function onClick(e: MouseEvent) {
      // Touch taps report 0,0 on some browsers; fall back to the element.
      let { clientX: x, clientY: y } = e;
      if (!x && !y) {
        const r = (e.target as HTMLElement | null)?.getBoundingClientRect?.();
        if (!r) return;
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }

      // Fewer and smaller on a phone: same gesture, less to paint.
      const small = window.innerWidth < 640;
      const count = small ? 6 : 9;
      const reach = small ? 90 : 130;
      const size = small ? 22 : 26;

      const made: Splat[] = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = reach * 0.55 + Math.random() * reach;
        return {
          id: nextId++,
          x,
          y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 40,
          r: size + Math.random() * (small ? 22 : 34),
        };
      });

      setSplats((s) => [...s, ...made]);
      const ids = new Set(made.map((m) => m.id));
      window.setTimeout(() => setSplats((s) => s.filter((p) => !ids.has(p.id))), 750);
    }

    // Capture phase, so it still fires on anything that stops propagation and
    // lands before a navigation starts.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [burstOn]);

  if (!burstOn && !cursorOn) return null;

  return (
    <>
      {cursorOn ? (
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
      ) : null}

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
