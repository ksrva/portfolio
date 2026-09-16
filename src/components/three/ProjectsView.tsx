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
/* Newest first, split into current work and everything before it. Each card
   carries its own year, so the old run-grouping is gone: it printed a year
   once and blanked the repeats beneath it, which only reads as a ledger in a
   single column. In a grid there are no runs.

   The split is a flag in content.ts rather than a year threshold, so moving
   something into the older set is a decision rather than arithmetic. */
const BY_YEAR = (a: Project, b: Project) => Number(b.year) - Number(a.year);
const ENTRIES: readonly Project[] = [...projects].filter((p) => !p.older).sort(BY_YEAR);
const OLDER: readonly Project[] = [...projects].filter((p) => p.older).sort(BY_YEAR);

/* The same three weights the experience ledger uses, so the two rooms print
   their contents in one voice. */
const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

/* Same panel as the experience ledger and the street's cards. Nothing renders
   it yet — the projects list is empty — but the two rooms are meant to read as
   one place, so the first entry added here shouldn't arrive in the old style. */
const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";
const PANEL = `${BEVEL}, 0 18px 40px rgba(0,0,0,0.5)`;

/** GitHub's mark, drawn in the page's own colour rather than its brand black
    so it sits with the paper type instead of punching a hole in the panel. */
function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

function Entry({ project, i }: { project: Project; i: number }) {
  const link = project.href ?? project.repo;

  return (
    <motion.article
      className="flex flex-col border-2 border-black bg-[#17120e]/95 px-5 py-5"
      style={{ boxShadow: PANEL }}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* The screenshot, inset in its own hard-edged frame so it reads as a
          plate on the card rather than a floating image. Only drawn when a
          project has one — the layout is the same either way. */}
      {project.image && (
        <div className="mb-4 border-2 border-black bg-[#0d0a07]" style={{ boxShadow: BEVEL }}>
          {/* height comes from the image's own proportions rather than a
              fixed ratio on the card: the screenshots aren't all the same
              shape, and a hardcoded aspect quietly crops whichever one
              doesn't match it */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/projects/${project.image}`}
            alt={`${project.title} screenshot`}
            className="block h-auto w-full"
          />
        </div>
      )}

      <h3 className={`font-masthead text-[1.1rem] leading-[1.3] tracking-[-0.02em] ${NAME}`}>
        {project.title}
      </h3>

      <p className={`mt-3 text-[0.9rem] leading-[1.6] ${BODY}`}>{project.blurb}</p>

      {/* The masthead face has one weight only, so emphasis here is the body
          font at a heavier weight plus the brighter paper colour — which
          carries further than weight alone against this ground. */}
      {project.award && (
        <p className={`mt-2 text-[0.9rem] font-semibold leading-[1.6] ${NAME}`}>
          {project.award}
        </p>
      )}

      {/* the stack set as a quiet line rather than a row of chips — the
          chips were most of what made the old cards look generated */}
      <p className={`mt-3 text-[0.8rem] ${META}`}>{project.stack.join(" · ")}</p>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          /* the label is invisible but read aloud — an unlabelled icon link
             is announced as just its URL by a screen reader */
          aria-label={
            project.repo && !project.href
              ? `${project.title} on GitHub`
              : `Visit ${project.title}`
          }
          className={`mt-4 inline-flex h-10 items-center justify-center gap-2 self-start border-2 border-black bg-paper/[0.07] px-3 font-masthead text-[0.85rem] leading-none transition-colors duration-200 hover:bg-glow-500/20 focus-visible:bg-glow-500/20 ${NAME}`}
          style={{ boxShadow: BEVEL }}
        >
          {project.repo && !project.href ? (
            <GitHubMark />
          ) : (
            <>
              Visit
              <span aria-hidden className="text-glow-400">
                ↗
              </span>
            </>
          )}
        </a>
      )}
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
            {ENTRIES.length > 0 ? (
              ENTRIES.map((project, i) => (
                <Entry key={project.title} project={project} i={i} />
              ))
            ) : (
              /* Nothing current to show, so say it in the same panel the
                 street uses past the gallery rather than leave the room
                 blank. Restores itself the moment content.ts has an entry
                 that isn't flagged older. */
              <div
                className="inline-flex items-center gap-2.5 border-2 border-black bg-[#17120e]/95 px-4 py-2.5 font-masthead text-[0.95rem] leading-none text-paper"
                style={{
                  boxShadow:
                    "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.5)",
                }}
              >
                <span aria-hidden className="text-glow-400">
                  ⚠
                </span>
                Still under construction
              </div>
            )}
          </motion.div>

          {/* Older work, set apart rather than mixed in with current projects.
              The whole block disappears if nothing is flagged older. */}
          {OLDER.length > 0 && (
            <motion.div
              className={`mt-16 ${phase === "cards" ? "pointer-events-auto" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "cards" ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <p className={`font-mono text-[0.62rem] uppercase tracking-[0.28em] ${META}`}>
                Older projects
              </p>
              <div
                aria-hidden
                className="mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]"
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {OLDER.map((project, i) => (
                  <Entry key={project.title} project={project} i={i} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
