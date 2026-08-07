"use client";

import { motion } from "motion/react";
import { HeroScene } from "./scene/HeroScene";
import { site } from "@/lib/content";

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay: 0.35 + i * 0.11, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      className="grain relative flex min-h-[100svh] w-full items-end overflow-hidden"
    >
      <HeroScene />

      {/* legibility wash behind the type, keyed to the left column */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(70% 62% at 22% 62%, rgba(4,18,26,0.82) 0%, rgba(4,18,26,0.45) 45%, rgba(4,18,26,0) 78%)",
        }}
      />

      <div className="relative z-20 mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10 md:pb-32">
        <div className="max-w-2xl">
          <motion.p
            custom={0}
            variants={rise}
            initial="hidden"
            animate="show"
            className="eyebrow mb-6 flex items-center gap-3"
          >
            <span className="inline-block h-px w-8 bg-glow-500/60" />
            {site.location}
          </motion.p>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="show"
            className="font-display text-[clamp(3.2rem,11vw,7.5rem)] font-light leading-[0.88] tracking-[-0.035em] text-paper"
          >
            {site.name}
          </motion.h1>

          <motion.p
            custom={2}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-glow-500/85"
          >
            {site.role}
          </motion.p>

          <motion.p
            custom={3}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-7 max-w-xl text-[0.98rem] leading-[1.75] text-paper/62 sm:text-[1.05rem]"
          >
            {site.heroLine}
          </motion.p>

          <motion.div
            custom={4}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#projects"
              className="group relative overflow-hidden rounded-full border border-brass-500/40 px-7 py-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/90 transition-colors duration-500 hover:border-glow-500/80 hover:text-glow-300"
            >
              <span className="relative z-10">See the work</span>
              <span className="absolute inset-0 -translate-y-full bg-glow-500/12 transition-transform duration-500 group-hover:translate-y-0" />
            </a>
            <a
              href="#contact"
              className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/45 underline-offset-8 transition-colors duration-300 hover:text-glow-400 hover:underline"
            >
              Say hello
            </a>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1.2 }}
        className="pointer-events-none absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.32em] text-paper/35">
          Scroll
        </span>
        <span className="relative block h-12 w-px bg-paper/12">
          <motion.span
            className="absolute left-0 top-0 block h-4 w-px bg-glow-500"
            animate={{ y: [0, 32, 32], opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
