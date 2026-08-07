import { makeRng, round } from "@/lib/rand";

/* ═══════════════════════════════════════════════════════════════════
   A winter square, drawn crisp. 1600 × 900.

   Engraved rather than painted — no filters, no bleed. What sells this
   style is (a) many narrow buildings at different heights with genuinely
   different rooflines, and (b) fine light-on-dark linework: mullions,
   string courses, quoins, garlands, and snow on every single ledge.

     y 0    ─── night sky, stars, snow
     y 150  ─── the tallest spires
     y 300  ─── most rooflines
     y 646  ─── shop fascias
     y 672  ─── lit shopfronts
     y 814  ─── snow underfoot
   ═══════════════════════════════════════════════════════════════════ */

export const VB = { w: 1600, h: 900 } as const;

const SHOP_TOP = 672;
const GROUND = 814;

export const HOTSPOTS = {
  studio: { x: 508, y: 338, w: 132, h: 162 },
  drafting: { x: 960, y: 338, w: 132, h: 162 },
  cafe: { x: 58, y: SHOP_TOP, w: 330, h: GROUND - SHOP_TOP },
  door: { x: 700, y: 632, w: 200, h: GROUND - 632 },
  bookshop: { x: 1242, y: SHOP_TOP, w: 330, h: GROUND - SHOP_TOP },
} as const;

/* ────────────────────────────────────────────────────────────────── */
/*  Palettes — deep and saturated, never black                        */
/* ────────────────────────────────────────────────────────────────── */

type Pal = { body: string; shade: string; lit: string; line: string; roof: string };

const MOSS: Pal   = { body: "#1f2723", shade: "#141a17", lit: "#2a332e", line: "#566259", roof: "#0c100e" };
const CLARET: Pal = { body: "#2e211f", shade: "#1d1514", lit: "#3a2a27", line: "#6e5450", roof: "#150f0e" };
const SEPIA: Pal  = { body: "#362c23", shade: "#221b15", lit: "#443729", line: "#7a6549", roof: "#1a140f" };
const BROWN: Pal  = { body: "#2f2620", shade: "#1e1815", lit: "#3b3129", line: "#6d5c49", roof: "#16110d" };

/* Flat window light — no gradient. In this style the panes are one muted
   warm value, and all the depth comes from the linework around them. */
const PANE = "#e0bb7a";
const PANE_DEEP = "#c69a55";
const PANE_DIM = "#9e7c46";
/* shopfront glass sits a stop darker than the flats above it */
const PANE_SHOP = "#c2a066";
const PANE_SHOP_DIM = "#a8874f";

const GOLD = "#e8b45c";
const SNOW = "#ccd2d0";

/* ────────────────────────────────────────────────────────────────── */

export function Defs() {
  return (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#080d10" />
        <stop offset="42%" stopColor="#0d1418" />
        <stop offset="78%" stopColor="#141d20" />
        <stop offset="100%" stopColor="#1e282a" />
      </linearGradient>
      <linearGradient id="pane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe1a4" />
        <stop offset="100%" stopColor="#e5a248" />
      </linearGradient>
      <linearGradient id="paneDeep" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f7c477" />
        <stop offset="100%" stopColor="#cf8536" />
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0%" stopColor="#e8c78d" stopOpacity="0.32" />
        <stop offset="45%" stopColor="#c9a163" stopOpacity="0.09" />
        <stop offset="100%" stopColor="#f0a94e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glowWide">
        <stop offset="0%" stopColor="#ffcf85" stopOpacity="0.26" />
        <stop offset="100%" stopColor="#f0a94e" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9ba1a1" />
        <stop offset="55%" stopColor="#848a8a" />
        <stop offset="100%" stopColor="#6a7071" />
      </linearGradient>
    </defs>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sky                                                               */
/* ────────────────────────────────────────────────────────────────── */

export function Sky() {
  const rng = makeRng(2026);
  return (
    <g>
      <rect x="-120" y="-120" width="1840" height="700" fill="url(#sky)" />
      {Array.from({ length: 170 }, (_, i) => (
        <circle
          key={i}
          cx={round(rng.range(-60, 1660))}
          cy={round(rng.range(-40, 470))}
          r={round(rng.range(0.6, 2.1))}
          fill="#dfe9f5"
          opacity={round(rng.range(0.2, 0.9))}
        />
      ))}
      {/* four-pointed sparkles, the way the old cards drew them */}
      {Array.from({ length: 16 }, (_, i) => {
        const cx = round(rng.range(20, 1580));
        const cy = round(rng.range(10, 310));
        const s = round(rng.range(3, 7));
        return (
          <path
            key={`s${i}`}
            d={`M ${cx} ${cy - s} Q ${cx} ${cy} ${cx + s} ${cy} Q ${cx} ${cy} ${cx} ${cy + s} Q ${cx} ${cy} ${cx - s} ${cy} Q ${cx} ${cy} ${cx} ${cy - s} Z`}
            fill="#f2f7ff"
            opacity={round(rng.range(0.45, 0.9))}
          />
        );
      })}
      <circle cx="1372" cy="112" r="128" fill="url(#glowWide)" opacity="0.5" />
      <circle cx="1372" cy="112" r="34" fill="#c8cbc2" />
      <circle cx="1362" cy="118" r="34" fill="#a8ada4" opacity="0.45" />
    </g>
  );
}

export function Snowfall({ count = 150 }: { count?: number }) {
  const rng = makeRng(515);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={round(rng.range(-60, 1660))}
          cy={round(rng.range(-60, 20))}
          r={round(rng.range(1.2, 3.4))}
          fill={SNOW}
          className="anim-snow-street"
          style={{
            ["--dur" as string]: `${round(rng.range(12, 30))}s`,
            ["--dx" as string]: `${round(rng.range(-80, 60))}px`,
            ["--o" as string]: `${round(rng.range(0.4, 0.95))}`,
            animationDelay: `-${round(rng.range(0, 30))}s`,
          }}
        />
      ))}
    </g>
  );
}

