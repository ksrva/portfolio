"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

/* The card that greets you the first time you find the alley.

   Same blocky, bevelled language as the street's guide — hard black outline,
   lit top-left edge, shadowed bottom-right — so the two read as the same
   game rather than two different pieces of UI.

   It doesn't own whether it's open: the scene does. Escape means three
   different things down here (shut this, step back from a sheet, leave the
   alley) and two window listeners racing on registration order is not a way
   to decide which. */

const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";
const EASE = [0.22, 1, 0.36, 1] as const;

export function AlleyGuide({
  open,
  onClose,
  onOpen,
  available,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  /** whether the "i" is on screen — only while you're actually in the alley */
  available: boolean;
}) {
  const card = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const xBtn = useRef<HTMLButtonElement>(null);
  const infoBtn = useRef<HTMLButtonElement>(null);

  const close = () => {
    // hand focus back to the "i" rather than dropping it on the body
    if (card.current?.contains(document.activeElement)) infoBtn.current?.focus({ preventScroll: true });
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus({ preventScroll: true });
    // modal: focus cycles between the card's own two controls rather than
    // Tab wandering off to the scene behind the dimmer
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const stops = [xBtn.current, closeBtn.current].filter(
        (b): b is HTMLButtonElement => b !== null,
      );
      if (!stops.length) return;
      const i = stops.indexOf(document.activeElement as HTMLButtonElement);
      const step = e.shiftKey ? -1 : 1;
      stops[(i + step + stops.length) % stops.length]?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[38] flex items-center justify-center bg-black/55 p-4"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <motion.div
              ref={card}
              role="dialog"
              aria-modal="true"
              aria-labelledby="alley-guide-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[27rem] border-2 border-black bg-[#17120e]/95 px-6 pb-6 pt-5"
              style={{ boxShadow: `${BEVEL}, 0 22px 60px rgba(0,0,0,0.55)` }}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <button
                ref={xBtn}
                type="button"
                onClick={close}
                aria-label="Close"
                className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center border-2 border-black bg-paper/10 text-[0.95rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                style={{ boxShadow: BEVEL }}
              >
                ×
              </button>

              <h2
                id="alley-guide-title"
                className={`pr-8 text-center font-masthead text-[1.3rem] leading-[1.3] tracking-[-0.01em] ${NAME}`}
              >
                You found my secret gallery!
              </h2>
              <div
                aria-hidden
                className="mx-auto mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]"
              />

              <div className={`mt-5 space-y-3 text-[0.9rem] leading-[1.6] ${BODY}`}>
                <p>
                  In my free time I&rsquo;ve been dabbling in architectural sketching. These are
                  some of the better ones.
                </p>
                <p>
                  I especially like drawing buildings from trips, usually on the plane back
                  home.
                </p>
                <p>
                  The one I&rsquo;m working on at the moment is{" "}
                  <span className={NAME}>St.&nbsp;Stephen&rsquo;s Cathedral</span>{" "}
                  <span className={META}>(Stephansdom)</span> from my recent trip to
                  Austria. Did not finish on the plane.
                </p>
              </div>

              <p
                className={`mt-5 border-t-2 border-black/60 pt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] ${META}`}
              >
                Click any sketch for a closer look
              </p>

              <button
                ref={closeBtn}
                type="button"
                onClick={close}
                className={`mt-5 w-full border-2 border-black bg-paper/10 py-2 font-masthead text-[1rem] transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                style={{ boxShadow: BEVEL }}
              >
                Have a look around
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brings it back, in the corner the street's "?" uses — which is free
          down here, because that button hides while you're in the alley. */}
      <AnimatePresence>
        {available && (
          <motion.button
            ref={infoBtn}
            type="button"
            aria-label="About this gallery"
            aria-expanded={open}
            onClick={() => (open ? close() : onOpen())}
            className={`fixed bottom-5 right-5 z-[36] flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 bg-night-950/60 font-masthead text-[1.05rem] backdrop-blur-md transition-colors duration-300 hover:text-paper sm:bottom-8 sm:right-8 ${META}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            i
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
