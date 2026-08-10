"use client";

import { useEffect, useState } from "react";

import { SNAPSHOT_ISO } from "@/lib/constants";

const UNITS = [
  { key: "d", label: "days" },
  { key: "h", label: "hrs" },
  { key: "m", label: "min" },
  { key: "s", label: "sec" },
] as const;

function split(ms: number) {
  const clamped = Math.max(0, ms);
  return {
    d: Math.floor(clamped / 86_400_000),
    h: Math.floor(clamped / 3_600_000) % 24,
    m: Math.floor(clamped / 60_000) % 60,
    s: Math.floor(clamped / 1000) % 60,
  };
}

/** Rendered as em dashes on the server so the clock never hydrates mismatched. */
export default function Countdown() {
  const [left, setLeft] = useState<ReturnType<typeof split> | null>(null);

  useEffect(() => {
    const target = new Date(SNAPSHOT_ISO).getTime();
    const tick = () => setLeft(split(target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {UNITS.map((u) => (
        <div key={u.key} className="text-center">
          <div className="min-w-[3rem] rounded-squib border border-hairline bg-cream px-2.5 py-2 font-mono text-xl font-bold tabular sm:text-2xl">
            {left ? String(left[u.key]).padStart(2, "0") : "––"}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