/** Snow lying along a ledge — lumpy, never a straight white bar. */
function Cap({ x, y, w, h = 5 }: { x: number; y: number; w: number; h?: number }) {
  const n = Math.max(2, Math.round(w / 26));
  const seg = w / n;
  let d = `M ${round(x)} ${round(y + h)}`;
  for (let i = 0; i < n; i++) {
    d += ` q ${round(seg * 0.3)} ${round(-h * 1.75)} ${round(seg * 0.62)} ${round(-h * 0.15)} q ${round(seg * 0.2)} ${round(h * 0.4)} ${round(seg * 0.38)} ${round(h * 0.15)}`;
  }
  d += ` L ${round(x + w)} ${round(y + h)} Z`;
  return <path d={d} fill={SNOW} />;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Windows — the fine linework lives here                            */
/* ────────────────────────────────────────────────────────────────── */

function archD(x: number, y: number, w: number, h: number, arch: boolean) {
  if (!arch) return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  const r = Math.min(w / 2, h * 0.3);
  return `M ${x} ${y + h} L ${x} ${round(y + r)} A ${round(w / 2)} ${round(r)} 0 0 1 ${x + w} ${round(y + r)} L ${x + w} ${y + h} Z`;
}

type WinP = {
  x: number;
  y: number;
  w: number;
  h: number;
  pal: Pal;
  lit?: boolean;
  arch?: boolean;
  cols?: number;
  rows?: number;
  deep?: boolean;
  dim?: boolean;
  figure?: boolean;
  snow?: boolean;
};

export function Win({
  x,
  y,
  w,
  h,
  pal,
  lit = true,
  arch = false,
  cols = 2,
  rows = 3,
  deep = false,
  dim = false,
  figure = false,
  snow = true,
}: WinP) {
  const r = arch ? Math.min(w / 2, h * 0.32) : 0;
  const glass = lit ? (dim ? PANE_DIM : deep ? PANE_DEEP : PANE) : pal.shade;
  return (
    <g>
      {lit && <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 1.9} ry={h * 1.3} fill="url(#glow)" />}

      <path d={archD(x - 4, y - 4, w + 8, h + 7, arch)} fill={pal.shade} />
      <path d={archD(x, y, w, h, arch)} fill={glass} />
      {!lit && <path d={`M ${x} ${round(y + r)} L ${x + w} ${round(y + r)} L ${x} ${y + h} Z`} fill={pal.lit} opacity="0.45" />}

      {lit && figure && (
        <g fill={pal.roof} opacity="0.78">
          <circle cx={round(x + w * 0.5)} cy={round(y + h * 0.44)} r={round(w * 0.14)} />
          <path
            d={`M ${round(x + w * 0.24)} ${y + h} q ${round(w * 0.09)} ${round(-h * 0.4)} ${round(w * 0.26)} ${round(-h * 0.4)} q ${round(w * 0.17)} 0 ${round(w * 0.26)} ${round(h * 0.4)} Z`}
          />
        </g>
      )}

      {/* Glazing bars at hairline weight, and a lot of them. The density of
          these lines is the difference between this and a flat block. */}
      <g stroke={pal.roof} fill="none" strokeWidth="0.9" opacity="0.95">
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`c${i}`} x1={round(x + ((i + 1) * w) / cols)} y1={round(y + r * 0.4)} x2={round(x + ((i + 1) * w) / cols)} y2={y + h} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`r${i}`} x1={x} y1={round(y + r + ((i + 1) * (h - r)) / rows)} x2={x + w} y2={round(y + r + ((i + 1) * (h - r)) / rows)} />
        ))}
      </g>
      <path d={archD(x, y, w, h, arch)} fill="none" stroke={pal.roof} strokeWidth="1.7" />
      <path d={archD(x - 4, y - 4, w + 8, h + 7, arch)} fill="none" stroke={pal.line} strokeWidth="0.8" opacity="0.8" />

      {/* sill carried on two small corbels */}
      <rect x={x - 7} y={round(y + h + 3)} width={w + 14} height="3" fill={pal.line} opacity="0.9" />
      <rect x={x - 4} y={round(y + h + 6)} width={w + 8} height="1.1" fill={pal.roof} opacity="0.7" />
      {[x + 2, x + w - 5].map((bx, i) => (
        <rect key={i} x={bx} y={round(y + h + 7)} width="3" height="4" fill={pal.line} opacity="0.6" />
      ))}
      {snow && <Cap x={x - 7} y={round(y + h + 1)} w={w + 14} h={3} />}
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Ornament                                                          */
/* ────────────────────────────────────────────────────────────────── */

function Garland({ x, y, w, seed = 1 }: { x: number; y: number; w: number; seed?: number }) {
  const rng = makeRng(seed);
  const sag = w * 0.2;
  const n = Math.max(4, Math.round(w / 15));
  return (
    <g>
      <path d={`M ${x} ${y} Q ${round(x + w / 2)} ${round(y + sag)} ${x + w} ${y}`} fill="none" stroke="#1d4029" strokeWidth="7" strokeLinecap="round" />
      <path d={`M ${x} ${y} Q ${round(x + w / 2)} ${round(y + sag)} ${x + w} ${y}`} fill="none" stroke="#2c5c38" strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        return (
          <circle
            key={i}
            cx={round(x + t * w)}
            cy={round(y + sag * 2 * t * (1 - t))}
            r={2.4}
            fill={rng.chance(0.5) ? GOLD : "#c9453a"}
          />
        );
      })}
    </g>
  );
}

function Wreath({ cx, cy, r = 15 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1d4029" strokeWidth={r * 0.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2c5c38" strokeWidth={r * 0.22} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={round(cx + r * Math.cos((a * Math.PI) / 180))} cy={round(cy + r * Math.sin((a * Math.PI) / 180))} r={2.2} fill="#c9453a" />
      ))}
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Rooflines — what stops a row of buildings looking like a bar chart */
/* ────────────────────────────────────────────────────────────────── */

