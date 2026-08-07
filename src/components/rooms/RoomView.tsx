"use client";

import { motion } from "motion/react";
import { rooms, roomById, type RoomId } from "@/lib/rooms";
import { HeroScene } from "../scene/HeroScene";
import { About } from "../sections/About";
import { Contact } from "../sections/Contact";
import { Projects } from "../sections/Projects";
import { Work } from "../sections/Work";
import { Writing } from "../sections/Writing";

const CONTENT: Record<RoomId, () => React.ReactElement> = {
  studio: Work,
  drafting: Projects,
  bookshop: Writing,
  cafe: About,
  door: Contact,
};

/** A cheap, warm interior for every room that isn't the café. */
function Interior({ id }: { id: RoomId }) {
  const tint =
    id === "bookshop"
      ? "rgba(155,48,40,0.16)"
      : id === "door"
        ? "rgba(31,74,69,0.20)"
        : "rgba(245,185,92,0.14)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(90% 55% at 50% 0%, ${tint}, transparent 68%)`,
        }}
      />
      {/* lamplight from the top corners, as if from sconces */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(28% 34% at 8% 6%, rgba(245,185,92,0.13), transparent 70%), radial-gradient(28% 34% at 92% 6%, rgba(245,185,92,0.10), transparent 70%)",
        }}
      />
      {/* floorboards at the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-wood-900/70 to-transparent" />
    </div>
  );
}

export function RoomView({ id, onClose }: { id: RoomId; onClose: () => void }) {
  const room = roomById(id)!;
  const Body = CONTENT[id];
  const others = rooms.filter((r) => r.id !== id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.14 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      className="grain fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-night-950"
    >
      {/* the café is the room I drew first — you've walked into it */}
      {id === "cafe" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[86svh] opacity-[0.32]">
          <HeroScene />
          <div className="absolute inset-0 bg-gradient-to-b from-night-950/55 via-night-950/75 to-night-950" />
        </div>
      ) : (
        <Interior id={id} />
      )}

      {/* ── way out ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-brass-500/12 bg-night-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <button
            onClick={onClose}
            className="group flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/55 transition-colors duration-300 hover:text-glow-400"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true">
                <path d="M22 5 H2 M7 1 L2 5 L7 9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
            Back to the street
          </button>
          <span className="font-display text-sm tracking-wide text-paper/45">
            {room.sign}
          </span>
        </div>
      </div>

      {/* ── the room ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-20 sm:px-10 md:pt-28">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="eyebrow"
          >
            {room.kicker}
          </motion.p>
        </div>

        <Body />

        {/* ── the other doors ──────────────────────────────────── */}
        {id !== "door" && (
          <div className="relative mx-auto max-w-6xl px-6 pb-24 sm:px-10">
            <p className="eyebrow mb-6">Elsewhere on the street</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#${r.id}`}
                    className="group flex items-center justify-between gap-4 border border-brass-500/15 bg-night-900/40 px-5 py-4 transition-colors duration-500 hover:border-glow-500/45 hover:bg-night-900/70"
                  >
                    <span>
                      <span className="block font-display text-base text-paper/90 transition-colors duration-300 group-hover:text-glow-300">
                        {r.sign}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-paper/35">
                        {r.nav}
                      </span>
                    </span>
                    <span className="text-glow-500/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-glow-500">
                      <svg width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true">
                        <path d="M0 4.5 H16 M12 1 L16 4.5 L12 8" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
