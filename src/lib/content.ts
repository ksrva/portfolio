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
  /** Year the entry anchors under. Consecutive jobs sharing one become a
      single group, so the rail prints each year once. */
  year: string;
  /** Months only — the year already sits in the ledger's margin. */
  span: string;
  period: string;
  location?: string;
  /** Just the city. Set beside the role, where "Toronto, ON" would read as
      one comma too many. */
  city?: string;
  /** The company's own site. Optional on purpose — the org name turns into a
      link only where one is set, so an entry without a site still renders. */
  href?: string;
  /** One line, 15–20 words. What the timeline actually shows. */
  highlight: string;
  /** A distinction worth setting apart from the sentence rather than buried
      inside it, the same way a project's award line is. */
  note?: string;
  /** Volunteer/extracurricular entries stay out of the experience timeline,
      which is co-op roles only. */
  kind?: "volunteer";
  /** Long form, kept for anywhere that wants the full account. */
  blurb: string;
  stack?: readonly string[];
};

export const work: readonly Job[] = [
  {
    org: "Northside Ventures",
    href: "https://www.northside.ventures/",
    city: "Toronto",
    year: "2026",
    span: "May–present",
    role: "AI Product Engineer, Part-time",
    period: "May 2026 — present",
    location: "Toronto, ON",
    highlight: "Building Leif! In-house AI Analyst.",
    blurb:
      "Replaced a serial LinkedIn scraping agent with a batched Clay API pipeline, raising throughput from one profile per 45 seconds to 100 profiles per request. Designed a query-time outreach ranking layer over the Affinity CRM that reconciles contact timestamps to surface overdue founders, replacing manual CRM searches with a continuously prioritised follow-up queue. Shipped an event-driven pipeline converting forwarded pitch decks into structured investment memo drafts through idempotent webhook ingestion, multimodal PDF processing and asynchronous cited research, reducing manual memo setup by about 85% to a single forwarded email. Built a stateful sourcing review queue with bulk founder actions, persistent review state and score overrides propagated back into Affinity, replacing a weekly email workflow and saving analysts one to two hours a week.",
    stack: ["Clay API", "Affinity CRM", "Webhooks", "LLMs"],
  },
  {
    org: "Triple",
    href: "https://www.usetriple.com/",
    city: "Toronto",
    year: "2026",
    span: "May–Aug",
    role: "Software Engineer Intern",
    period: "May — Aug 2026",
    location: "Toronto, ON",
    highlight:
      "Built the probabilistic entity-resolution pipeline powering constituent deduplication across the product.",
    blurb:
      "Architected an end-to-end Raiser's Edge NXT integration: OAuth 2.0 onboarding, two-way record sync, and an embedded add-in surfacing matches inside the CRM, replacing engineer-assisted setup. Built the probabilistic linkage pipeline over DuckDB that backs it and entity resolution elsewhere in the product, plus the Stripe payments architecture with a Postgres credit ledger.",
    stack: ["Python", "DuckDB", "Postgres", "Stripe", "Splink"],
  },
  {
    org: "WatStreet",
    city: "Waterloo",
    kind: "volunteer",
    year: "2025",
    span: "Ongoing",
    role: "Project Lead, Quant Finance",
    period: "2025 — present",
    location: "Waterloo, ON",
    highlight:
      "Extending the HAR-RV volatility model with order-sensitive encodings, capturing directional effects that symmetric formulations miss.",
    blurb:
      "Leading an extension to the HAR-RV volatility model that adds order-sensitive encodings to capture directional effects in realised volatility, resolving symmetry limitations in the traditional formulation. Built a modular decomposition framework using dynamic interval averaging and regime-dependent parameterisation.",
    stack: ["Python", "NumPy", "Pandas"],
  },
  {
    org: "CPP Investments",
    href: "https://www.cppinvestments.com/",
    city: "Toronto",
    year: "2025",
    span: "Sep–Dec",
    role: "Software Engineer Intern, Cloud Infrastructure",
    period: "Sep — Dec 2025",
    location: "Toronto, ON",
    highlight: "Observability for equity-trading data.",
    blurb:
      "Built an MVP for AI-powered incident alerting on AWS Lambda and CloudWatch, pairing real-time alerts with LLM summarisation to draft incident reports for on-call engineers. Shipped an observability pipeline into QuickSight for equity-trading refresh performance, and prototyped an AIOps agent for root-cause analysis across distributed logs.",
    stack: ["AWS Lambda", "CloudWatch", "QuickSight", "Python", "LLMs"],
  },
  {
    org: "Theory Ventures",
    href: "https://theoryvc.com/",
    city: "San Francisco",
    year: "2025",
    span: "Jan–Apr",
    role: "Data Engineer Intern, Signals Intelligence",
    period: "Jan — Apr 2025",
    location: "San Francisco, CA",
    highlight: "Built the multi-source enrichment layer powering downstream investor tooling.",
    blurb:
      "Built LLM-powered enrichment and summarisation pipelines exposed through a REST API over PostgreSQL, automating most of the manual tagging in market-intelligence work. Re-architected a legacy microservice from VMs onto Cloud Run with CI/CD in GitHub Actions, cutting deployment time 60%.",
    stack: ["Python", "PostgreSQL", "GCP", "Hasura", "GraphQL"],
  },
  {
    org: "Litens Automotive",
    href: "https://www.litens.com/",
    city: "Woodbridge",
    year: "2024",
    span: "May–Aug",
    role: "DevOps Engineer Intern, Business Systems",
    period: "May — Aug 2024",
    location: "Woodbridge, ON",
    highlight: "Built an inventory-forecasting dashboard.",
    blurb:
      "Led a refactor of a legacy database schema and the SQL behind compliance reporting, improving query performance 15%. Built an inventory-forecasting dashboard that cut over-allocation 20% and extended forecast visibility from one week to over three months.",
    stack: ["Python", "SQL", "Power BI", "Selenium"],
  },
] as const;