type Roof = "step" | "spire" | "mansard" | "gable" | "turret" | "balustrade" | "grand";

function Roofline({ x, w, y, pal, kind, seed }: { x: number; w: number; y: number; pal: Pal; kind: Roof; seed: number }) {
  const rng = makeRng(seed);
  const cx = round(x + w / 2);

  if (kind === "grand") {
    const bw = 190;
    return (
      <g>
        {/* mansard shoulders either side */}
        <path d={`M ${x - 10} ${y} L ${round(x + 26)} ${y - 54} L ${round(x + w - 26)} ${y - 54} L ${x + w + 10} ${y} Z`} fill={pal.roof} />
        <Cap x={round(x + 22)} y={y - 58} w={round(w - 44)} h={5} />
        {[0.16, 0.84].map((t, i) => {
          const dx = round(x + w * t);
          return (
            <g key={i}>
              <path d={`M ${dx - 21} ${y - 4} L ${dx - 14} ${y - 46} L ${dx + 14} ${y - 46} L ${dx + 21} ${y - 4} Z`} fill={pal.body} />
              <rect x={dx - 10} y={y - 40} width="20" height="30" fill={rng.chance(0.7) ? PANE : pal.shade} />
              <rect x={dx - 10} y={y - 40} width="20" height="30" fill="none" stroke={pal.roof} strokeWidth="1.5" />
              <line x1={dx} y1={y - 40} x2={dx} y2={y - 10} stroke={pal.roof} strokeWidth="0.9" />
              <Cap x={dx - 23} y={y - 50} w={46} h={4} />
            </g>
          );
        })}

        {/* the raised centre bay — this is what makes it the main house */}
        <rect x={round(cx - bw / 2)} y={y - 108} width={bw} height={112} fill={pal.body} />
        <rect x={round(cx - bw / 2)} y={y - 108} width="5" height={112} fill={pal.lit} opacity="0.5" />
        <rect x={round(cx + bw / 2 - 5)} y={y - 108} width="5" height={112} fill={pal.shade} />
        <path d={`M ${round(cx - bw / 2 - 14)} ${y - 104} L ${cx} ${y - 168} L ${round(cx + bw / 2 + 14)} ${y - 104} Z`} fill={pal.lit} />
        <path d={`M ${round(cx - bw / 2 - 14)} ${y - 104} L ${cx} ${y - 168} L ${round(cx + bw / 2 + 14)} ${y - 104}`} fill="none" stroke={pal.line} strokeWidth="1.2" opacity="0.7" />
        <path d={`M ${round(cx - bw / 2 - 14)} ${y - 104} L ${cx} ${y - 168}`} stroke={SNOW} strokeWidth="2.4" fill="none" opacity="0.8" />
        <rect x={round(cx - bw / 2 - 16)} y={y - 106} width={bw + 32} height="5" fill={pal.line} opacity="0.8" />

        {/* clock */}
        <circle cx={cx} cy={y - 130} r="19" fill={PANE} />
        <circle cx={cx} cy={y - 130} r="19" fill="none" stroke={pal.roof} strokeWidth="2.2" />
        <line x1={cx} y1={y - 130} x2={cx} y2={y - 141} stroke={pal.roof} strokeWidth="1.6" />
        <line x1={cx} y1={y - 130} x2={round(cx + 8)} y2={y - 125} stroke={pal.roof} strokeWidth="1.6" />
        {[0, 90, 180, 270].map((a) => (
          <circle key={a} cx={round(cx + 14 * Math.cos((a * Math.PI) / 180))} cy={round(y - 130 + 14 * Math.sin((a * Math.PI) / 180))} r="1.1" fill={pal.roof} />
        ))}

        {/* a pair of lit windows in the centre bay, below the clock */}
        {[-46, 46].map((dx, i) => (
          <Win key={i} x={round(cx + dx - 20)} y={y - 88} w={40} h={56} pal={pal} arch lit={i === 0 || rng.chance(0.7)} cols={2} rows={3} snow={false} />
        ))}

        <line x1={cx} y1={y - 168} x2={cx} y2={y - 192} stroke={GOLD} strokeWidth="2" opacity="0.85" />
        <circle cx={cx} cy={y - 195} r="3" fill={GOLD} opacity="0.85" />
        <rect x={x - 14} y={y - 6} width={w + 28} height="9" fill={pal.line} opacity="0.8" />
      </g>
    );
  }

  if (kind === "step") {
    const steps = 4;
    const sw = w / (steps * 2 + 1);
    let d = `M ${x - 6} ${y}`;
    for (let i = 0; i < steps; i++) {
      d += ` L ${round(x + i * sw)} ${round(y - 16 - i * 22)} L ${round(x + (i + 1) * sw)} ${round(y - 16 - i * 22)}`;
    }
    d += ` L ${round(cx - sw * 0.5)} ${round(y - 16 - steps * 22)} L ${round(cx + sw * 0.5)} ${round(y - 16 - steps * 22)}`;
    for (let i = steps - 1; i >= 0; i--) {
      d += ` L ${round(x + w - (i + 1) * sw)} ${round(y - 16 - i * 22)} L ${round(x + w - i * sw)} ${round(y - 16 - i * 22)}`;
    }
    d += ` L ${x + w + 6} ${y} Z`;
    return (
      <g>
        <path d={d} fill={pal.body} />
        <path d={d} fill="none" stroke={pal.line} strokeWidth="1.4" opacity="0.55" />
        {Array.from({ length: steps }, (_, i) => (
          <g key={i}>
            <Cap x={round(x + i * sw)} y={round(y - 20 - i * 22)} w={round(sw)} h={4} />
            <Cap x={round(x + w - (i + 1) * sw)} y={round(y - 20 - i * 22)} w={round(sw)} h={4} />
          </g>
        ))}
        <Cap x={round(cx - sw * 0.5)} y={round(y - 20 - steps * 22)} w={round(sw)} h={4} />
        <Win x={cx - 15} y={round(y - 74)} w={30} h={38} pal={pal} lit={rng.chance(0.7)} arch cols={2} rows={2} snow={false} />
      </g>
    );
  }

  if (kind === "spire" || kind === "turret") {
    const hgt = kind === "spire" ? 92 : 70;
    const bw = kind === "spire" ? w * 0.56 : w * 0.44;
    return (
      <g>
        <rect x={x - 4} y={y - 22} width={w + 8} height={24} fill={pal.roof} />
        <path d={`M ${round(cx - bw / 2)} ${y - 20} L ${cx} ${round(y - 20 - hgt)} L ${round(cx + bw / 2)} ${y - 20} Z`} fill={pal.lit} />
        <path d={`M ${cx} ${round(y - 20 - hgt)} L ${round(cx + bw / 2)} ${y - 20} L ${cx} ${y - 20} Z`} fill="#000" opacity="0.25" />
        <path d={`M ${round(cx - bw / 2)} ${y - 20} L ${cx} ${round(y - 20 - hgt)}`} stroke={SNOW} strokeWidth="2" fill="none" opacity="0.7" />
        <line x1={cx} y1={round(y - 20 - hgt)} x2={cx} y2={round(y - 34 - hgt)} stroke={GOLD} strokeWidth="2" opacity="0.8" />
        <circle cx={cx} cy={round(y - 36 - hgt)} r="2.6" fill={GOLD} opacity="0.8" />
        <rect x={cx - 8} y={round(y - 14 - hgt * 0.42)} width="16" height="22" rx="8" fill={rng.chance(0.7) ? PANE : pal.shade} />
        <rect x={cx - 8} y={round(y - 14 - hgt * 0.42)} width="16" height="22" rx="8" fill="none" stroke={pal.roof} strokeWidth="2" />
        <Cap x={x - 4} y={y - 26} w={w + 8} h={5} />
      </g>
    );
  }

  if (kind === "gable") {
    const hgt = 74;
    return (
      <g>
        <path d={`M ${x - 8} ${y} L ${cx} ${round(y - hgt)} L ${x + w + 8} ${y} Z`} fill={pal.body} />
        <path d={`M ${cx} ${round(y - hgt)} L ${x + w + 8} ${y} L ${cx} ${y} Z`} fill="#000" opacity="0.18" />
        <path d={`M ${x - 8} ${y} L ${cx} ${round(y - hgt)} L ${x + w + 8} ${y}`} fill="none" stroke={pal.line} strokeWidth="1.5" opacity="0.6" />
        <path d={`M ${x - 8} ${y} L ${cx} ${round(y - hgt)}`} stroke={SNOW} strokeWidth="2.5" fill="none" opacity="0.75" />
        <circle cx={cx} cy={round(y - hgt * 0.4)} r="15" fill={rng.chance(0.75) ? PANE : pal.shade} />
        <circle cx={cx} cy={round(y - hgt * 0.4)} r="15" fill="none" stroke={pal.roof} strokeWidth="3" />
        <line x1={cx - 15} y1={round(y - hgt * 0.4)} x2={cx + 15} y2={round(y - hgt * 0.4)} stroke={pal.roof} strokeWidth="2" />
        <line x1={cx} y1={round(y - hgt * 0.4 - 15)} x2={cx} y2={round(y - hgt * 0.4 + 15)} stroke={pal.roof} strokeWidth="2" />
      </g>
    );
  }

  if (kind === "mansard") {
    return (
      <g>
        <path d={`M ${x - 10} ${y} L ${round(x + 24)} ${y - 62} L ${round(x + w - 24)} ${y - 62} L ${x + w + 10} ${y} Z`} fill={pal.roof} />
        <Cap x={round(x + 20)} y={y - 66} w={round(w - 40)} h={5} />
        {[0.3, 0.7].map((t, i) => {
          const dx = round(x + w * t);
          return (
            <g key={i}>
              <path d={`M ${dx - 22} ${y - 4} L ${dx - 15} ${y - 50} L ${dx + 15} ${y - 50} L ${dx + 22} ${y - 4} Z`} fill={pal.body} />
              <rect x={dx - 11} y={y - 44} width="22" height="34" fill={rng.chance(0.65) ? PANE : pal.shade} />
              <rect x={dx - 11} y={y - 44} width="22" height="34" fill="none" stroke={pal.roof} strokeWidth="2.4" />
              <line x1={dx} y1={y - 44} x2={dx} y2={y - 10} stroke={pal.roof} strokeWidth="1.8" />
              <Cap x={dx - 24} y={y - 54} w={48} h={4} />
            </g>
          );
        })}
        <rect x={x - 14} y={y - 6} width={w + 28} height={9} fill={pal.line} opacity="0.8" />
      </g>
    );
  }

  return (
    <g>
      <rect x={x - 14} y={y - 8} width={w + 28} height={11} fill={pal.line} opacity="0.85" />
      <rect x={x - 10} y={y - 34} width={w + 20} height={4} fill={pal.line} opacity="0.8" />
      {Array.from({ length: Math.floor(w / 17) }, (_, i) => (
        <path key={i} d={`M ${round(x + 6 + i * 17)} ${y - 30} q -3 8 0 12 q 3 8 0 12`} stroke={pal.line} strokeWidth="3" fill="none" opacity="0.75" />
      ))}
      {[0.2, 0.8].map((t, i) => (
        <g key={i}>
          <rect x={round(x + w * t - 9)} y={y - 52} width="18" height="22" fill={pal.line} opacity="0.85" />
          <Cap x={round(x + w * t - 11)} y={y - 56} w={22} h={4} />
        </g>
      ))}
      <Cap x={x - 14} y={y - 12} w={w + 28} h={5} />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Buildings                                                         */
/* ────────────────────────────────────────────────────────────────── */

type Spec = {
  x: number;
  w: number;
  top: number;
  pal: Pal;
  roof: Roof;
  cols: number;
  seed: number;
  arch?: boolean;
  garlands?: boolean;
  main?: boolean;
};

const TOWN: Spec[] = [
  { x: -80, w: 510, top: 352, pal: BROWN, roof: "mansard", cols: 5, seed: 11, arch: true, garlands: true },
  // the main house: taller, wider, more bays, and the only "grand" roof
  { x: 430, w: 740, top: 254, pal: CLARET, roof: "grand", cols: 8, seed: 44, arch: true, garlands: true, main: true },
  { x: 1170, w: 510, top: 338, pal: MOSS, roof: "step", cols: 5, seed: 77, arch: true, garlands: true },
];

const FASCIA = 646;

function Building({ s }: { s: Spec }) {
  const rng = makeRng(s.seed);
  const { x, w, top, pal } = s;

  // Small windows, many of them, tightly stacked. Density is what reads as
  // fine linework — big windows read as blocks however thin the stroke is.
  const rowH = 74;
  const first = top + 32;
  const rowCount = Math.max(3, Math.floor((FASCIA - 26 - first) / rowH));
  const bay = (w - 20) / s.cols;
  const winW = Math.max(26, Math.min(bay * 0.54, 46));
  const winH = 48;

  return (
    <g>
      <rect x={x} y={top - 4} width={w} height={GROUND - top + 4} fill={pal.body} />
      <rect x={x} y={top - 4} width={7} height={GROUND - top + 4} fill={pal.lit} opacity="0.55" />
      <rect x={x + w - 6} y={top - 4} width={6} height={GROUND - top + 4} fill={pal.shade} />

      {/* hairline pilasters dividing the bays */}
      {Array.from({ length: s.cols - 1 }, (_, i) => (
        <rect key={i} x={round(x + 10 + bay * (i + 1))} y={top + 6} width="1" height={FASCIA - top - 10} fill={pal.line} opacity="0.2" />
      ))}
      {/* quoins down the party wall */}
      {Array.from({ length: Math.floor((GROUND - top) / 26) }, (_, i) => (
        <rect key={i} x={x + w - 13} y={round(top + 4 + i * 26)} width={13} height={13} fill={pal.lit} opacity="0.26" />
      ))}

      <Roofline x={x} w={w} y={top} pal={pal} kind={s.roof} seed={s.seed + 5} />

      {Array.from({ length: rowCount }, (_, r) => {
        const wy = round(first + r * rowH);
        return (
          <g key={r}>
            {/* a double hairline string course, on a run of little corbels */}
            <rect x={x} y={round(wy + winH + 20)} width={w} height="1.4" fill={pal.line} opacity="0.45" />
            <rect x={x} y={round(wy + winH + 24)} width={w} height="0.9" fill={pal.line} opacity="0.28" />
            {Array.from({ length: Math.floor(w / 16) }, (_, k) => (
              <rect key={k} x={round(x + 5 + k * 16)} y={round(wy + winH + 21)} width="4" height="3.4" fill={pal.line} opacity="0.24" />
            ))}
            {Array.from({ length: s.cols }, (_, c) =>
              // bays 1 and 6 of the main house are the double-height windows
              s.main && (c === 1 || c === 6) && r < 2 ? null : (
              <Win
                key={c}
                x={round(x + 10 + bay * c + (bay - winW) / 2)}
                y={wy}
                w={round(winW)}
                h={winH}
                pal={pal}
                arch={s.arch}
                cols={2}
                rows={3}
                lit={rng.chance(0.72)}
                deep={rng.chance(0.3)}
                dim={rng.chance(0.24)}
                figure={rng.chance(0.2)}
              />
              ),
            )}
            {s.garlands && r === 0 && <Garland x={x + 8} y={round(wy - 16)} w={w - 16} seed={s.seed + r} />}
          </g>
        );
      })}

      <rect x={x} y={FASCIA} width={w} height={SHOP_TOP - FASCIA} fill={pal.roof} />
      <rect x={x} y={FASCIA} width={w} height="1.6" fill={pal.line} opacity="0.55" />
      <rect x={x} y={FASCIA + 4} width={w} height="0.9" fill={pal.line} opacity="0.3" />
    </g>
  );
}

/** The two tall windows on the main house — the way up to Work and Projects. */
function TallWindow({ h: hot }: { h: { x: number; y: number; w: number; h: number } }) {
  const pal = CLARET;
  return (
    <g>
      <Win x={hot.x} y={hot.y} w={hot.w} h={hot.h - 22} pal={pal} arch cols={3} rows={5} lit figure snow={false} />
      {/* an ironwork balcony across the bottom */}
      <g>
        <rect x={hot.x - 14} y={hot.y + hot.h - 22} width={hot.w + 28} height="4" fill={pal.roof} />
        <rect x={hot.x - 14} y={hot.y + hot.h - 54} width={hot.w + 28} height="2.4" fill={pal.roof} />
        {Array.from({ length: Math.floor((hot.w + 28) / 11) }, (_, i) => (
          <rect key={i} x={round(hot.x - 14 + i * 11)} y={hot.y + hot.h - 54} width="1.4" height="34" fill={pal.roof} />
        ))}
        <Cap x={hot.x - 14} y={hot.y + hot.h - 58} w={hot.w + 28} h={4} />
      </g>
      {/* a small pediment over the head */}
      <path d={`M ${hot.x - 16} ${hot.y - 12} L ${round(hot.x + hot.w / 2)} ${hot.y - 40} L ${hot.x + hot.w + 16} ${hot.y - 12} Z`} fill={pal.lit} />
      <path d={`M ${hot.x - 16} ${hot.y - 12} L ${round(hot.x + hot.w / 2)} ${hot.y - 40} L ${hot.x + hot.w + 16} ${hot.y - 12}`} fill="none" stroke={pal.line} strokeWidth="1.1" opacity="0.7" />
      <Cap x={hot.x - 16} y={hot.y - 42} w={hot.w + 32} h={4} />
    </g>
  );
}

export function Town() {
  return (
    <g>
      {TOWN.map((s) => (
        <Building key={s.seed} s={s} />
      ))}
      <TallWindow h={HOTSPOTS.studio} />
      <TallWindow h={HOTSPOTS.drafting} />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Shopfronts                                                        */
/* ────────────────────────────────────────────────────────────────── */

function Awning({ x, w, y, colour }: { x: number; w: number; y: number; colour: string }) {
  const n = Math.max(4, Math.round(w / 34));
  const sw = w / n;
  return (
    <g>
      <path d={`M ${x} ${y} L ${x + w} ${y} L ${x + w - 7} ${y + 26} L ${x + 7} ${y + 26} Z`} fill="#e8dcc4" />
      {Array.from({ length: n }, (_, i) =>
        i % 2 === 0 ? (
          <path
            key={i}
            d={`M ${round(x + i * sw)} ${y} L ${round(x + (i + 1) * sw)} ${y} L ${round(x + (i + 1) * sw - 7)} ${y + 26} L ${round(x + i * sw - 7)} ${y + 26} Z`}
            fill={colour}
          />
        ) : null,
      )}
      <Cap x={x} y={y - 4} w={w} h={4} />
    </g>
  );
}

/** The generic lit shop, for the buildings that aren't destinations. */
function Storefront({ x, w, pal, seed, kind }: { x: number; w: number; pal: Pal; seed: number; kind: number }) {
  const rng = makeRng(seed);
  const y = SHOP_TOP;
  const h = GROUND - y;
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h} rx={w * 0.9} ry={h * 0.9} fill="url(#glow)" opacity="0.7" />
      <rect x={x} y={y} width={w} height={h} fill={pal.roof} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 22} fill={kind % 2 ? PANE_SHOP : PANE_SHOP_DIM} />
      <g fill={pal.roof} opacity="0.72">
        {kind % 3 === 0 &&
          Array.from({ length: Math.floor(w / 16) }, (_, i) => (
            <rect key={i} x={round(x + 16 + i * 16)} y={y + 40} width={9} height={round(rng.range(18, 34))} />
          ))}
        {kind % 3 === 1 && (
          <>
            <rect x={x + 14} y={y + 74} width={w - 28} height={6} />
            {Array.from({ length: Math.floor(w / 22) }, (_, i) => (
              <circle key={i} cx={round(x + 24 + i * 22)} cy={y + 66} r={7} />
            ))}
          </>
        )}
        {kind % 3 === 2 && (
          <>
            <circle cx={round(x + w * 0.34)} cy={y + 52} r={10} />
            <path d={`M ${round(x + w * 0.34 - 14)} ${y + h - 22} q 4 -34 14 -34 q 10 0 14 34 Z`} />
            <rect x={round(x + w * 0.58)} y={y + 60} width={round(w * 0.3)} height={5} />
          </>
        )}
      </g>
      <g stroke={pal.roof} fill="none" strokeWidth="2.2">
        <rect x={x + 8} y={y + 8} width={w - 16} height={h - 22} />
        <line x1={round(x + w / 2)} y1={y + 8} x2={round(x + w / 2)} y2={y + h - 14} />
      </g>
      <rect x={x} y={y + h - 14} width={w} height={14} fill={pal.roof} />
      <Cap x={x} y={y - 6} w={w} h={5} />
    </g>
  );
}

export function Shops() {
  return (
    <g>
      <Storefront x={452} w={218} pal={CLARET} seed={104} kind={0} />
      <Storefront x={930} w={218} pal={CLARET} seed={105} kind={1} />
    </g>
  );
}

export function Cafe() {
  const { x, y, w, h } = HOTSPOTS.cafe;
  const rng = makeRng(777);
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h} rx={w * 1.1} ry={h * 1.1} fill="url(#glow)" opacity="0.75" />
      <rect x={x} y={y} width={w} height={h} fill={CLARET.roof} />
      <rect x={x + 9} y={y + 9} width={w - 18} height={h - 24} fill={PANE_SHOP} />
      <g fill={CLARET.roof} opacity="0.78">
        <rect x={x + 16} y={y + 86} width={72} height={38} />
        <rect x={x + 22} y={y + 66} width={44} height={18} opacity="0.6" />
        <circle cx={x + 104} cy={y + 54} r={9} />
        <path d={`M ${x + 92} ${y + 104} q 3 -38 12 -38 q 9 0 12 38 Z`} />
        <circle cx={x + 148} cy={y + 62} r={9} />
        <path d={`M ${x + 136} ${y + 110} q 3 -36 12 -36 q 9 0 12 36 Z`} />
        <rect x={x + 118} y={y + 96} width={60} height={4} />
      </g>
      {[0.26, 0.62].map((t, i) => (
        <g key={i}>
          <line x1={round(x + w * t)} y1={y + 10} x2={round(x + w * t)} y2={y + 30} stroke={CLARET.roof} strokeWidth="2" />
          <path d={`M ${round(x + w * t - 11)} ${y + 30} q 11 13 22 0 Z`} fill={CLARET.roof} />
          <circle cx={round(x + w * t)} cy={y + 36} r={4} fill="#fff6e2" />
        </g>
      ))}
      <g stroke={CLARET.roof} fill="none" strokeWidth="2.2">
        <rect x={x + 9} y={y + 9} width={w - 18} height={h - 24} />
        <line x1={round(x + w * 0.5)} y1={y + 9} x2={round(x + w * 0.5)} y2={y + h - 15} />
        <line x1={x + 9} y1={y + 34} x2={x + w - 9} y2={y + 34} strokeWidth="1.6" />
      </g>
      <rect x={x} y={y + h - 15} width={w} height={15} fill={CLARET.roof} />
      <Awning x={x - 10} w={w + 20} y={y - 30} colour="#8f2f26" />
      {/* a small tree in a tub by the door */}
      <g transform={`translate(${x + w + 8} ${GROUND})`}>
        <rect x="-11" y="-16" width="22" height="16" fill="#4a3524" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M ${-16 + i * 2} ${-16 - i * 17} L 0 ${-40 - i * 17} L ${16 - i * 2} ${-16 - i * 17} Z`} fill="#1d4029" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={round(rng.range(-12, 12))} cy={round(rng.range(-58, -20))} r={1.8} fill={GOLD} />
        ))}
      </g>
    </g>
  );
}

export function Bookshop() {
  const { x, y, w, h } = HOTSPOTS.bookshop;
  const rng = makeRng(888);
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h} rx={w} ry={h * 1.1} fill="url(#glow)" opacity="0.75" />
      <rect x={x} y={y} width={w} height={h} fill={SEPIA.roof} />
      <rect x={x + 9} y={y + 9} width={w - 18} height={h - 24} fill={PANE_SHOP} />
      <g opacity="0.8">
        {[y + 54, y + 92, y + 126].map((sy, r) => (
          <g key={r}>
            {Array.from({ length: 18 }, (_, i) => {
              const bh = round(rng.range(16, 28));
              return <rect key={i} x={round(x + 16 + i * 12)} y={sy - bh} width={round(rng.range(5, 10))} height={bh} fill={SEPIA.roof} />;
            })}
            <rect x={x + 12} y={sy} width={w - 24} height={4} fill={SEPIA.roof} />
          </g>
        ))}
        <g fill={SEPIA.roof}>
          <circle cx={x + 190} cy={y + 66} r={9} />
          <path d={`M ${x + 178} ${y + 118} q 3 -40 12 -40 q 9 0 12 40 Z`} />
        </g>
      </g>
      <g stroke={SEPIA.roof} fill="none" strokeWidth="2.2">
        <rect x={x + 9} y={y + 9} width={w - 18} height={h - 24} />
        <line x1={round(x + w * 0.5)} y1={y + 9} x2={round(x + w * 0.5)} y2={y + h - 15} />
        <line x1={x + 9} y1={y + 34} x2={x + w - 9} y2={y + 34} strokeWidth="1.6" />
      </g>
      <rect x={x} y={y + h - 15} width={w} height={15} fill={SEPIA.roof} />
      <Awning x={x - 10} w={w + 20} y={y - 30} colour="#1f4a45" />
    </g>
  );
}

export function FrontDoor() {
  const { x, y, w, h } = HOTSPOTS.door;
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + 60} rx={150} ry={130} fill="url(#glow)" />
      <path d={archD(x - 10, y - 8, w + 20, h + 8, true)} fill={CLARET.lit} />
      <path d={archD(x, y, w, h, true)} fill={CLARET.roof} />
      <path d={`M ${x + 14} ${y + 62} A ${round(w / 2 - 14)} 46 0 0 1 ${x + w - 14} ${y + 62} Z`} fill={PANE_SHOP} />
      {[-38, -19, 0, 19, 38].map((a, i) => (
        <line key={i} x1={x + w / 2} y1={y + 62} x2={x + w / 2 + a} y2={round(y + 62 - Math.sqrt(Math.max(0, 2100 - a * a)))} stroke={CLARET.roof} strokeWidth="2.6" />
      ))}
      <path d={`M ${x + 14} ${y + 62} A ${round(w / 2 - 14)} 46 0 0 1 ${x + w - 14} ${y + 62} Z`} fill="none" stroke={CLARET.roof} strokeWidth="4" />
      <rect x={x + 16} y={y + 64} width={w - 32} height={h - 66} fill="#183f3c" />
      <g stroke="#0c2624" fill="none" strokeWidth="2.6">
        <line x1={x + w / 2} y1={y + 64} x2={x + w / 2} y2={y + h} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={x + 24} y={y + 76 + i * 34} width={round(w / 2 - 34)} height={26} />
            <rect x={round(x + w / 2 + 10)} y={y + 76 + i * 34} width={round(w / 2 - 34)} height={26} />
          </g>
        ))}
      </g>
      <circle cx={x + w / 2 - 12} cy={y + 128} r={4} fill={GOLD} />
      <circle cx={x + w / 2 + 12} cy={y + 128} r={4} fill={GOLD} />
      <Wreath cx={x + w / 2} cy={y + 96} r={17} />
      {[x - 6, x + w + 6].map((lx, i) => (
        <g key={i}>
          <circle cx={lx} cy={y + 54} r={26} fill="url(#glow)" />
          <path d={`M ${lx - 8} ${y + 44} l 16 0 l -3 22 l -10 0 Z`} fill={CLARET.roof} />
          <path d={`M ${lx - 5} ${y + 47} l 10 0 l -2 16 l -6 0 Z`} fill="#ffe7bb" />
        </g>
      ))}
      <Cap x={x - 12} y={y - 14} w={w + 24} h={5} />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Signs                                                             */
/* ────────────────────────────────────────────────────────────────── */

export function Signs({ name }: { name: string }) {
  return (
    <g>
      <text x={HOTSPOTS.cafe.x + HOTSPOTS.cafe.w / 2} y={666} textAnchor="middle" className="font-display" fontSize="18" letterSpacing="3.5" fill={GOLD}>
        CAFÉ DU COIN
      </text>
      <text x={HOTSPOTS.bookshop.x + HOTSPOTS.bookshop.w / 2} y={666} textAnchor="middle" className="font-display" fontSize="18" letterSpacing="3.5" fill={GOLD}>
        LIBRAIRIE
      </text>
      <text x={HOTSPOTS.door.x + HOTSPOTS.door.w / 2} y={642} textAnchor="middle" className="font-mono" fontSize="12" letterSpacing="3" fill={GOLD} opacity="0.85">
        Nº 23
      </text>
      {/* the projecting sign, on its bracket */}
      <g>
        <path d="M 1030 556 l 44 0" stroke="#0d1116" strokeWidth="3" />
        <path d="M 1034 556 q 15 4 18 18" stroke="#0d1116" strokeWidth="2" fill="none" />
        <line x1="1066" y1="556" x2="1066" y2="568" stroke="#0d1116" strokeWidth="2.5" />
        <path d="M 1022 568 l 88 0 l 0 40 l -44 12 l -44 -12 Z" fill="#14202e" />
        <path d="M 1026 572 l 80 0 l 0 34 l -40 10 l -40 -10 Z" fill="none" stroke={GOLD} strokeWidth="1.3" opacity="0.7" />
        <text x="1066" y="595" textAnchor="middle" className="font-display" fontSize="15" fill={GOLD}>
          {name}
        </text>
        <Cap x={1022} y={564} w={88} h={4} />
      </g>
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  The square: tree, cars, people, snow underfoot                    */
/* ────────────────────────────────────────────────────────────────── */

function BigTree({ x, y, h = 250 }: { x: number; y: number; h?: number }) {
  const rng = makeRng(1224);
  const tiers = 6;
  return (
    <g>
      <ellipse cx={x} cy={round(y - h * 0.4)} rx={round(h * 0.62)} ry={round(h * 0.62)} fill="url(#glowWide)" />
      <rect x={x - 9} y={y - 22} width={18} height={22} fill="#3d2a1c" />
      {Array.from({ length: tiers }, (_, i) => {
        const t = i / (tiers - 1);
        const tw = round(h * 0.46 * (1 - t * 0.78));
        const ty = round(y - 16 - t * h * 0.86);
        const th = round(h * 0.2 * (1 - t * 0.4));
        return (
          <g key={i}>
            <path
              d={`M ${x - tw} ${ty} Q ${round(x - tw * 0.4)} ${round(ty - th * 0.5)} ${x} ${round(ty - th)} Q ${round(x + tw * 0.4)} ${round(ty - th * 0.5)} ${x + tw} ${ty} Q ${x} ${round(ty + th * 0.22)} ${x - tw} ${ty} Z`}
              fill={i % 2 ? "#1d4a30" : "#173d27"}
            />
            <path
              d={`M ${x - tw} ${ty} Q ${round(x - tw * 0.4)} ${round(ty - th * 0.5)} ${x} ${round(ty - th)}`}
              fill="none"
              stroke="#2c6b41"
              strokeWidth="2"
              opacity="0.7"
            />
            <Cap x={round(x - tw * 0.8)} y={round(ty - th * 0.2)} w={round(tw * 1.6)} h={4} />
          </g>
        );
      })}
      {Array.from({ length: 48 }, (_, i) => {
        const t = rng.range(0, 1);
        const spread = h * 0.42 * (1 - t * 0.8);
        return (
          <circle
            key={i}
            cx={round(x + rng.range(-spread, spread))}
            cy={round(y - 20 - t * h * 0.88)}
            r={round(rng.range(2, 4.2))}
            fill={rng.pick([GOLD, "#c9453a", "#e8dcc4", "#d98f3a"])}
          />
        );
      })}
      <path d={`M ${x} ${round(y - h - 4)} l 5 12 l 13 2 l -9 10 l 2 13 l -11 -6 l -11 6 l 2 -13 l -9 -10 l 13 -2 Z`} fill={GOLD} />
    </g>
  );
}

export function Square() {
  const rng = makeRng(4242);
  return (
    <g>
      <rect x="-120" y={GROUND} width="1840" height="200" fill="url(#ground)" />
      <path
        d={`M -120 ${GROUND + 4} q 200 -12 420 -4 q 260 10 500 -2 q 300 -12 560 4 q 260 14 480 -2 l 0 200 l -1960 0 Z`}
        fill="#b9bfbd"
      />
      {Array.from({ length: 60 }, (_, i) => (
        <ellipse
          key={i}
          cx={round(rng.range(-80, 1680))}
          cy={round(rng.range(GROUND + 16, 892))}
          rx={round(rng.range(5, 16))}
          ry={round(rng.range(1.6, 3.4))}
          fill="#98a0a1"
          opacity={round(rng.range(0.2, 0.5))}
        />
      ))}
      {/* Snow banked against the shopfronts. Each quadratic returns to the
          same y — relative curve offsets otherwise accumulate and the drift
          climbs straight up the windows. */}
      <path
        d={(() => {
          const base = GROUND + 20;
          let d = `M -120 ${base}`;
          for (let i = 0; i < 12; i++) {
            d += ` q 78 ${i % 2 ? 11 : -15} 156 0`;
          }
          return `${d} L 1740 1010 L -120 1010 Z`;
        })()}
        fill="#c6cbc9"
      />

      {/* warm pools thrown down by the shopfronts */}
      {[40, 200, 360, 566, 750, 930, 1116, 1286, 1522].map((cx, i) => (
        <ellipse key={i} cx={cx} cy={GROUND + 22} rx={110} ry={30} fill="#c9a163" opacity="0.1" />
      ))}

      <BigTree x={1196} y={GROUND + 12} h={214} />



      {[352, 1256].map((lx, i) => (
        <g key={i}>
          <circle cx={lx} cy={GROUND - 130} r={92} fill="url(#glow)" />
          <rect x={lx - 3.5} y={GROUND - 132} width="7" height="132" fill="#141c28" />
          <rect x={lx - 13} y={GROUND - 6} width="26" height="8" rx="3" fill="#141c28" />
          <path d={`M ${lx - 11} ${GROUND - 132} l 22 0 l -5 -26 l -12 0 Z`} fill="#141c28" />
          <path d={`M ${lx - 8} ${GROUND - 135} l 16 0 l -4 -20 l -8 0 Z`} fill="#ffe7bb" />
          <circle cx={lx} cy={GROUND - 164} r="3" fill={GOLD} />
          <Cap x={lx - 12} y={GROUND - 166} w={24} h={4} />
        </g>
      ))}
    </g>
  );
}
