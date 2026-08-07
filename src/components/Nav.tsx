"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { site } from "@/lib/content";
import { rooms } from "@/lib/rooms";

const nav = rooms.map((r) => ({ label: r.nav, href: `#${r.id}` }));

export function Nav() {
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-30"
    >
      <div
        className={`transition-all duration-500 ${
          lifted
            ? "border-b border-brass-500/15 bg-night-950/72 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <a href="#" className="group flex items-center gap-3" aria-label="Back to the street">
            {/* a tiny lit window as the mark */}
            <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
              <path
                d="M1 25 V7 Q11 -2 21 7 V25 Z"
                fill="none"
                stroke="var(--color-brass-500)"
                strokeWidth="1.4"
                opacity="0.8"
              />
              <path
                d="M4 24 V8.6 Q11 1.6 18 8.6 V24 Z"
                fill="var(--color-glow-500)"
                opacity="0.42"
                className="transition-opacity duration-500 group-hover:opacity-90"
              />
              <line x1="11" y1="3" x2="11" y2="25" stroke="var(--color-night-950)" strokeWidth="1.4" />
            </svg>
            <span className="font-display text-[0.98rem] tracking-[0.02em] text-paper/90">
              {site.fullName}
            </span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group relative font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper/50 transition-colors duration-300 hover:text-glow-400"
                >
                  {item.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-glow-500 transition-all duration-400 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brass-500/25 text-paper/70 md:hidden"
            aria-expanded={open}
            aria-label="Menu"
          >
            <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true">
              <path
                d={open ? "M1 1 L14 10 M14 1 L1 10" : "M0 1 H15 M0 5.5 H15 M0 10 H15"}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>

        {open && (
          <ul className="border-t border-brass-500/12 bg-night-950/92 px-6 pb-5 pt-2 backdrop-blur-xl md:hidden">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-paper/60"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.header>
  );
}