/** Research — papers and reading programs. Kept as its own list rather than
    another `kind` on Job, because these have no span, no city and no employer;
    forcing them into the co-op shape would mean leaving half of it blank. */
export type Paper = {
  title: string;
  /** Who it was done with. */
  org: string;
  /** The part played in it, where that is worth naming. */
  role?: string;
  /** The programme it sat under, where there was one. */
  program?: string;
  /** Where it stands, not what it claims. */
  status?: string;
  /** One line on what it actually does. Optional — better empty than filled
      with a description inferred from the title. */
  blurb?: string;
  /** The group's or programme's own site. This hangs off the org name rather
      than the title on purpose: neither link points at the paper itself, and
      a linked title would read as "click to read it". */
  href?: string;
};

export const research: readonly Paper[] = [
  {
    /* Titled from the paper itself, not its filename — the PDF arrived as
       "On_the_Volatility_Prediction_of_the_HAR_RV_Model", which is not what
       the paper is called. Five authors, Waterloo, dated 15 March 2025. */
    title: "Using Prime Modulo Classes to Improve the HAR-RV Model",
    org: "WatStreet",
    role: "Project Lead",
    status: "Pending journal submission",
    href: "https://watstreet.netlify.app/",
  },
  {
    title: "Evaluating the Efficiency and Security of Blockchain Consensus Models",
    org: "Women in Math",
    program: "Directed Reading Program",
    href: "https://uwaterloo.ca/women-in-mathematics/past-drp-projects",
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
  /** a screenshot for the card, relative to /projects */
  image?: string;
  /** shown under "Older projects" rather than in the main grid */
  older?: boolean;
  /** a prize or placing, set apart from the blurb so it can carry weight */
  award?: string;
};

/* Empty on purpose. The entries that were here were invented — placeholder
   titles with repo links pointing at a bare github.com — and a portfolio
   claiming work that doesn't exist is worse than one admitting it's still
   being built. The room says so until there's something real to hang in it.

   Adding one back is just an entry here: the room renders the ledger again
   the moment this array isn't empty. */
export const projects: readonly Project[] = [
  {
    title: "memo",
    year: "2026",
    kind: "Chrome extension",
    blurb: "A way to consolidate and search your annotations.",
    stack: ["TypeScript", "Chrome MV3", "Python", "FastAPI", "SQLite", "sqlite-vec"],
    repo: "https://github.com/ksrva/memo",
    image: "memo.jpg",
  },
  {
    title: "chords",
    year: "2026",
    kind: "Audio analysis",
    blurb:
      "Chord and key detection built from first principles, with transposition to the keys you sing best.",
    stack: ["Python", "NumPy"],
    repo: "https://github.com/ksrva/chords",
    image: "chords.jpg",
  },
  {
    title: "Camp-Us",
    year: "2023",
    kind: "Hackathon",
    /* Describes the prototype that exists, not the pitch. The repo is four
       Android screens and a flow — campus, start, destination, notify — with
       no location, notification or network code behind them. Calling it a
       working safety app would send anyone who clicks through to a login
       with a hardcoded password and an empty results screen. */
    blurb:
      "An Android prototype for finding someone to walk home with after dark.",
    award: "Won Best UI/UX at TechNova 2023.",
    stack: ["Java", "Android Studio", "XML", "Figma"],
    /* Devpost rather than the repo: it carries the source link and the Figma
       file together, which is more than either link gives on its own. */
    href: "https://devpost.com/software/camp-us-jaqs50",
    older: true,
  },
  {
    title: "Study Buddy",
    year: "2024",
    kind: "Hackathon",
    /* Describes what the repo actually implements. chatbot.py is a real
       delegation pattern: GPT-4o answers conversationally, but is instructed
       to emit a Wolfram query when a question is computational and hand off.
       The Flask app exposes two endpoints behind that, and the Next.js side
       has genuine chat, practice and questions pages. */
    blurb:
      "A study chatbot that routes calculations to Wolfram Alpha and conversation to GPT-4o.",
    stack: ["TypeScript", "Next.js", "Python", "Flask", "OpenAI", "Wolfram Alpha"],
    /* Devpost rather than the repo, as with Camp-Us: it carries the source and
       the Figma file together, and the repo itself lives under a teammate's
       account rather than mine. */
    href: "https://devpost.com/software/study-buddy-75yde3",
    older: true,
  },
  {
    title: "Risky Portfolio Generator",
    year: "2023",
    kind: "Coursework",
    /* Written from the notebook, not from memory of it. The earlier pitch for
       this one — "40% less risk than the S&P 500 over 200k+ iterations" — does
       not describe the code: the strategy is explicitly "Risky" and maximises
       volatility rather than reducing it, the weightings are three hand-picked
       allocations (the function comparing them is commented out) rather than a
       Monte Carlo sweep, and no S&P benchmark appears anywhere. The holdings
       are Canadian large-caps. Claiming the opposite of what the code does is
       the one thing a portfolio really cannot afford. */
    blurb:
      "Builds a deliberately high-risk, anti-diversified ten-stock portfolio. Team assignment.",
    stack: ["Python", "pandas", "NumPy", "yfinance"],
    repo: "https://github.com/ksrva/risky-portfolio-generator",
    older: true,
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
