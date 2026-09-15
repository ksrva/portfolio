"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

/* The work-in-progress view: the sketch and the photo it's being drawn from,
   side by side.

   An overlay rather than a move in the scene, for once. The point here is
   comparison, and comparing two drawings means seeing both at a readable
   size at the same moment — which a camera in a 5.5-unit alley can't do.
   Same bevelled panel as the rest so it still belongs to the same game.

   Both images are portrait, so they sit two-up on a wide screen and stack
   on a narrow one. */

const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";
const EASE = [0.22, 1, 0.36, 1] as const;

/* What each pair is, keyed by the sketch's base filename. Adding another
   means a photo named "<sketch>-ref.<ext>" in the folder and one entry
   here — the wiring finds the rest on its own. */
const NOTES: Record<
  string,
  {
    title: string;
    /** the building's name in its own language, where it's worth showing */
    alt?: string;
    place: string;
    note: string;
  }
> = {
  ststephens: {
    title: "St. Stephen's Cathedral",
    alt: "(Stephansdom)",
    place: "Vienna",
    note: "Very much a work in progress.",
  },
  cusco: {
    title: "Church of the Company of Jesus",
    place: "Cusco",
    note: "From my Peru trip!",
  },
};

export function WipView({
  open,
  onClose,
  sketch,
  reference,
}: {
  open: boolean;
  onClose: () => void;
  /** filename of the drawing, relative to /sketches */
  sketch?: string;
  /** filename of the photo it's drawn from; the pair only shows if both exist */
  reference?: string;
}) {
  const card = useRef<HTMLDivElement>(null);
  const xBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    xBtn.current?.focus({ preventScroll: true });
    /* The × is the only control now, so Tab simply stays on it. Without
       this it would walk straight off into the scene behind the dimmer. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      xBtn.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* No caption: which one is the drawing and which the photograph is not a
     thing anyone needs telling. The alt text stays — invisible, but it's
     what a screen reader announces. */
  const plate = (src: string, alt: string) => (
    <div
      className="min-w-0 flex-1 border-2 border-black bg-[#0d0a07] p-1.5"
      style={{ boxShadow: BEVEL }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="mx-auto max-h-[48vh] w-auto max-w-full object-contain"
      />
    </div>
  );

  const meta = NOTES[(sketch ?? "").replace(/\.[^.]+$/, "").toLowerCase()];

  return (
    <AnimatePresence>
      {open && sketch && reference && meta && (
        <motion.div
          className="fixed inset-0 z-[39] flex items-center justify-center bg-black/65 p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <motion.div
            ref={card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wip-title"
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92svh] w-full max-w-[52rem] overflow-y-auto border-2 border-black bg-[#17120e]/96 px-5 pb-5 pt-5 sm:px-7 sm:pb-6"
            style={{ boxShadow: `${BEVEL}, 0 22px 60px rgba(0,0,0,0.6)` }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <button
              ref={xBtn}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center border-2 border-black bg-paper/10 text-[0.95rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
              style={{ boxShadow: BEVEL }}
            >
              ×
            </button>

            <h2
              id="wip-title"
              className={`pr-8 text-center font-masthead text-[1.25rem] leading-[1.3] tracking-[-0.01em] ${NAME}`}
            >
              {meta.title}
              {meta.alt ? <span className={META}> {meta.alt}</span> : null}
              <span className={META}>, {meta.place}</span>
            </h2>
            <div
              aria-hidden
              className="mx-auto mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]"
            />

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {plate(`/sketches/${sketch}`, `Pencil sketch of ${meta.title}`)}
              {plate(`/sketches/${reference}`, `Photograph of ${meta.title}`)}
            </div>

            <p className={`mt-5 text-center text-[0.9rem] leading-[1.6] ${BODY}`}>
              {meta.note}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
