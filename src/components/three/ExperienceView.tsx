"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { work, type Job } from "@/lib/content";
import { Arrival } from "@/components/three/Arrival";
import { RoomClient } from "@/components/three/RoomClient";

const TITLE = "Experience";

/* Co-op roles only — volunteer entries belong to a different list. The year
   prints once per run of entries that share it and is blank on the rest, so
   the margin reads as a ledger instead of repeating itself. */
const ENTRIES: { job: Job; year: string | null }[] = work
  .filter((job) => job.kind !== "volunteer")
  .map((job, i, all) => ({
    job,
    year: i === 0 || all[i - 1].year !== job.year ? job.year : null,
  }));

/* Three text weights, and only three: the name, the sentence, and everything
   that is neither. A finer ramp than this stops reading as hierarchy. */
const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

function Entry({ job, year, i }: { job: Job; year: string | null; i: number }) {
  return (
    <motion.article
      className="grid grid-cols-[1fr_auto] gap-x-5 border-t border-paper/10 py-8 sm:grid-cols-[4.5rem_1fr_auto] sm:gap-x-8"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* the margin year, from sm up. `hidden` drops it out of the grid
          entirely on mobile, so the row falls back to content + dates */}
      <p className={`hidden text-[0.82rem] tabular-nums sm:block ${META}`}>{year}</p>

      <div>
        {year && <p className={`mb-2 text-[0.78rem] tabular-nums sm:hidden ${META}`}>{year}</p>}

        <h3 className={`font-masthead text-[1.18rem] leading-[1.3] tracking-[-0.02em] ${NAME}`}>{job.org}</h3>

        <p className={`mt-1 text-[0.82rem] leading-snug ${META}`}>
          {job.role}
          {job.city && `, ${job.city}`}
        </p>

        <p className={`mt-4 max-w-[54ch] text-[0.95rem] leading-[1.65] ${BODY}`}>{job.highlight}</p>
      </div>

      <p className={`text-right text-[0.82rem] tabular-nums ${META}`}>{job.span}</p>
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
              <Link
                href="/"
                className={`text-[0.88rem] underline decoration-paper/25 underline-offset-[5px] transition-colors duration-300 hover:text-paper ${META}`}
              >
                Back to the street
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mx-auto mt-[14vh] max-w-3xl">
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
            className={`mt-14 ${phase === "cards" ? "pointer-events-auto" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "cards" ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            {ENTRIES.map(({ job, year }, i) => (
              <Entry key={job.org + job.period} job={job} year={year} i={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
