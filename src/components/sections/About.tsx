"use client";

import { about } from "@/lib/content";
import { Reveal, RugBand, Section, SectionHead } from "../ui";

export function About() {
  return (
    <Section id="about">
      <SectionHead index="04 — About" title={about.heading} />

      <div className="grid gap-14 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        <div>
          {about.body.map((para, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <p
                className={`text-[1rem] leading-[1.85] text-paper/60 sm:text-[1.06rem] ${
                  i === 0
                    ? "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[3.9rem] first-letter:leading-[0.82] first-letter:text-glow-500/85"
                    : "mt-6"
                }`}
              >
                {para}
              </p>
            </Reveal>
          ))}
        </div>

        {/* the little table by the window */}
        <Reveal delay={0.12}>
          <div className="relative overflow-hidden border border-brass-500/20 bg-night-900/50">
            <RugBand height={22} />
            <div className="px-7 py-8">
              <p className="eyebrow mb-6">On the table</p>
              <dl className="space-y-5">
                {about.currently.map((row) => (
                  <div key={row.label}>
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-glow-500/60">
                      {row.label}
                    </dt>
                    <dd className="mt-1.5 text-[0.94rem] leading-relaxed text-paper/65">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* a mug, still warm */}
              <div className="mt-8 flex items-end gap-3 text-paper/25">
                <svg width="42" height="40" viewBox="0 0 42 40" aria-hidden="true" fill="none">
                  <g className="anim-steam" style={{ ["--dur" as string]: "5s" }}>
                    <ellipse cx="14" cy="9" rx="1.7" ry="4.5" fill="var(--color-glow-500)" opacity="0.5" />
                    <ellipse cx="21" cy="7" rx="1.7" ry="5" fill="var(--color-glow-500)" opacity="0.35" />
                  </g>
                  <path d="M6 18 h24 v10 a8 8 0 0 1 -8 8 h-8 a8 8 0 0 1 -8 -8 Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M30 21 q8 4 0 10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 22 h24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                </svg>
                <span className="pb-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]">
                  Still hot
                </span>
              </div>
            </div>
            <RugBand height={22} flip />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
