"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* The street has no controls on screen, so the first time it lights up it
   says how to get about. Coming back from a shop, the visitor already
   knows, so it stays shut; the "?" in the corner brings it back.

   Drawn like a game's instruction box: a blocky panel dead centre over a
   dimmed screen, hard black outline, bevelled edge, keys as keycaps. */

const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

// light catches the top-left edge, shadow sits on the bottom-right, and a
// hard black line rings the lot
const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";

const STEPS: { keys: string[]; text: string }[] = [
  { keys: ["Scroll"], text: "Walk down the street." },
  { keys: ["Click", "a shop"], text: "Step inside. Experience is on the left, Projects on the right." },
  { keys: ["Click", "the lamp"], text: "Wake the room once you're in." },
  { keys: ["Back to the street"], text: "Top left of every room, to come back out." },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function StreetGuide({
  offer,
  available,
  hidden,
}: {
  /** flips true when the box should open by itself (first arrival only) */
  offer: boolean;
  /** whether the "?" is on screen — only once the street can be walked */
  available: boolean;
  /** shut everything, e.g. while flying into a shop */
  hidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  const offered = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const helpBtn = useRef<HTMLButtonElement>(null);

  // Open once when offered. The flag is set inside the timeout so a Strict
  // Mode double-run can't cancel the only attempt.
  useEffect(() => {
    if (!offer || offered.current) return;
    const id = setTimeout(() => {
      offered.current = true;
      setOpen(true);
    }, 0);
    return () => clearTimeout(id);
  }, [offer]);

  const shown = open && !hidden;

  const close = () => {
    // hand focus back to the "?" rather than dropping it on the body
    if (card.current?.contains(document.activeElement)) helpBtn.current?.focus({ preventScroll: true });
    setOpen(false);
  };

  useEffect(() => {
    if (!shown) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // modal: the box's one control keeps focus rather than Tab wandering
      // off to the page behind the dimmer
      if (e.key === "Tab") {
        e.preventDefault();
        closeBtn.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  return (
    <>
      <AnimatePresence>
        {shown && (
          <motion.div
            className="fixed inset-0 z-[35] flex items-center justify-center bg-black/50 p-4"
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
              aria-labelledby="street-guide-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[26rem] border-2 border-black bg-[#17120e]/95 px-6 pb-6 pt-5"
              style={{ boxShadow: `${BEVEL}, 0 22px 60px rgba(0,0,0,0.55)` }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <h2
                id="street-guide-title"
                className={`text-center font-masthead text-[1.35rem] leading-[1.3] tracking-[-0.01em] ${NAME}`}
              >
                Getting around
              </h2>
              <div aria-hidden className="mx-auto mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]" />

              <ul className="mt-5 space-y-4">
                {STEPS.map(({ keys, text }) => (
                  <li key={keys.join(" ")} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-4">
                    <span className="flex flex-wrap items-baseline gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          className={`rounded-[3px] border border-b-[3px] border-black bg-paper/10 px-1.5 py-px font-mono text-[0.68rem] leading-[1.6] ${NAME}`}
                          style={{ boxShadow: "inset 1px 1px 0 rgba(255,236,200,0.18)" }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                    <span className={`text-[0.88rem] leading-[1.5] ${BODY}`}>{text}</span>
                  </li>
                ))}
              </ul>

              <button
                ref={closeBtn}
                type="button"
                onClick={close}
                className={`mt-6 w-full border-2 border-black bg-paper/10 py-2 font-masthead text-[1rem] transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                style={{ boxShadow: BEVEL }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {available && (
          <motion.button
            ref={helpBtn}
            type="button"
            aria-label="How to get around"
            aria-expanded={shown}
            onClick={() => (shown ? close() : setOpen(true))}
            className={`fixed bottom-5 right-5 z-[35] flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 bg-night-950/60 font-masthead text-[1.05rem] backdrop-blur-md transition-colors duration-300 hover:text-paper sm:bottom-8 sm:right-8 ${META}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            ?
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
