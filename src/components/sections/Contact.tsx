"use client";

import { site } from "@/lib/content";
import { makeRng, round } from "@/lib/rand";
import { Reveal, RugBand } from "../ui";

/** A flat Persian field, laid under the footer like a rug under a room. */
function RugField() {
  const rng = makeRng(90210);
  const motifs = Array.from({ length: 120 }, () => ({
    x: round(rng.range(0, 1200)),
    y: round(rng.range(0, 620)),
    s: round(rng.range(0.55, 1.3)),
    r: round(rng.range(-14, 14)),
    c: rng.pick(["#e6d4ae", "#c9a227", "#c2564a", "#22282e"]),
  }));

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1200" height="620" fill="#5e1a18" />
      <rect x="26" y="26" width="1148" height="568" fill="#9b3028" />
      <rect x="26" y="26" width="1148" height="568" fill="none" stroke="#e6d4ae" strokeWidth="4" opacity="0.5" />
      <rect x="72" y="72" width="1056" height="476" fill="#7d2320" />
      <rect x="72" y="72" width="1056" height="476" fill="none" stroke="#c9a227" strokeWidth="2" opacity="0.45" />

      {/* central medallion, ghosted */}
      <g opacity="0.5" transform="translate(600 310)">
        <path d="M0 -190 L235 0 L0 190 L-235 0 Z" fill="#5e1a18" />
        <path d="M0 -150 L186 0 L0 150 L-186 0 Z" fill="#c2564a" opacity="0.7" />
        <path d="M0 -104 L128 0 L0 104 L-128 0 Z" fill="#e6d4ae" opacity="0.45" />
        <path d="M0 -58 L72 0 L0 58 L-72 0 Z" fill="#22282e" opacity="0.7" />
        <circle r="20" fill="#c9a227" opacity="0.8" />
      </g>

      {/* boteh scattered across the field */}
      {motifs.map((m, i) => (
        <g
          key={i}
          transform={`translate(${m.x} ${m.y}) rotate(${m.r}) scale(${m.s})`}
          opacity="0.4"
        >
          <path
            d="M 0 -16 C 12 -12, 14 4, 4 13 C -1 17, -9 15, -11 9 C -13 2, -6 -2, -3 2"
            fill="none"
            stroke={m.c}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

export function Contact() {
  return (
    <footer id="contact" className="grain relative overflow-hidden scroll-mt-24">
      <RugField />
      {/* the room is dim, so the rug is dim */}
      <div className="absolute inset-0 bg-night-950/86" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 12%, rgba(245,185,92,0.16), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-28 sm:px-10 md:pt-36">
        <Reveal>
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-glow-500/60" />
            05 — Contact
          </p>
          <h2 className="max-w-3xl font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-[0.95] tracking-[-0.03em] text-paper">
            The kettle&apos;s on.
          </h2>
          <p className="mt-6 max-w-lg text-[1rem] leading-[1.8] text-paper/55">
            Open to co-op roles, research collaborations, and long arguments about
            evaluation methodology. I answer everything.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <a
            href={`mailto:${site.email}`}
            className="group mt-12 inline-flex items-baseline gap-4 border-b border-brass-500/30 pb-3 transition-colors duration-500 hover:border-glow-500"
          >
            <span className="font-display text-[clamp(1.4rem,4vw,2.6rem)] tracking-[-0.02em] text-paper/90 transition-colors duration-500 group-hover:text-glow-300">
              {site.email}
            </span>
            <span className="translate-y-0 text-glow-500/50 transition-all duration-500 group-hover:translate-x-2 group-hover:text-glow-400">
              <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
                <path d="M0 6 H24 M19 1 L24 6 L19 11" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
          </a>
        </Reveal>

        <Reveal delay={0.18}>
          <ul className="mt-14 flex flex-wrap gap-x-10 gap-y-4">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target={s.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="group flex items-baseline gap-3"
                >
                  <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-glow-500/70">
                    {s.label}
                  </span>
                  <span className="text-[0.9rem] text-paper/45 underline-offset-4 transition-colors duration-300 group-hover:text-paper/85 group-hover:underline">
                    {s.handle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-20">
          <RugBand height={24} />
          <div className="mt-6 flex flex-col gap-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/25 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {site.fullName}
            </span>
            <span>Drawn by hand in SVG · no images were harmed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
