"use client";

import { projects, type Project } from "@/lib/content";
import { Reveal, Section, SectionHead } from "../ui";

/* Each window gets a different silhouette sitting on its inside ledge —
   the sort of thing you notice on the second visit. */
const SILHOUETTES = [
  // a potted monstera
  <g key="plant" fill="currentColor">
    <path d="M14 40 h16 l-2.5 14 h-11 Z" />
    <path d="M22 40 C22 28 15 24 9 22 C13 30 15 36 21 40 Z" />
    <path d="M22 40 C22 26 28 20 35 17 C32 27 30 35 23 40 Z" />
    <path d="M22 40 C20 32 22 24 26 18 C28 27 27 34 23 40 Z" />
  </g>,
  // a cat, curled
  <g key="cat" fill="currentColor">
    <ellipse cx="24" cy="46" rx="18" ry="8" />
    <circle cx="12" cy="40" r="7" />
    <path d="M6 36 l-1 -7 l6 3 Z M18 36 l1 -7 l-6 3 Z" />
    <path d="M40 46 q6 -4 2 -10 q-3 5 -7 4 Z" />
  </g>,
  // a desk lamp
  <g key="lamp" fill="currentColor">
    <rect x="8" y="50" width="22" height="4" rx="2" />
    <path d="M18 50 L20 26 h3 l-2 24 Z" />
    <path d="M18 26 l16 -6 l6 12 l-16 4 Z" />
  </g>,
  // a stack of books and a mug
  <g key="books" fill="currentColor">
    <rect x="6" y="44" width="26" height="6" rx="1" />
    <rect x="9" y="37" width="22" height="6" rx="1" />
    <rect x="12" y="30" width="18" height="6" rx="1" />
    <path d="M38 38 h12 v10 a6 6 0 0 1 -6 6 h-0 a6 6 0 0 1 -6 -6 Z" />
    <path d="M50 41 q6 3 0 8" fill="none" stroke="currentColor" strokeWidth="2" />
  </g>,
];

const ARCH = {
  borderTopLeftRadius: "50% 84px",
  borderTopRightRadius: "50% 84px",
} as const;

function WindowCard({ p, i }: { p: Project; i: number }) {
  const href = p.href ?? p.repo;
  return (
    <Reveal delay={(i % 2) * 0.1} className="h-full">
      <article
        className="group relative flex h-full flex-col overflow-hidden border border-brass-500/18 bg-night-900/70 transition-colors duration-700 hover:border-glow-500/45"
        style={ARCH}
      >
        {/* ── the glass ─────────────────────────────────────────── */}
        <div className="relative h-44 overflow-hidden bg-night-800" style={ARCH}>
          {/* unlit room */}
          <div className="absolute inset-0 bg-gradient-to-b from-night-950 to-night-800" />
          {/* the light going on */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 100%, #ffd28f 0%, #e59b3d 38%, rgba(229,155,61,0.1) 78%, transparent 100%)",
            }}
          />
          {/* silhouette on the ledge */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-night-950/85 opacity-45 transition-opacity duration-700 group-hover:opacity-100">
            <svg width="72" height="60" viewBox="0 0 60 56" aria-hidden="true">
              {SILHOUETTES[i % SILHOUETTES.length]}
            </svg>
          </div>
          {/* mullions, drawn last so they read as being in front */}
          <div className="pointer-events-none absolute inset-0">
            <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-night-950/85" />
            <span className="absolute left-0 top-[58%] h-[2px] w-full bg-night-950/85" />
            <span className="absolute inset-0 border-[6px] border-night-950/70" style={ARCH} />
          </div>
          {/* glow spilling outward when lit */}
          <div className="pointer-events-none absolute -inset-6 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-60"
            style={{ background: "radial-gradient(50% 50% at 50% 60%, rgba(245,185,92,0.55), transparent 70%)" }}
          />
        </div>

        {/* ── the sill ──────────────────────────────────────────── */}
        <div className="h-[7px] w-full bg-wood-500/80 shadow-[0_2px_0_0_rgba(0,0,0,0.5)]" />

        {/* ── the plaque ────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col p-7">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-glow-500/70">
              {p.kind}
            </span>
            <span className="font-mono text-[0.62rem] tracking-[0.14em] text-paper/30">
              {p.year}
            </span>
          </div>

          <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-paper transition-colors duration-500 group-hover:text-glow-300">
            {href ? (
              <a href={href} target="_blank" rel="noreferrer" className="after:absolute after:inset-0">
                {p.title}
              </a>
            ) : (
              p.title
            )}
          </h3>

          <p className="mt-3 flex-1 text-[0.92rem] leading-[1.7] text-paper/52">
            {p.blurb}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <li
                key={s}
                className="rounded-full border border-paper/10 px-3 py-1 font-mono text-[0.62rem] tracking-[0.08em] text-paper/45 transition-colors duration-500 group-hover:border-glow-500/25 group-hover:text-paper/65"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Reveal>
  );
}

export function Projects() {
  return (
    <Section id="projects">
      <SectionHead
        index="02 — Projects"
        title="Lights on in a few windows"
        lead="Things I built because the problem wouldn't leave me alone. Hover to look inside."
      />
      <div className="grid gap-8 sm:grid-cols-2">
        {projects.map((p, i) => (
          <WindowCard key={p.title} p={p} i={i} />
        ))}
      </div>
    </Section>
  );
}
