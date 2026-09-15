"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

/* The main menu: a toggle in the top-right, a dimmer over the scene, and a
   panel in from the side.

   The icon is three strokes of deliberately different lengths with rounded
   caps — a plain set of three equal bars reads as a default nobody chose.
   It cross-fades to the same × the cards use, so closing looks the same
   everywhere.

   Nothing here mentions the alley. It's meant to be found. */

const NAME = "text-paper";
const META = "text-paper/45";

const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";
const PANEL = `${BEVEL}, 0 18px 40px rgba(0,0,0,0.5)`;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Three strokes, tapering. Widths are deliberate, not decorative noise. */
function Bars() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" aria-hidden focusable="false">
      <g fill="currentColor">
        <rect x="3" y="5.6" width="18" height="1.9" rx="0.95" />
        <rect x="3" y="11.05" width="12.5" height="1.9" rx="0.95" />
        <rect x="3" y="16.5" width="15.5" height="1.9" rx="0.95" />
      </g>
    </svg>
  );
}

/** A drawn glyph: stroked, round-capped, and set on slightly off-round
    coordinates so it reads as pencil rather than an icon set. */
function Glyph({ paths }: { paths: string[] }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/* A case for the work, a set square for the workshop, a figure for the
   hello, and a signpost for the directions. */
const GLYPHS = {
  case: ["M3.4 7.5h13.2v8.1H3.4z", "M7.7 7.4V5.8c0-.5.4-.9.9-.9h2.8c.5 0 .9.4.9.9v1.6", "M3.6 11h12.8"],
  square: ["M4.2 15.6V4.7l11.2 10.9H4.2z", "M6.1 13.7l1.5-1.5"],
  figure: ["M10 4.6a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z", "M4.8 16.1c.5-2.9 2.7-4.5 5.2-4.5s4.7 1.6 5.2 4.5"],
  signpost: ["M9.9 3.8v12.6", "M9.9 5.9h5.3l-1.4 1.6 1.4 1.6H9.9", "M9.9 10.7H4.7l1.4 1.6-1.4 1.6h5.2"],
};

type Item = { label: string; paths: string[] } & (
  | { href: string; onSelect?: never }
  | { href?: never; onSelect: () => void }
);

export function StreetMenu({
  available,
  hidden,
  onAbout,
  onControls,
}: {
  /** only once the street is lit and walkable */
  available: boolean;
  /** shut it, e.g. while flying into a shop or down the alley */
  hidden: boolean;
  onAbout: () => void;
  onControls: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  const shown = open && !hidden;

  const close = () => {
    if (panel.current?.contains(document.activeElement)) toggle.current?.focus({ preventScroll: true });
    setOpen(false);
  };

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      /* keep Tab inside the panel — behind it is a 3D scene that takes
         clicks, and focus wandering into it looks like nothing happening */
      if (e.key === "Tab") {
        e.preventDefault();
        const stops = Array.from(panel.current?.querySelectorAll("a,button") ?? []) as HTMLElement[];
        if (!stops.length) return;
        const i = stops.indexOf(document.activeElement as HTMLElement);
        const dir = e.shiftKey ? -1 : 1;
        stops[(i + dir + stops.length) % stops.length]?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [shown]);

  const items: Item[] = [
    { label: "Experience", paths: GLYPHS.case, href: "/experience" },
    { label: "Projects", paths: GLYPHS.square, href: "/projects" },
    { label: "About me", paths: GLYPHS.figure, onSelect: onAbout },
    { label: "Getting around", paths: GLYPHS.signpost, onSelect: onControls },
  ];

  const row = `flex w-full items-center gap-3 border-2 border-black bg-paper/[0.07] px-4 py-3 text-left font-masthead text-[1rem] leading-none transition-colors duration-200 hover:bg-glow-500/20 focus-visible:bg-glow-500/20 ${NAME}`;

  return (
    <>
      <AnimatePresence>
        {available && (
          <motion.button
            ref={toggle}
            type="button"
            aria-label={shown ? "Close menu" : "Open menu"}
            aria-expanded={shown}
            onClick={() => (shown ? close() : setOpen(true))}
            className={`fixed right-5 top-5 z-[46] flex h-10 w-10 items-center justify-center border-2 border-black bg-[#17120e]/95 transition-colors duration-200 hover:bg-glow-500/20 sm:right-8 sm:top-8 ${NAME}`}
            style={{ boxShadow: PANEL }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {shown ? (
                <motion.span
                  key="x"
                  className="text-[1.1rem] leading-none"
                  initial={{ opacity: 0, rotate: -35 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 35 }}
                  transition={{ duration: 0.18, ease: EASE }}
                >
                  ×
                </motion.span>
              ) : (
                <motion.span
                  key="bars"
                  className="flex"
                  initial={{ opacity: 0, rotate: 35 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -35 }}
                  transition={{ duration: 0.18, ease: EASE }}
                >
                  <Bars />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shown && (
          <>
            <motion.div
              className="fixed inset-0 z-[44] bg-black/60"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            />

            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              className="fixed right-0 top-0 z-[45] flex h-full w-[18rem] flex-col border-l-2 border-black bg-[#17120e]/97 px-5 pb-6 pt-20 backdrop-blur-sm sm:w-[20rem]"
              style={{ boxShadow: "-18px 0 50px rgba(0,0,0,0.55)" }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <p
                className={`font-mono text-[0.62rem] uppercase tracking-[0.28em] ${META}`}
              >
                Menu
              </p>
              <div
                aria-hidden
                className="mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]"
              />

              <nav className="mt-5 flex flex-col gap-2.5">
                {items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={close}
                      className={row}
                      style={{ boxShadow: BEVEL }}
                    >
                      <Glyph paths={item.paths} />
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        close();
                        item.onSelect?.();
                      }}
                      className={row}
                      style={{ boxShadow: BEVEL }}
                    >
                      <Glyph paths={item.paths} />
                      {item.label}
                    </button>
                  ),
                )}
              </nav>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
