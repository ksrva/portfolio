"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { projects, type Project } from "@/lib/content";
import { Arrival } from "@/components/three/Arrival";
import { WorkshopClient } from "@/components/three/WorkshopClient";

const TITLE = "Projects";

/* Newest first, and stable within a year so the hand-ordering in content.ts
   still shows through. Sorting matters here: the ledger prints a year once
   per run, so an out-of-order entry would set the same year twice. */
const ENTRIES: { project: Project; year: string | null }[] = [...projects]
  .sort((a, b) => Number(b.year) - Number(a.year))
  .map((project, i, all) => ({
    project,
    year: i === 0 || all[i - 1].year !== project.year ? project.year : null,
  }));

/* The same three weights the experience ledger uses, so the two rooms print
   their contents in one voice. */
const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

function Entry({ project, year, i }: { project: Project; year: string | null; i: number }) {
  const link = project.href ?? project.repo;

  return (
    <motion.article
      className="grid grid-cols-[1fr_auto] gap-x-5 border-t border-paper/10 py-8 sm:grid-cols-[4.5rem_1fr_auto] sm:gap-x-8"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* the margin year, from sm up. `hidden` drops it out of the grid
          entirely on mobile, so the row falls back to content + kind */}
      <p className={`hidden text-[0.82rem] tabular-nums sm:block ${META}`}>{year}</p>

      <div>
        {year && <p className={`mb-2 text-[0.78rem] tabular-nums sm:hidden ${META}`}>{year}</p>}

        <h3 className={`font-masthead text-[1.18rem] leading-[1.3] tracking-[-0.02em] ${NAME}`}>{project.title}</h3>

        <p className={`mt-4 max-w-[54ch] text-[0.95rem] leading-[1.65] ${BODY}`}>{project.blurb}</p>

        {/* the stack set as a quiet line rather than a row of chips — the
            chips were most of what made the old cards look generated */}
        <p className={`mt-3 text-[0.8rem] ${META}`}>{project.stack.join(" · ")}</p>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer noopener"
            className={`mt-3 inline-block text-[0.82rem] underline decoration-paper/25 underline-offset-[5px] transition-colors duration-300 hover:text-paper ${META}`}
          >
            {project.repo && !project.href ? "Source" : "Visit"} ↗
          </a>
        )}
      </div>

      <p className={`text-right text-[0.82rem] ${META}`}>{project.kind}</p>
    </motion.article>
  );
}

/* The workshop arrives dark, with the task lamp faintly alight. Clicking it
   wakes the room; then the title writes itself; then the ledger unrolls.
   Same shape as the bookshop, so the two read as one street. */
export function ProjectsView() {
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
    <main className="relative min-h-[100svh] bg-[#0b0805]">
      <Arrival />

      <div className="fixed inset-0 z-0">
        <WorkshopClient prompt={ready && phase === "waiting"} onPrompt={wake} lit={lit} />
      </div>

      {/* The reading shade — same shaft as the bookshop, pitched to this
          room's slightly cooler black. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(to right, rgba(13,9,5,0) 0%, rgba(13,9,5,0.56) 16%, rgba(13,9,5,0.66) 50%, rgba(13,9,5,0.56) 84%, rgba(13,9,5,0) 100%)",
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
            {ENTRIES.map(({ project, year }, i) => (
              <Entry key={project.title} project={project} year={year} i={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
