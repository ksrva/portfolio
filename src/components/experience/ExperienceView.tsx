"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { work } from "@/lib/content";
import { Arrival } from "@/components/three/Arrival";
import { RoomClient } from "@/components/three/RoomClient";

const TITLE = "Experience";

/* The room arrives dark, with one lamp faintly alight. Clicking it wakes the
   room; then the title writes itself; then the panels arrive in turn. Same
   shape as the street, so the two read as one place. */
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

      {/* pointer-events-none, or this column swallows the click meant for the
          lamp behind it — the cards occupy layout even while invisible.
          Interactive children opt back in individually. */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-10 sm:px-10">
        <AnimatePresence>
          {lit && (
            <motion.div className="pointer-events-auto inline-block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
              <Link
                href="/prototype"
                className="group inline-flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/55 transition-colors duration-300 hover:text-glow-400"
              >
                <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
                  <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
                    <path d="M22 5 H2 M7 1 L2 5 L7 9" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </span>
                Back to the street
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto mt-[14vh] max-w-5xl">
          {/* min-height reserves the line, so the grid doesn't jump when the
              title starts typing */}
          <h1 className="min-h-[1.1em] font-masthead text-[clamp(2.4rem,7vw,4.4rem)] leading-[1] text-paper drop-shadow-[0_2px_24px_rgba(20,11,6,0.9)]">
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

          <ul className={`mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${phase === "cards" ? "pointer-events-auto" : ""}`}>
            {work.map((job, i) => (
              <motion.li
                key={job.org + job.period}
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={
                  phase === "cards"
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 22, scale: 0.97 }
                }
                transition={{ duration: 0.55, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col rounded-sm border border-brass-500/25 bg-[#180e07]/85 px-6 py-6 backdrop-blur-md transition-colors duration-500 hover:border-glow-500/50"
              >
                <h2 className="font-masthead text-[1.35rem] leading-tight text-paper">{job.org}</h2>
                <p className="mt-1.5 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-glow-500/80">
                  {job.role} · {job.period}
                </p>
                <p className="mt-4 flex-1 text-[0.9rem] leading-[1.7] text-paper/70">{job.blurb}</p>
                {job.stack && (
                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {job.stack.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-brass-500/25 px-2.5 py-0.5 font-mono text-[0.56rem] tracking-[0.08em] text-paper/55"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                {job.location && (
                  <p className="mt-5 font-mono text-[0.58rem] tracking-[0.1em] text-paper/35">
                    {job.location}
                  </p>
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
