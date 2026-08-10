"use client";

import { motion, useReducedMotion } from "framer-motion";

import SquibArt from "./SquibArt";
import type { SquibVariant } from "@/lib/types";

/**
 * The one ambient moment on the page: a squib pops up from behind an edge,
 * looks around, ducks back. It runs on a long cycle on purpose — a mascot that
 * is always moving reads as filler. Off entirely under reduced motion.
 */
export default function PeekingSquib({
  variant = "explorer",
  className = "",
  /** Seconds of the cycle spent hidden vs. visible is tuned by this period. */
  period = 15,
  delay = 4,
}: {
  variant?: SquibVariant;
  className?: string;
  period?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
      initial={{ y: "78%" }}
      animate={{ y: ["78%", "78%", "4%", "4%", "78%"] }}
      transition={{
        duration: period,
        times: [0, 0.04, 0.14, 0.32, 0.42],
        repeat: Infinity,
        repeatDelay: 0,
        delay,
        ease: "easeInOut",
      }}
    >
      <SquibArt variant={variant} label="" className="h-full w-full drop-shadow-sm" />
    </motion.div>
  );
}
