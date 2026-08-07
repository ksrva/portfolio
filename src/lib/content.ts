/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT EVERYTHING HERE.
 *  This is the only file you need to touch to change the site's
 *  words. Nothing below is design code — it's all your content.
 * ─────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Kam",
  fullName: "Kamakshi Sarvananthan",
  role: "Software · Data · Machine Learning",
  location: "Waterloo, Ontario",
  email: "k3sarvan@uwaterloo.ca",
  tagline: "I build systems that turn messy data into something you can trust.",
  /** Shown under the name in the hero. Keep it to ~2 short lines. */
  heroLine:
    "Engineer and researcher working at the seam between data infrastructure and machine learning — record linkage, evaluation systems, and the unglamorous plumbing that makes models honest.",
  socials: [
    { label: "GitHub", href: "https://github.com/ksrva", handle: "@ksrva" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ksarvananthan/", handle: "in/ksarvananthan" },
    { label: "Email", href: "mailto:k3sarvan@uwaterloo.ca", handle: "k3sarvan@uwaterloo.ca" },
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
    org: "Triple",
    role: "Software Engineer Intern",
    period: "May — Aug 2026",
    location: "Toronto, ON",
    blurb:
      "Architected an end-to-end Raiser's Edge NXT integration — OAuth 2.0 onboarding, two-way record sync, and an embedded add-in surfacing matches inside the CRM — replacing engineer-assisted setup. Built a probabilistic linkage pipeline over DuckDB resolving 66% of matches at 95% precision across 100K+ record datasets, and the Stripe payments architecture behind it with a Postgres credit ledger.",
    stack: ["Python", "DuckDB", "Postgres", "Stripe", "Splink"],
  },
  {
    org: "CPP Investments",
    role: "Software Engineer Intern, Cloud Infrastructure",
    period: "Sep — Dec 2025",
    location: "Toronto, ON",
    blurb:
      "Built an MVP for AI-powered incident alerting on AWS Lambda and CloudWatch, pairing real-time alerts with LLM summarisation to draft incident reports for on-call engineers. Shipped an observability pipeline into QuickSight for equity-trading refresh performance, and prototyped an AIOps agent for root-cause analysis across distributed logs.",
    stack: ["AWS Lambda", "CloudWatch", "QuickSight", "Python", "LLMs"],
  },
  {
    org: "Theory Ventures",
    role: "Data Engineer Intern, Signals Intelligence",
    period: "Jan — Apr 2025",
    location: "San Francisco, CA",
    blurb:
      "Built LLM-powered enrichment and summarisation pipelines exposed through a REST API over PostgreSQL, automating most of the manual tagging in market-intelligence work. Re-architected a legacy microservice from VMs onto Cloud Run with CI/CD in GitHub Actions, cutting deployment time 60%.",
    stack: ["Python", "PostgreSQL", "GCP", "Hasura", "GraphQL"],
  },
  {
    org: "Litens Automotive",
    role: "DevOps Engineer Intern, Business Systems",
    period: "May — Aug 2024",
    location: "Woodbridge, ON",
    blurb:
      "Led a refactor of a legacy database schema and the SQL behind compliance reporting, improving query performance 15%. Built an asset-forecasting dashboard that cut licence over-allocation 20% and extended forecast visibility from one week to over three months.",
    stack: ["Python", "SQL", "Power BI", "Selenium"],
  },
  {
    org: "Canadian STEM & AI Academy",
    role: "Software Development Intern",
    period: "Sep 2022 — Jan 2023",
    location: "Markham, ON",
    blurb:
      "Optimised React component rendering with memoisation, cutting re-renders and improving performance 15%. Integrated API endpoints with Axios, improving data-retrieval efficiency 30% and reducing load times.",
    stack: ["React", "JavaScript", "Axios"],
  },
  {
    org: "WatStreet",
    role: "Project Lead, Quant Finance",
    period: "2025 — present",
    location: "Waterloo, ON",
    blurb:
      "Leading an extension to the HAR-RV volatility model that adds order-sensitive encodings to capture directional effects in realised volatility, resolving symmetry limitations in the traditional formulation. Built a modular decomposition framework using dynamic interval averaging and regime-dependent parameterisation.",
    stack: ["Python", "NumPy", "Pandas"],
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
