"use client";

import { motion, useReducedMotion } from "framer-motion";

import SquibHead from "./SquibHead";

/**
 * The one ambient moment on the page: a squib head pops up from behind an
 * edge, has a look, ducks back. Long cycle on purpose — a mascot that is always
 * moving reads as filler. Off entirely under reduced motion.
 */
export default function PeekingSquib({
  className = "",
  period = 16,
  delay = 5,
}: {
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
      initial={{ y: "82%" }}
      animate={{ y: ["82%", "82%", "6%", "6%", "82%"] }}
      transition={{
        duration: period,
        times: [0, 0.04, 0.14, 0.32, 0.42],
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      <SquibHead size={220} className="h-full w-full object-contain" />
    </motion.div>
  );
}
