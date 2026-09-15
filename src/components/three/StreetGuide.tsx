"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/* The street has no controls on screen, so the first time it lights up it
   introduces itself and then says how to get about. Coming back from a shop,
   the visitor already knows, so it stays shut; the "?" in the corner brings
   it back.

   Two panels rather than one: who this is, then how it works. A wall of both
   at once is a wall, and the half most people actually need is the second.

   Drawn like a game's instruction box: a blocky panel dead centre over a
   dimmed screen, hard black outline, bevelled edge, keys as keycaps. */

const NAME = "text-paper";
const BODY = "text-paper/70";
const META = "text-paper/45";

// light catches the top-left edge, shadow sits on the bottom-right, and a
// hard black line rings the lot
const BEVEL = "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55)";

const STEPS: { keys: string[]; text: string }[] = [
  { keys: ["↑", "↓"], text: "Walk down the street, and back again." },
  { keys: ["←", "→"], text: "Step across the road." },
  { keys: ["Mouse"], text: "Turn and look, not everything is straight ahead :D" },
  // the keycap supplies the first word, so the row reads as one sentence
  { keys: ["Click"], text: "on a storefront to step inside" },
  { keys: ["Click", "the lamp"], text: "Light up the room once you're in." },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const PANELS = 2;

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
  const [step, setStep] = useState(0);
  const offered = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const helpBtn = useRef<HTMLButtonElement>(null);

  // Open once when offered. The flag is set inside the timeout so a Strict
  // Mode double-run can't cancel the only attempt.
  useEffect(() => {
    if (!offer || offered.current) return;
    const id = setTimeout(() => {
      offered.current = true;
      setStep(0);
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
    nextBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      /* modal: focus stays among the card's own controls rather than Tab
         wandering off to the page behind the dimmer. Collected from the DOM
         at press time rather than held as refs, because how many controls
         there are depends on which panel you're on. */
      if (e.key === "Tab") {
        e.preventDefault();
        const stops = Array.from(card.current?.querySelectorAll("button") ?? []);
        if (!stops.length) return;
        const i = stops.indexOf(document.activeElement as HTMLButtonElement);
        const dir = e.shiftKey ? -1 : 1;
        stops[(i + dir + stops.length) % stops.length]?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, step]);

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
              className="relative w-full max-w-[27rem] border-2 border-black bg-[#17120e]/95 px-6 pb-5 pt-5"
              style={{ boxShadow: `${BEVEL}, 0 22px 60px rgba(0,0,0,0.55)` }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center border-2 border-black bg-paper/10 text-[0.95rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                style={{ boxShadow: BEVEL }}
              >
                ×
              </button>

              <h2
                id="street-guide-title"
                className={`pr-8 text-center font-masthead text-[1.35rem] leading-[1.3] tracking-[-0.01em] ${NAME}`}
              >
                {step === 0 ? "Hello!" : "Getting around"}
              </h2>
              <div
                aria-hidden
                className="mx-auto mt-3 h-[2px] w-full bg-black/60 shadow-[0_1px_0_rgba(255,236,200,0.08)]"
              />

              <AnimatePresence mode="wait" initial={false}>
                {step === 0 ? (
                  <motion.div
                    key="hello"
                    className={`mt-5 space-y-3 text-[0.9rem] leading-[1.6] ${BODY}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <p>
                      Hi! I&rsquo;m <span className={NAME}>Kam</span>, welcome to my (WIP)
                      portfolio!
                    </p>
                    <p>
                      I&rsquo;m a Computer Science &amp; Finance student at the University of
                      Waterloo, graduating in 2028.
                    </p>
                    <p>
                      In my free time I love running, Taekwondo, singing and sketching!
                    </p>
                    <p className={NAME}>Take a look around!</p>
                  </motion.div>
                ) : (
                  <motion.ul
                    key="howto"
                    className="mt-5 space-y-4"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
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
                  </motion.ul>
                )}
              </AnimatePresence>

              {/* the way forward, and back */}
              <div className="mt-6 flex items-center gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    aria-label="Back"
                    className={`border-2 border-black bg-paper/10 px-3 py-2 font-masthead text-[0.9rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                    style={{ boxShadow: BEVEL }}
                  >
                    ←
                  </button>
                ) : null}

                <button
                  ref={nextBtn}
                  type="button"
                  onClick={() => (step < PANELS - 1 ? setStep((s) => s + 1) : close())}
                  className={`flex-1 border-2 border-black bg-paper/10 py-2 font-masthead text-[1rem] transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                  style={{ boxShadow: BEVEL }}
                >
                  {step < PANELS - 1 ? "How to get around →" : "Got it"}
                </button>
              </div>
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
            onClick={() => {
              if (shown) {
                close();
                return;
              }
              // reopened from the "?" — start on the hello again
              setStep(0);
              setOpen(true);
            }}
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
