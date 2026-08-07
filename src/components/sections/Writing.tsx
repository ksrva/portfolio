"use client";

import { writing } from "@/lib/content";
import { Reveal, Section, SectionHead } from "../ui";

export function Writing() {
  return (
    <Section id="writing">
      <SectionHead
        index="03 — Writing"
        title="Notes, mostly to myself"
        lead="Half-finished thoughts that got long enough to deserve a title."
      />

      <ul>
        {writing.map((post, i) => (
          <Reveal as="li" key={post.title} delay={i * 0.06}>
            <a
              href={post.href ?? "#writing"}
              className="group relative flex flex-col gap-2 border-t border-paper/8 py-7 transition-colors duration-500 hover:border-glow-500/30 sm:flex-row sm:items-baseline sm:gap-10"
            >
              {/* warm wash that wipes in from the left */}
              <span className="pointer-events-none absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-glow-500/8 to-transparent transition-all duration-700 group-hover:w-full" />
              <span className="relative w-24 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-paper/30">
                {post.date}
              </span>
              <span className="relative flex-1">
                <span className="block font-display text-xl leading-snug text-paper transition-colors duration-500 group-hover:text-glow-300 sm:text-2xl">
                  {post.title}
                </span>
                <span className="mt-2 block max-w-xl text-[0.92rem] leading-[1.7] text-paper/48">
                  {post.blurb}
                </span>
              </span>
              <span className="relative hidden shrink-0 pt-1 text-glow-500/0 transition-all duration-500 group-hover:translate-x-1 group-hover:text-glow-500/80 sm:block">
                <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
                  <path d="M0 5 H20 M15 1 L20 5 L15 9" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
