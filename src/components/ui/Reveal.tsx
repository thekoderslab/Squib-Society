"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const TAGS = {
  div: motion.div,
  li: motion.li,
  section: motion.section,
} as const;

/**
 * Sections fade + rise once as they enter. Motion is off entirely under
 * prefers-reduced-motion — no fallback fade, no delay, just static content.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof TAGS;
}) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];

  if (reduce) {
    if (as === "li") return <li className={className}>{children}</li>;
    if (as === "section") return <section className={className}>{children}</section>;
    return <div className={className}>{children}</div>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
