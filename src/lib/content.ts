/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT EVERYTHING HERE.
 *  This is the only file you need to touch to change the site's
 *  words. Nothing below is design code — it's all your content.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Kamakshi",
  fullName: "Kamakshi S.",
  role: "Software · Data · Machine Learning",
  location: "Waterloo, Ontario",
  email: "kamakshis230@gmail.com",
  tagline: "I build systems that turn messy data into something you can trust.",
  /** Shown under the name in the hero. Keep it to ~2 short lines. */
  heroLine:
    "Engineer and researcher working at the seam between data infrastructure and machine learning — record linkage, evaluation systems, and the unglamorous plumbing that makes models honest.",
  socials: [
    { label: "GitHub", href: "https://github.com/", handle: "@kamakshi" },
    { label: "LinkedIn", href: "https://linkedin.com/in/", handle: "in/kamakshi" },
    { label: "Email", href: "mailto:kamakshis230@gmail.com", handle: "kamakshis230@gmail.com" },
  ],
} as const;

export const nav = [
  { label: "Work", href: "#work" },
  { label: "Projects", href: "#projects" },
  { label: "Writing", href: "#writing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

/** The "about" panel — written as a few short paragraphs. */
export const about = {
  heading: "Come in, it's warm",
  body: [
    "Right now I'm a computer science student at the University of Waterloo, somewhere between a terminal and a very large spreadsheet. I care about the parts of a system nobody photographs: the record linkage that decides two rows are the same person, the evaluation harness that catches a model quietly getting worse, the schema that stops a bug three months before it happens.",
    "Most of my work lives in Python and TypeScript, with detours into whatever a problem demands. I like reading old papers — Fellegi–Sunter still holds up — and I like shipping the small, sturdy version first.",
    "Off-screen: strong coffee, longer books, and a running argument with myself about typography.",
  ],
  /** Little "on the table" details rendered as a list beside the text. */
  currently: [
    { label: "Reading", value: "Theory for Record Linkage, Fellegi & Sunter" },
    { label: "Building", value: "An LLM adjudicator for ambiguous entity matches" },
    { label: "Learning", value: "Rust, slowly and badly" },
    { label: "Open to", value: "Winter 2027 co-op — data / ML / backend" },
  ],
} as const;

/** Experience — most recent first. */
export type Job = {
  org: string;
  role: string;
  period: string;
  location?: string;
  blurb: string;
  stack?: readonly string[];
};

export const work: readonly Job[] = [
  {
    org: "Company Name",
    role: "Software Engineering Intern",
    period: "May — Aug 2026",
    location: "Toronto, ON",
    blurb:
      "Replace this with what you actually did — one sentence on the problem, one on what you built, one on the result with a number in it if you have one.",
    stack: ["Python", "Postgres", "Airflow"],
  },
  {
    org: "Research Group / Lab",
    role: "Undergraduate Research Assistant",
    period: "Jan — Apr 2026",
    location: "Waterloo, ON",
    blurb:
      "Probabilistic record linkage across heterogeneous administrative datasets; built the evaluation harness the rest of the team used to compare matchers.",
    stack: ["Python", "scikit-learn", "DuckDB"],
  },
  {
    org: "Earlier Role",
    role: "Title",
    period: "2025",
    location: "Remote",
    blurb: "One line. Keep these tight — the reader is scanning, not studying.",
    stack: ["TypeScript", "React"],
  },
] as const;

/** Projects. These render as lit windows in a building facade. */
export type Project = {
  title: string;
  year: string;
  kind: string;
  blurb: string;
  stack: readonly string[];
  href?: string;
  repo?: string;
};

export const projects: readonly Project[] = [
  {
    title: "LLM Adjudicator",
    year: "2026",
    kind: "Research tool",
    blurb:
      "A judge that resolves the record pairs a probabilistic matcher can't decide alone — with calibration checks so it never quietly becomes the whole pipeline.",
    stack: ["Python", "Claude API", "DuckDB"],
    repo: "https://github.com/",
  },
  {
    title: "Linkage Bench",
    year: "2026",
    kind: "Evaluation harness",
    blurb:
      "Reproducible benchmarks for entity resolution: fixed splits, per-block precision/recall, and a regression gate that fails the build when a matcher degrades.",
    stack: ["Python", "Polars", "GitHub Actions"],
    repo: "https://github.com/",
  },
  {
    title: "Tigris",
    year: "2025",
    kind: "Product / analysis",
    blurb:
      "Market and risk analysis for an early-stage venture, plus the internal tooling that kept the model and the memo in sync.",
    stack: ["TypeScript", "Next.js"],
  },
  {
    title: "This Website",
    year: "2026",
    kind: "Playground",
    blurb:
      "A hand-drawn night scene in SVG — no images, no canvas, roughly 40kb of vectors and a lot of opinions about colour.",
    stack: ["Next.js", "Motion", "SVG"],
    repo: "https://github.com/",
  },
] as const;

/** Writing / notes. Delete the section in page.tsx if you don't want it. */
export type Post = {
  title: string;
  date: string;
  blurb: string;
  href?: string;
};

export const writing: readonly Post[] = [
  {
    title: "Fellegi–Sunter is still the right default",
    date: "Mar 2026",
    blurb:
      "Why a 1969 paper beats most modern embeddings for record linkage, and the two places it genuinely falls over.",
  },
  {
    title: "Your eval set is a product decision",
    date: "Jan 2026",
    blurb:
      "Every choice about what goes in the test set is a claim about what the system is for. Make the claim out loud.",
  },
  {
    title: "Notes on reading old papers",
    date: "Nov 2025",
    blurb: "A short defence of primary sources, written mostly to convince myself.",
  },
] as const;
