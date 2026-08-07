"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  Chair,
  Defs,
  FarCity,
  MidCity,
  Moon,
  Room,
  Rug,
  Sky,
  Snow,
  SofaArm,
  Street,
  Table,
  VB,
} from "./parts";

/**
 * Depth is faked with two inputs: the pointer (a small, springy offset) and
 * scroll position (a slow vertical drift). Each layer gets its own factor —
 * the sky barely moves, the room in front of you moves against you.
 */
function useParallax() {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduced]);

  const sx = useSpring(px, { stiffness: 46, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 46, damping: 20, mass: 0.6 });
  return { sx, sy, reduced: !!reduced };
}

function Layer({
  depth,
  sx,
  sy,
  scroll,
  drift = 0,
  children,
  ...rest
}: {
  depth: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  scroll: MotionValue<number>;
  drift?: number;
  children: React.ReactNode;
  clipPath?: string;
}) {
  const x = useTransform(sx, (v) => v * depth * -90);
  const mouseY = useTransform(sy, (v) => v * depth * -54);
  const scrollY = useTransform(scroll, [0, 1], [0, drift]);
  const y = useTransform([mouseY, scrollY] as const, ([a, b]) => (a as number) + (b as number));
  return (
    <motion.g style={{ x, y }} {...rest}>
      {children}
    </motion.g>
  );
}

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { sx, sy } = useParallax();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <Defs />

        {/* the room's back wall, behind everything including the view */}
        <rect x="0" y="-20" width={VB.w} height={VB.h + 40} fill="#0d0a08" />

        {/* ── everything beyond the glass ─────────────────────────── */}
        <g clipPath="url(#glass)">
          <rect x="300" y="-100" width="1000" height="900" fill="#05161f" />
          <Layer depth={0.15} sx={sx} sy={sy} scroll={scrollYProgress} drift={-30}>
            <Sky />
            <Moon />
          </Layer>
          <Layer depth={0.4} sx={sx} sy={sy} scroll={scrollYProgress} drift={-52}>
            <FarCity />
          </Layer>
          <Layer depth={0.75} sx={sx} sy={sy} scroll={scrollYProgress} drift={-74}>
            <MidCity />
          </Layer>
          <Layer depth={1.15} sx={sx} sy={sy} scroll={scrollYProgress} drift={-104}>
            <Street />
          </Layer>
          <Snow />
          {/* cold air on the glass */}
          <rect x="300" y="-100" width="1000" height="900" fill="#1d5f72" opacity="0.1" />
        </g>

        {/* ── this side of the glass ──────────────────────────────── */}
        <Layer depth={-0.16} sx={sx} sy={sy} scroll={scrollYProgress} drift={26}>
          <Room />
        </Layer>
        <Layer depth={-0.34} sx={sx} sy={sy} scroll={scrollYProgress} drift={54}>
          <Rug />
          <Table />
        </Layer>
        <Layer depth={-0.6} sx={sx} sy={sy} scroll={scrollYProgress} drift={92}>
          <SofaArm />
          <Chair />
        </Layer>

        <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#vignette)" />
      </svg>
    </div>
  );
}
