"use client";

import { work } from "@/lib/content";
import { Reveal, Section, SectionHead } from "../ui";

export function Work() {
  return (
    <Section id="work">
      <SectionHead
        index="01 — Experience"
        title="Where I've been putting the hours"
        lead="Short version: data infrastructure, evaluation, and the occasional front end when nobody's looking."
      />

      <ol className="relative">
        {/* the thread running down the left */}
        <span className="absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-glow-500/40 via-brass-500/15 to-transparent md:block" />

        {work.map((job, i) => (
          <Reveal as="li" key={job.org + job.period} delay={i * 0.06}>
            <div className="group relative grid gap-4 border-b border-paper/8 py-9 md:grid-cols-[10rem_1fr] md:gap-10 md:pl-10">
              {/* node on the thread */}
              <span className="absolute -left-[4px] top-[2.85rem] hidden h-[9px] w-[9px] rounded-full border border-glow-500/50 bg-night-950 transition-all duration-500 group-hover:bg-glow-500 group-hover:shadow-[0_0_14px_2px_rgba(245,185,92,0.5)] md:block" />

              <div className="pt-1">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-glow-500/70">
                  {job.period}
                </p>
                {job.location && (
                  <p className="mt-1.5 font-mono text-[0.62rem] tracking-[0.1em] text-paper/30">
                    {job.location}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-display text-2xl leading-tight tracking-[-0.015em] text-paper sm:text-[1.7rem]">
                  {job.role}
                </h3>
                <p className="mt-1 text-[0.95rem] text-paper/45">
                  <span className="text-glow-400/80">{job.org}</span>
                </p>
                <p className="mt-4 max-w-2xl text-[0.95rem] leading-[1.75] text-paper/55">
                  {job.blurb}
                </p>
                {job.stack && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {job.stack.map((s) => (
                      <li
                        key={s}
                        className="rounded-full border border-paper/10 px-3 py-1 font-mono text-[0.62rem] tracking-[0.08em] text-paper/40"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
