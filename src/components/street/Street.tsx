"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookshop,
  Cafe,
  Defs,
  FrontDoor,
  HOTSPOTS,
  Shops,
  Signs,
  Sky,
  Snowfall,
  Square,
  Town,
  VB,
} from "./art";
import { rooms, roomById, type RoomId } from "@/lib/rooms";
import { site } from "@/lib/content";
import { RoomView } from "../rooms/RoomView";

type Cam = { x: number; y: number; s: number };
const REST: Cam = { x: 0, y: 0, s: 1 };

export function Street() {
  const [hover, setHover] = useState<RoomId | null>(null);
  const [active, setActive] = useState<RoomId | null>(null);
  const [cam, setCam] = useState<Cam>(REST);
  const svgRef = useRef<SVGSVGElement>(null);
  /** Read inside enter() without making it depend on render state. */
  const activeRef = useRef<RoomId | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /** Push the camera through a given hotspot until it fills the screen. */
  const enter = useCallback((id: RoomId, push = true) => {
    const el = svgRef.current?.querySelector<SVGRectElement>(`#hot-${id}`);
    // Only aim the camera from outside. Room-to-room moves happen while the
    // facade is already scaled up, so its rects no longer measure the street.
    if (el && !activeRef.current) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // enough to make the opening swallow the viewport
      const s = Math.max(
        (window.innerWidth * 1.6) / Math.max(r.width, 1),
        (window.innerHeight * 1.6) / Math.max(r.height, 1),
        2.4,
      );
      setCam({
        x: window.innerWidth / 2 - cx * s,
        y: window.innerHeight / 2 - cy * s,
        s,
      });
    }
    setActive(id);
    setHover(null);
    if (push && typeof history !== "undefined") {
      history.pushState({ room: id }, "", `#${id}`);
    }
  }, []);

  const leave = useCallback((pop = true) => {
    setActive(null);
    setCam(REST);
    if (pop && typeof history !== "undefined" && location.hash) {
      history.pushState(null, "", location.pathname);
    }
  }, []);

  /* Deep links, and the back button walking you back outside. */
  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.replace("#", "");
      const room = roomById(id);
      if (room) enter(room.id, false);
      else {
        setActive(null);
        setCam(REST);
      }
    };
    fromHash();
    window.addEventListener("popstate", fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener("popstate", fromHash);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [enter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, leave]);

  /* Lock the page while you're inside a room. */
  useEffect(() => {
    document.documentElement.style.overflow = active ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [active]);

  return (
    <div className="grain relative h-[100svh] w-full overflow-hidden bg-night-950">
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "0 0" }}
        animate={{
          x: cam.x,
          y: cam.y,
          scale: cam.s,
          opacity: active ? 0 : 1,
          // No CSS filter at rest: Motion keeps the last value as an inline
          // style, and a permanent blur(0px) forces the whole filtered SVG
          // subtree to re-rasterize every frame.
        }}
        transition={{
          duration: active ? 1.15 : 0.95,
          ease: [0.65, 0, 0.35, 1],
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          /* Anchored to the bottom: on a short, wide window the sky is what
             gets eaten, never the street. */
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
        >
          <Defs />

          {/* No filters anywhere: this style is engraved, not painted, and
              filters were also what froze the renderer. */}
          <Sky />
          <Town />
          <Shops />
          <Cafe />
          <FrontDoor />
          <Bookshop />
          <Signs name={site.fullName} />
          <Square />
          <Snowfall />

          {/* ── hotspots ──────────────────────────────────────────── */}
          {rooms.map((room) => {
            const h = HOTSPOTS[room.id];
            const on = hover === room.id;
            const cx = h.x + h.w / 2;
            return (
              <g key={room.id}>
                {/* the light coming up when you look at it. Every one of these
                    needs an explicit initial — without it they paint at full
                    strength until hydration, and the whole street lights up. */}
                <motion.rect
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  fill="#ffd9a3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: on ? 0.14 : 0 }}
                  transition={{ duration: 0.45 }}
                  style={{ pointerEvents: "none" }}
                />
                <motion.ellipse
                  cx={cx}
                  cy={h.y + h.h / 2}
                  rx={h.w * 1.35}
                  ry={h.h * 1.5}
                  fill="url(#halo)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: on ? 0.95 : 0 }}
                  transition={{ duration: 0.55 }}
                  style={{ pointerEvents: "none" }}
                />
                {/* Only on hover. A permanent crisp rectangle sits on top of
                    the painting as obvious UI chrome and breaks the whole
                    illusion — discoverability comes from the cursor and the
                    plaque instead. */}
                <motion.rect
                  x={h.x - 5}
                  y={h.y - 5}
                  width={h.w + 10}
                  height={h.h + 10}
                  fill="none"
                  stroke="#f5b95c"
                  strokeWidth="2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: on ? 0.6 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ pointerEvents: "none" }}
                />

                {/* the actual target */}
                <rect
                  id={`hot-${room.id}`}
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  fill="transparent"
                  className="cursor-pointer"
                  onPointerEnter={() => setHover(room.id)}
                  onPointerLeave={() => setHover((v) => (v === room.id ? null : v))}
                  onClick={() => enter(room.id)}
                  role="link"
                  tabIndex={0}
                  aria-label={room.plaque}
                  onFocus={() => setHover(room.id)}
                  onBlur={() => setHover((v) => (v === room.id ? null : v))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      enter(room.id);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Dusk at the top of the *viewport*, not the scene. The SVG crops from
          the top on wide windows, so anything anchored in scene space slides
          out of view exactly when the nav needs the contrast most. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,18,26,0.88) 0%, rgba(4,18,26,0.45) 45%, rgba(4,18,26,0) 100%)",
        }}
      />

      {/* ── the sign above the street ────────────────────────────── */}
      <AnimatePresence>
        {!active && (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, transition: { duration: 0.35 } }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 top-0 z-20 px-6 pt-[4.5rem] sm:px-10 sm:pt-24"
          >
            {/* the sky is a thin band on wide screens — give the type its own dusk */}
            <div
              className="absolute inset-x-0 top-0 h-[22rem]"
              style={{
                background:
                  "radial-gradient(58% 100% at 26% 0%, rgba(4,18,26,0.9) 0%, rgba(4,18,26,0.55) 42%, rgba(4,18,26,0) 78%)",
              }}
            />
            <div className="relative mx-auto max-w-6xl">
              <p className="eyebrow mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-block h-px w-8 bg-glow-500/60" />
                <span>{site.location}</span>
                <span className="text-paper/25">·</span>
                <span className="text-glow-500/70">{site.role}</span>
              </p>
              <h1 className="font-display text-[clamp(2.4rem,6.4vw,4.9rem)] font-light leading-[0.92] tracking-[-0.035em] text-paper [text-shadow:0_2px_30px_rgba(4,18,26,0.9)]">
                {site.name}
              </h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── the brass plaque, read off whatever you're pointing at ── */}
      <AnimatePresence>
        {!active && (
          <motion.div
            key="plaque"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center px-6"
          >
            <div
              className={`flex items-center gap-4 rounded-sm border px-6 py-3 backdrop-blur-md transition-colors duration-500 ${
                hover
                  ? "border-brass-500/60 bg-[#120e0a]/85"
                  : "border-paper/10 bg-[#120e0a]/50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                  hover ? "bg-glow-500 shadow-[0_0_10px_2px_rgba(245,185,92,0.8)]" : "bg-paper/25"
                }`}
              />
              <span
                className={`font-mono text-[0.62rem] uppercase tracking-[0.26em] transition-colors duration-500 ${
                  hover ? "text-glow-300" : "text-paper/45"
                }`}
              >
                {hover
                  ? roomById(hover)!.plaque
                  : "Five lights are on — look in one"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── inside ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {active && <RoomView key={active} id={active} onClose={() => leave()} />}
      </AnimatePresence>
    </div>
  );
}
