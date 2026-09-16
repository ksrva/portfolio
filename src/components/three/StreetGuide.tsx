"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/lib/content";

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
  { keys: ["Mouse"], text: "Turn and look, not everything is straight ahead :D" },
  { keys: ["Click"], text: "Step inside a storefront." },
  { keys: ["Click", "the lamp"], text: "Light up the room once you're in." },
];

/* The photos, in the order they're paged through. Every file is cut to the
   same 3:5 so the frame never changes height between slides — a carousel
   whose box resizes as you page reads as a bug. Adding one is a line here. */
/* Order here is the order they're paged through, and it has nothing to do
   with the filenames — those are just the order the photos arrived. The close
   portrait leads because a bio panel wants a face before it wants a view. */
const PHOTOS: { src: string; alt: string }[] = [
  { src: "/profile6.jpg", alt: "Kam at an outdoor table in the evening" },
  { src: "/profile.jpg", alt: "Kam on a marble staircase beside a stone lion" },
  { src: "/profile2.jpg", alt: "Kam on a mountain trail below a glacier" },
  { src: "/profile3.jpg", alt: "Kam among Inca terrace ruins above a valley" },
  { src: "/profile4.jpg", alt: "Kam on the Graben in Vienna at night, by the Plague Column" },
  { src: "/profile5.jpg", alt: "Kam on a wet road below a misty cliff in Hallstatt" },
  { src: "/profile7.jpg", alt: "Kam on an alpine ridge above a forested valley" },
  { src: "/profile8.jpg", alt: "Kam on sand dunes at sunset" },
];

/* Marks rather than words. Three labelled links in a row would compete with
   the bio beside them; three small panels read as controls and stay quiet.

   All drawn in currentColor at one size, so they take the paper colour like
   the rest of the type instead of arriving in brand colours and punching
   holes in the panel. Email is an envelope because email is not a brand. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden focusable="false">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}

/* Two shapes that do not overlap — the body below the fold, the flap above —
   rather than a rectangle with cuts laid over it, which fills wrong. */
function MailMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden focusable="false">
      <path d="M2 6.4V18a2 2 0 002 2h16a2 2 0 002-2V6.4l-9.42 6.6a1 1 0 01-1.16 0L2 6.4z" />
      <path d="M20 4H4c-.54 0-1.04.21-1.4.56L12 11.2l9.4-6.64A1.99 1.99 0 0020 4z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/* The three addresses already live in content.ts as site.socials, so they are
   looked up by label here rather than retyped — one copy to keep right. */
const social = (label: string) => site.socials.find((s) => s.label === label)?.href ?? "#";

