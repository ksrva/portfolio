"use client";

import { motion } from "motion/react";

/** The far side of the swoop. Dark, not warm: the room it opens onto is
    unlit until you wake it. */
export function Arrival() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 bg-[#070906]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}
