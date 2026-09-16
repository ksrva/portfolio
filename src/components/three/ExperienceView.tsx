"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { work, type Job } from "@/lib/content";
import { Arrival } from "@/components/three/Arrival";
import { RoomClient } from "@/components/three/RoomClient";

const TITLE = "Experience";

/* Co-op roles only — volunteer entries belong to a different list.

   Each card now carries its own year, so the old run-grouping is gone: it
   printed a year once and blanked the repeats beneath it, which only reads
   as a ledger in a single column. In a grid there are no runs to group. */
const ENTRIES: readonly Job[] = work.filter((job) => job.kind !== "volunteer");

/* Three text weights, and only three: the name, the sentence, and everything
   that is neither. A finer ramp than this stops reading as hierarchy. */
const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

/* The same panel the street's cards and prompts are built from: light on the
   top-left edge, shadow on the bottom-right, a hard black line round the lot.
   The ledger used to be hairline rules on nothing, which read as a different
   piece of software to the room it sits in. */
const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";
const PANEL = `${BEVEL}, 0 18px 40px rgba(0,0,0,0.5)`;

function Entry({ job, i }: { job: Job; i: number }) {
  return (
    <motion.article
      className="flex flex-col border-2 border-black bg-[#17120e]/95 px-5 py-5"
      style={{ boxShadow: PANEL }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* year and months on one line, inside the box — the dates used to sit
          in a margin and at the far right, which a grid has nowhere to put */}
      <p className={`text-[0.78rem] tabular-nums ${META}`}>
        {job.year} · {job.span}
      </p>

      <h3 className={`mt-2 font-masthead text-[1.1rem] leading-[1.3] tracking-[-0.02em] ${NAME}`}>
        {job.org}
      </h3>

      <p className={`mt-1 text-[0.8rem] leading-snug ${META}`}>
        {job.role}
        {job.city && `, ${job.city}`}
      </p>

      <p className={`mt-3 text-[0.9rem] leading-[1.6] ${BODY}`}>{job.highlight}</p>
    </motion.article>
  );
}

/* The room arrives dark, with one lamp faintly alight. Clicking it wakes the
   room; then the title writes itself; then the ledger unrolls as you scroll.
   Same shape as the street, so the two read as one place. */
export function ExperienceView() {
  const [phase, setPhase] = useState<"waiting" | "lighting" | "typing" | "cards">("waiting");
  const [typed, setTyped] = useState(0);

  // the lamp only offers itself once the arrival wipe has cleared
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1100);
    return () => clearTimeout(id);
  }, []);

  const wake = () => {
    if (phase !== "waiting") return;
    setPhase("lighting");
    setTimeout(() => setPhase("typing"), 1200);
  };

  useEffect(() => {
    if (phase !== "typing") return;
    if (typed >= TITLE.length) {
      const id = setTimeout(() => setPhase("cards"), 450);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setTyped((n) => n + 1), 105);
    return () => clearTimeout(id);
  }, [phase, typed]);

  const lit = phase !== "waiting";

  return (
    <main className="relative min-h-[100svh] bg-[#070906]">
      <Arrival />

      <div className="fixed inset-0 z-0">
        <RoomClient prompt={ready && phase === "waiting"} onPrompt={wake} lit={lit} />
      </div>

      {/* The reading shade. Fixed and full-height, so it has no edges of its
          own to notice; it fades to nothing at both sides, leaving the room
          lit and legible past the text. Tinted to the room's warm black
          (16,10,6) — neutral black read as a smudge over the lamplight. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(to right, rgba(16,10,6,0) 0%, rgba(16,10,6,0.56) 16%, rgba(16,10,6,0.66) 50%, rgba(16,10,6,0.56) 84%, rgba(16,10,6,0) 100%)",
        }}
      />

      {/* pointer-events-none, or this column swallows the click meant for the
          lamp behind it. Interactive children opt back in individually. */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-10 sm:px-10">
        <AnimatePresence>
          {lit && (
            <motion.div className="pointer-events-auto inline-block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
              {/* same panel as the street's prompts, so every way out of
                  somewhere looks like the same control */}
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 border-2 border-black bg-[#17120e]/95 px-4 py-2.5 font-masthead text-[0.95rem] leading-none text-paper transition-colors duration-200 hover:bg-glow-500/20"
                style={{
                  boxShadow:
                    "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.5)",
                }}
              >
                <span aria-hidden className="text-glow-400">
                  ←
                </span>
                Back to the street
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* wider than the old single column: three boxes across needs the room */}
        <div className="relative mx-auto mt-[14vh] max-w-6xl">
          {/* min-height reserves the line, so nothing jumps when the title
              starts typing */}
          <h1 className="min-h-[1.1em] font-masthead text-[clamp(1.9rem,5vw,3.4rem)] leading-[1.05] tracking-[-0.03em] text-paper">
            {TITLE.slice(0, typed)}
            {phase === "typing" && typed < TITLE.length && (
              <span
                className="ml-[0.04em] inline-block w-[0.045em] animate-pulse bg-paper align-baseline"
                style={{ height: "0.78em" }}
              >
                &nbsp;
              </span>
            )}
          </h1>

          <motion.div
            className={`mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${phase === "cards" ? "pointer-events-auto" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "cards" ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            {ENTRIES.map((job, i) => (
              <Entry key={job.org + job.period} job={job} i={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