const CONTACTS = [
  { label: "GitHub", href: social("GitHub"), Mark: GitHubMark },
  { label: "Email", href: social("Email"), Mark: MailMark },
  { label: "LinkedIn", href: social("LinkedIn"), Mark: LinkedInMark },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const PANELS = 2;

export function StreetGuide({
  offer,
  available,
  hidden,
  request,
}: {
  /** flips true when the box should open by itself (first arrival only) */
  offer: boolean;
  /** whether the "?" is on screen — only once the street can be walked */
  available: boolean;
  /** shut everything, e.g. while flying into a shop */
  hidden: boolean;
  /** the menu asking for a panel: a new id opens it at the given step */
  request?: { id: number; step: number };
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [slide, setSlide] = useState(0);
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

  /* Opened from the menu. The id is what changes, not a boolean, so asking
     twice for the same panel still works. Set inside a timeout for the same
     reason the offer effect is: calling setState straight from an effect
     body triggers cascading renders and is flagged. */
  const lastRequest = useRef(0);
  useEffect(() => {
    if (!request || request.id === lastRequest.current) return;
    const t = setTimeout(() => {
      lastRequest.current = request.id;
      setStep(request.step);
      setOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, [request]);

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
        /* anchors as well as buttons: the contact marks are links, and a
           selector of "button" alone dropped them out of the tab order
           entirely rather than merely ordering them oddly */
        const stops = Array.from(
          card.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [],
        );
        if (!stops.length) return;
        const i = stops.indexOf(document.activeElement as HTMLElement);
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
              className="relative w-full max-w-[32rem] border-2 border-black bg-[#17120e]/95 px-6 pb-5 pt-5"
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
                    className="mt-5 flex flex-col gap-4 sm:flex-row sm:gap-5"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    {/* The photo carousel. A box rather than a circle: a
                        circle throws away the corners, and at this size that
                        was most of the picture. Centred when the card stacks
                        on a narrow screen, left-aligned beside the text once
                        there's room.

                        A pinned 3:5 with object-cover rather than the old
                        h-auto. Every file is already cut to 3:5, so nothing is
                        actually trimmed — but fixing the ratio means the frame
                        can't change height as the slide changes, which is what
                        made the single-photo version jump.

                        No arrow-key binding on purpose: the street listens for
                        those on window to walk, so paging with them would move
                        you down the road while the panel is open. */}
                    <div className="mx-auto shrink-0 self-start sm:mx-0">
                      <div
                        className="relative aspect-[4/5] w-36 overflow-hidden border-2 border-black bg-[#0d0a07]"
                        style={{ boxShadow: BEVEL }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {/* motion.img rather than a plain img, which also
                              sidesteps the no-img-element directive that keeps
                              getting orphaned when this block reflows */}
                          <motion.img
                            key={PHOTOS[slide].src}
                            src={PHOTOS[slide].src}
                            alt={PHOTOS[slide].alt}
                            className="absolute inset-0 h-full w-full object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: EASE }}
                          />
                        </AnimatePresence>
                      </div>

                      {PHOTOS.length > 1 && (
                        <div className="mt-2 flex w-36 items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSlide((s) => (s - 1 + PHOTOS.length) % PHOTOS.length)}
                            aria-label="Previous photo"
                            className={`flex h-6 w-6 items-center justify-center border-2 border-black bg-paper/10 text-[0.8rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                            style={{ boxShadow: BEVEL }}
                          >
                            ‹
                          </button>

                          {/* gap-1 rather than gap-1.5: at eight slides the
                              dots plus both arrows only just clear the 144px
                              column, and the tighter gap keeps the headroom */}
                          <div className="flex items-center gap-1">
                            {PHOTOS.map((p, i) => (
                              <button
                                key={p.src}
                                type="button"
                                onClick={() => setSlide(i)}
                                aria-label={`Photo ${i + 1} of ${PHOTOS.length}`}
                                aria-current={i === slide}
                                className={`h-1.5 w-1.5 border border-black transition-colors duration-200 ${
                                  i === slide ? "bg-glow-400" : "bg-paper/25 hover:bg-paper/50"
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSlide((s) => (s + 1) % PHOTOS.length)}
                            aria-label="Next photo"
                            className={`flex h-6 w-6 items-center justify-center border-2 border-black bg-paper/10 text-[0.8rem] leading-none transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                            style={{ boxShadow: BEVEL }}
                          >
                            ›
                          </button>
                        </div>
                      )}

                      {/* Under the photo rather than trailing the bio: the
                          marks belong with the picture as one block, and the
                          text column is free to centre without dragging a row
                          of icons along with it. Same 144px width as the
                          carousel, so all three columns line up. */}
                      <div className="mt-3 flex w-36 items-center justify-center gap-2">
                        {CONTACTS.map(({ label, href, Mark }) => {
                          const external = !href.startsWith("mailto:");
                          return (
                            <a
                              key={label}
                              href={href}
                              /* a mailto: opens a mail client, so a new tab
                                 would only leave a blank one behind */
                              target={external ? "_blank" : undefined}
                              rel={external ? "noreferrer noopener" : undefined}
                              aria-label={label}
                              title={label}
                              className={`flex h-9 w-9 items-center justify-center border-2 border-black bg-paper/10 transition-colors duration-200 hover:bg-glow-500/25 focus-visible:bg-glow-500/25 active:translate-y-px ${NAME}`}
                              style={{ boxShadow: BEVEL }}
                            >
                              <Mark />
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* sm:self-center sits the bio against the middle of the
                        photo column rather than its top. Scoped to sm and up:
                        stacked on a narrow screen there is no spare height to
                        centre within, and align-self would only pull the
                        column in horizontally. The text itself stays ranged
                        left. */}
                    <div className={`space-y-3 text-[0.9rem] leading-[1.6] sm:self-center ${BODY}`}>
                      <p>
                        Hi! I&rsquo;m <span className={NAME}>Kam</span>, welcome to my (WIP)
                        portfolio!
                      </p>
                      <p>
                        I&rsquo;m a Computer Science &amp; Finance student at the University of
                        Waterloo, graduating in 2028.
                      </p>
                      <p>
                        In my free time I love running, Taekwondo and impromptu 2am jam
                        sessions on pianos around campus!
                      </p>
                      <p className={NAME}>Take a look around!</p>
                    </div>
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
