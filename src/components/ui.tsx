"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

/* ── A woven border band, used to separate sections ───────────────── */

export function RugBand({
  className = "",
  height = 26,
  flip = false,
}: {
  className?: string;
  height?: number;
  flip?: boolean;
}) {
  const id = flip ? "rugband-b" : "rugband-a";
  return (
    <svg
      className={`w-full ${className}`}
      height={height}
      viewBox={`0 0 480 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <defs>
        <pattern id={id} width="40" height={height} patternUnits="userSpaceOnUse">
          <rect width="40" height={height} fill="none" />
          <path
            d={`M 20 3 L 30 ${height / 2} L 20 ${height - 3} L 10 ${height / 2} Z`}
            fill="none"
            stroke="var(--color-rug-cream)"
            strokeWidth="1.4"
            opacity="0.55"
          />
          <path
            d={`M 20 ${height / 2 - 4} L 24 ${height / 2} L 20 ${height / 2 + 4} L 16 ${height / 2} Z`}
            fill="var(--color-glow-500)"
            opacity="0.55"
          />
          <path
            d={`M 0 ${height / 2} L 10 ${height / 2}`}
            stroke="var(--color-rug-rose)"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <path
            d={`M 30 ${height / 2} L 40 ${height / 2}`}
            stroke="var(--color-rug-rose)"
            strokeWidth="1.2"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="480" height="1" y="0" fill="var(--color-brass-500)" opacity="0.22" />
      <rect width="480" height={height} fill={`url(#${id})`} />
      <rect width="480" height="1" y={height - 1} fill="var(--color-brass-500)" opacity="0.22" />
    </svg>
  );
}

/* ── Fade + rise on entry ─────────────────────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/* ── Section shell: number, title, and a glowing rule ─────────────── */

export function SectionHead({
  index,
  title,
  lead,
}: {
  index: string;
  title: string;
  lead?: string;
}) {
  return (
    <Reveal className="mb-14 max-w-2xl">
      <div className="mb-5 flex items-center gap-4">
        <span className="eyebrow">{index}</span>
        <span className="rule-glow h-px flex-1" />
      </div>
      <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-paper sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-5 text-base leading-relaxed text-paper/55 sm:text-lg">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 md:py-32 ${className}`}
    >
      {children}
    </section>
  );
}
