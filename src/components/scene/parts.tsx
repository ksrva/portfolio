import { makeRng, round } from "@/lib/rand";

/* ═══════════════════════════════════════════════════════════════════
   The scene is drawn once, in SVG, in a 1600 × 1000 user-space box.

     y 0    ───────────────────────────────  ceiling / shelf tops
     y 90   ───  arch apex of the window
     y 200  ───  arch springing line
     y 470  ───  distant rooftops
     y 560  ───  street level
     y 700  ───  window ledge  (bottom of the glass)
     y 760  ───  interior floor begins
     y 880  ───  the rug
     y 1000 ───────────────────────────────

   x 0–300 and 1300–1600 are bookshelves. The glass is x 340–1260.
   ═══════════════════════════════════════════════════════════════════ */

export const VB = { w: 1600, h: 1000 } as const;

export const GLASS = { x1: 340, x2: 1260, top: 200, apex: -20, bottom: 700 };

/** The arched window opening, used both as a clip and as the frame's inner edge. */
export const GLASS_PATH = `M ${GLASS.x1} ${GLASS.bottom} L ${GLASS.x1} ${GLASS.top} Q 800 ${GLASS.apex} ${GLASS.x2} ${GLASS.top} L ${GLASS.x2} ${GLASS.bottom} Z`;

const WARM = ["#ffd7a0", "#f7bd67", "#ffe9c4", "#e9a44a", "#ff9f6b"] as const;

/* ────────────────────────────────────────────────────────────────── */
/*  Gradients, clips — everything referenced by url(#…)               */
/* ────────────────────────────────────────────────────────────────── */

export function Defs() {
  return (
    <defs>
      <clipPath id="glass">
        <path d={GLASS_PATH} />
      </clipPath>

      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#05161f" />
        <stop offset="34%" stopColor="#0a2833" />
        <stop offset="62%" stopColor="#114450" />
        <stop offset="84%" stopColor="#1a616a" />
        <stop offset="100%" stopColor="#26787a" />
      </linearGradient>

      <radialGradient id="moonHalo">
        <stop offset="0%" stopColor="#f7f0da" stopOpacity="0.30" />
        <stop offset="35%" stopColor="#e9e2c6" stopOpacity="0.11" />
        <stop offset="70%" stopColor="#cfe0d4" stopOpacity="0.035" />
        <stop offset="100%" stopColor="#cfe0d4" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="lampGlow">
        <stop offset="0%" stopColor="#ffd28f" stopOpacity="0.55" />
        <stop offset="30%" stopColor="#f5b95c" stopOpacity="0.20" />
        <stop offset="100%" stopColor="#f5b95c" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="shopGlow">
        <stop offset="0%" stopColor="#e2703a" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#c4542a" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d2c38" />
        <stop offset="100%" stopColor="#061a23" />
      </linearGradient>

      <linearGradient id="wetSheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f5b95c" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#f5b95c" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1a0f08" />
        <stop offset="18%" stopColor="#3a2317" />
        <stop offset="52%" stopColor="#28170d" />
        <stop offset="100%" stopColor="#150c06" />
      </linearGradient>

      <linearGradient id="woodV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3d2618" />
        <stop offset="60%" stopColor="#22140b" />
        <stop offset="100%" stopColor="#150c06" />
      </linearGradient>

      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a1a10" />
        <stop offset="100%" stopColor="#0e0805" />
      </linearGradient>

      {/* Vignette that pushes the corners down so the text can breathe */}
      <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.78">
        <stop offset="0%" stopColor="#04121a" stopOpacity="0" />
        <stop offset="62%" stopColor="#04121a" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#04121a" stopOpacity="0.72" />
      </radialGradient>

      {/* A soft warm wash spilling from the window onto the room */}
      <linearGradient id="spill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f5b95c" stopOpacity="0.13" />
        <stop offset="100%" stopColor="#f5b95c" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sky, stars, moon                                                  */
/* ────────────────────────────────────────────────────────────────── */

export function Sky() {
  const rng = makeRng(20260805);
  const stars = Array.from({ length: 90 }, () => ({
    cx: round(rng.range(320, 1280)),
    cy: round(rng.range(-10, 430)),
    r: round(rng.range(0.7, 2.1)),
    dur: round(rng.range(3.5, 9)),
    delay: round(rng.range(0, 6)),
  }));

  return (
    <g>
      <rect x="300" y="-80" width="1000" height="820" fill="url(#sky)" />
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#e8f2ec"
          className="anim-breathe"
          style={{
            ["--dur" as string]: `${s.dur}s`,
            animationDelay: `-${s.delay}s`,
          }}
        />
      ))}
    </g>
  );
}

export function Moon({ cx = 1082, cy = 196, r = 84 }) {
  const craters = [
    [-26, -22, 17],
    [16, -34, 10],
    [30, 12, 21],
    [-14, 26, 13],
    [-40, 8, 8],
    [4, 44, 7],
    [46, -12, 6],
  ] as const;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 4.2} fill="url(#moonHalo)" />
      <circle cx={cx} cy={cy} r={r} fill="#f7f0da" />
      {/* the moon isn't flat — a faint cool terminator on the lower-left */}
      <circle cx={cx - 12} cy={cy + 14} r={r} fill="#dfe3cf" opacity="0.5" />
      <circle cx={cx} cy={cy} r={r} fill="#f9f3e0" opacity="0.55" />
      <g opacity="0.5">
        {craters.map(([dx, dy, cr], i) => (
          <circle
            key={i}
            cx={cx + dx}
            cy={cy + dy}
            r={cr}
            fill="#d8d6bd"
            opacity={0.45}
          />
        ))}
      </g>
      {/* branches of a bare tree crossing the disc, like the reference */}
      <g
        stroke="#0a2028"
        strokeLinecap="round"
        fill="none"
        opacity="0.34"
      >
        <path d={`M ${cx - 88} ${cy + 46} C ${cx - 40} ${cy + 20}, ${cx - 10} ${cy - 6}, ${cx + 34} ${cy - 44}`} strokeWidth="3.5" />
        <path d={`M ${cx - 46} ${cy + 24} C ${cx - 30} ${cy + 4}, ${cx - 24} ${cy - 14}, ${cx - 8} ${cy - 42}`} strokeWidth="2.2" />
        <path d={`M ${cx - 18} ${cy - 2} C ${cx + 6} ${cy - 8}, ${cx + 24} ${cy - 16}, ${cx + 52} ${cy - 12}`} strokeWidth="1.8" />
        <path d={`M ${cx + 6} ${cy - 26} C ${cx + 22} ${cy - 40}, ${cx + 40} ${cy - 46}, ${cx + 62} ${cy - 40}`} strokeWidth="1.5" />
      </g>
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  A window. Drawn without SVG filters — the "bloom" is two          */
/*  oversized translucent rects, which costs nothing and reads the    */
/*  same at this scale.                                               */
/* ────────────────────────────────────────────────────────────────── */

type WinProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: boolean;
  color: string;
  dur: number;
  delay: number;
  arch?: boolean;
};

function Win({ x, y, w, h, lit, color, dur, delay, arch }: WinProps) {
  const rx = arch ? w / 2 : 1;
  if (!lit) {
    return (
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="#0a2430" opacity="0.85" />
    );
  }
  return (
    <g
      className="anim-flicker"
      style={{
        ["--dur" as string]: `${dur}s`,
        ["--lit" as string]: "1",
        animationDelay: `-${delay}s`,
      }}
    >
      <rect x={x - 7} y={y - 7} width={w + 14} height={h + 14} rx={9} fill={color} opacity="0.10" />
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={4} fill={color} opacity="0.24" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={color} />
      {/* a curtain / silhouette in some of them */}
      <rect x={x} y={y} width={w * 0.34} height={h} rx={rx * 0.4} fill="#3a2317" opacity="0.4" />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Facade — a procedurally lit apartment block                       */
/* ────────────────────────────────────────────────────────────────── */

type FacadeProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  seed: number;
  fill: string;
  litChance?: number;
  balconies?: boolean;
  arched?: boolean;
  roof?: "flat" | "mansard";
  detail?: boolean;
};

export function Facade({
  x,
  y,
  w,
  h,
  cols,
  rows,
  seed,
  fill,
  litChance = 0.5,
  balconies = false,
  arched = false,
  roof = "flat",
  detail = true,
}: FacadeProps) {
  const rng = makeRng(seed);
  const padX = w * 0.1;
  const cellW = (w - padX * 2) / cols;
  const padTop = roof === "mansard" ? 58 : 30;
  const cellH = (h - padTop - 18) / rows;
  const winW = Math.min(cellW * 0.5, 27);
  const winH = Math.min(cellH * 0.56, 38);

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + padX + c * cellW + (cellW - winW) / 2;
      const wy = y + padTop + r * cellH + (cellH - winH) / 2;
      const lit = rng.chance(litChance);
      cells.push({
        key: `${r}-${c}`,
        x: round(wx),
        y: round(wy),
        lit,
        color: rng.chance(0.06) ? "#9ad8d2" : rng.pick(WARM),
        dur: round(rng.range(6, 17)),
        delay: round(rng.range(0, 17)),
      });
    }
  }

  const bandYs = balconies
    ? Array.from({ length: rows }, (_, r) =>
        round(y + padTop + r * cellH + cellH - 3),
      ).filter((_, r) => r % 2 === 1 || rows <= 3)
    : [];

  return (
    <g>
      {/* body */}
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {/* a lighter face on the left edge, as if catching moonlight */}
      <rect x={x} y={y} width={Math.min(14, w * 0.06)} height={h} fill="#ffffff" opacity="0.045" />
      <rect x={x + w - 10} y={y} width={10} height={h} fill="#000000" opacity="0.25" />

      {roof === "mansard" && (
        <>
          <path
            d={`M ${x - 10} ${y + 46} L ${x + 22} ${y} L ${x + w - 22} ${y} L ${x + w + 10} ${y + 46} Z`}
            fill="#0a222e"
          />
          <rect x={x - 14} y={y + 42} width={w + 28} height={9} rx={2} fill="#143a4a" />
          {/* dormers */}
          {Array.from({ length: Math.max(2, Math.floor(cols / 2)) }, (_, i) => {
            const dw = 20;
            const step = (w - 60) / Math.max(1, Math.floor(cols / 2) - 1 || 1);
            const dx = round(x + 30 + i * step - dw / 2);
            const lit = rng.chance(0.5);
            return (
              <Win
                key={`d${i}`}
                x={dx}
                y={y + 12}
                w={dw}
                h={22}
                arch
                lit={lit}
                color={rng.pick(WARM)}
                dur={round(rng.range(7, 15))}
                delay={round(rng.range(0, 14))}
              />
            );
          })}
        </>
      )}

      {roof === "flat" && detail && (
        <rect x={x - 8} y={y - 7} width={w + 16} height={11} rx={2} fill="#143a4a" />
      )}

      {/* string course between floors */}
      {detail &&
        Array.from({ length: rows }, (_, r) => (
          <rect
            key={`s${r}`}
            x={x}
            y={round(y + padTop + r * cellH - 2)}
            width={w}
            height={2}
            fill="#000"
            opacity="0.18"
          />
        ))}

      {cells.map((c) => (
        <Win
          key={c.key}
          x={c.x}
          y={c.y}
          w={winW}
          h={winH}
          arch={arched}
          lit={c.lit}
          color={c.color}
          dur={c.dur}
          delay={c.delay}
        />
      ))}

      {/* wrought-iron balconies */}
      {bandYs.map((by, i) => (
        <g key={`b${i}`} opacity="0.9">
          <rect x={x + padX * 0.5} y={by} width={w - padX} height={2.5} fill="#0b1f28" />
          <rect x={x + padX * 0.5} y={by - 11} width={w - padX} height={1.6} fill="#0b1f28" />
          {Array.from({ length: Math.floor((w - padX) / 9) }, (_, j) => (
            <rect
              key={j}
              x={round(x + padX * 0.5 + j * 9)}
              y={by - 11}
              width={1.4}
              height={12}
              fill="#0b1f28"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Distant skyline — small, low contrast, mostly atmosphere          */
/* ────────────────────────────────────────────────────────────────── */

export function FarCity() {
  const rng = makeRng(77123);
  const blocks = [];
  let cursor = 300;
  while (cursor < 1310) {
    const bw = round(rng.range(34, 92));
    const bh = round(rng.range(48, 168));
    blocks.push({ x: cursor, y: round(500 - bh), w: bw, h: bh + 60 });
    cursor += bw + round(rng.range(-6, 12));
  }

  return (
    <g opacity="0.92">
      {blocks.map((b, i) => {
        const cols = Math.max(1, Math.floor(b.w / 16));
        const rows = Math.max(1, Math.floor(b.h / 20));
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#0c2d3a" />
            {Array.from({ length: cols * rows }, (_, k) => {
              if (!rng.chance(0.34)) return null;
              const c = k % cols;
              const r = Math.floor(k / cols);
              const wx = round(b.x + 6 + c * 16);
              const wy = round(b.y + 10 + r * 20);
              if (wy > 520) return null;
              return (
                <rect
                  key={k}
                  x={wx}
                  y={wy}
                  width={5}
                  height={7}
                  fill={rng.pick(WARM)}
                  opacity={round(rng.range(0.35, 0.85))}
                  className="anim-flicker"
                  style={{
                    ["--dur" as string]: `${round(rng.range(8, 20))}s`,
                    ["--lit" as string]: "0.8",
                    animationDelay: `-${round(rng.range(0, 18))}s`,
                  }}
                />
              );
            })}
          </g>
        );
      })}
      {/* haze over the far city so it sits back */}
      <rect x="300" y="300" width="1000" height="260" fill="#14505c" opacity="0.3" />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Mid-distance blocks. The two nearest ones run off the top of the  */
/*  arch, which is what makes the view feel like a real street.       */
/* ────────────────────────────────────────────────────────────────── */

export function MidCity() {
  return (
    <g>
      {/* left, near — its ground floor is the cafe drawn in <Street/> */}
      <Facade x={286} y={20} w={224} h={432} cols={3} rows={6} seed={311} fill="#123c4e" litChance={0.58} balconies roof="mansard" />
      {/* left, second rank */}
      <Facade x={500} y={170} w={150} h={440} cols={3} rows={6} seed={512} fill="#0f3141" litChance={0.44} />
      {/* small block by the stairs */}
      <Facade x={636} y={372} w={104} h={200} cols={2} rows={3} seed={733} fill="#0e2c3a" litChance={0.5} />
      {/* the pale building that catches the streetlight */}
      <Facade x={744} y={326} w={176} h={248} cols={3} rows={4} seed={841} fill="#4d6058" litChance={0.62} roof="mansard" arched />
      {/* right, second rank */}
      <Facade x={912} y={236} w={150} h={344} cols={3} rows={5} seed={919} fill="#10333f" litChance={0.5} balconies />
      {/* right, near — its ground floor is the bookshop */}
      <Facade x={1046} y={8} w={254} h={464} cols={4} rows={6} seed={1099} fill="#143f52" litChance={0.56} balconies roof="mansard" />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Street level: road, lamp, trees, awning, one small person         */
/* ────────────────────────────────────────────────────────────────── */

function Evergreen({ x, y, s = 1, seed = 1 }: { x: number; y: number; s?: number; seed?: number }) {
  const rng = makeRng(seed);
  const tiers = [
    { w: 56, h: 46, dy: 0 },
    { w: 44, h: 40, dy: -30 },
    { w: 32, h: 34, dy: -56 },
    { w: 20, h: 26, dy: -78 },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-4} y={-6} width={8} height={16} fill="#2a1a10" />
      {tiers.map((t, i) => (
        <path
          key={i}
          d={`M ${-t.w / 2} ${t.dy} L 0 ${t.dy - t.h} L ${t.w / 2} ${t.dy} Z`}
          fill={i % 2 ? "#123f38" : "#0e352f"}
        />
      ))}
      {/* string lights */}
      {Array.from({ length: 16 }, (_, i) => {
        const ty = round(rng.range(-96, -4));
        const spread = (Math.abs(ty) < 96 ? (96 + ty) / 96 : 0) * 26 + 4;
        const tx = round(rng.range(-spread, spread));
        return (
          <circle
            key={i}
            cx={tx}
            cy={ty}
            r={1.9}
            fill={rng.pick(WARM)}
            className="anim-breathe"
            style={{
              ["--dur" as string]: `${round(rng.range(2.5, 6))}s`,
              animationDelay: `-${round(rng.range(0, 5))}s`,
            }}
          />
        );
      })}
      <circle cx={0} cy={-108} r={3.4} fill="#ffe7bb" className="anim-breathe" style={{ ["--dur" as string]: "4s" }} />
    </g>
  );
}

export function Street() {
  return (
    <g>
      {/* the road, receding to the left as in the reference */}
      <path d="M 300 700 L 300 604 L 700 546 L 1000 560 L 1300 640 L 1300 700 Z" fill="url(#road)" />
      <path d="M 300 700 L 300 604 L 700 546 L 1000 560 L 1300 640 L 1300 700 Z" fill="url(#wetSheen)" />

      {/* pavement kerb */}
      <path d="M 300 612 L 700 554 L 1000 568 L 1300 648 L 1300 660 L 1000 580 L 700 566 L 300 624 Z" fill="#17414d" opacity="0.8" />

      {/* far pavement + railing along the drop */}
      <g stroke="#0a2028" strokeWidth="2.4" opacity="0.85">
        <line x1="300" y1="596" x2="700" y2="540" />
        {Array.from({ length: 22 }, (_, i) => {
          const t = i / 21;
          const x = round(300 + t * 400);
          const y = round(596 - t * 56);
          return <line key={i} x1={x} y1={y} x2={x} y2={y + 22} strokeWidth="1.6" />;
        })}
      </g>

      {/* shopfront, warm red, bottom right */}
      <g>
        <rect x="1090" y="470" width="210" height="180" fill="#2a1418" />
        <rect x="1090" y="470" width="210" height="20" fill="#5e1a18" />
        <ellipse cx="1195" cy="600" rx="180" ry="120" fill="url(#shopGlow)" />
        <rect x="1108" y="512" width="76" height="92" rx="3" fill="#ffb26b" opacity="0.9" className="anim-flicker" style={{ ["--dur" as string]: "13s", ["--lit" as string]: "0.9" }} />
        <rect x="1200" y="512" width="76" height="92" rx="3" fill="#ff9f6b" opacity="0.8" />
        {/* awning */}
        <path d="M 1094 494 L 1300 494 L 1300 524 L 1094 524 Z" fill="#7a221f" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={1094 + i * 30} y="494" width="15" height="30" fill="#a8332c" />
        ))}
      </g>

      {/* the corner cafe on the left of the street */}
      <g>
        <rect x="300" y="452" width="150" height="176" fill="#1a2e2a" />
        <rect x="318" y="500" width="52" height="70" rx="3" fill="#ffd28f" opacity="0.85" className="anim-flicker" style={{ ["--dur" as string]: "11s", ["--lit" as string]: "0.85" }} />
        <rect x="384" y="500" width="52" height="70" rx="3" fill="#f5b95c" opacity="0.7" />
        <ellipse cx="375" cy="560" rx="130" ry="90" fill="url(#lampGlow)" opacity="0.6" />
      </g>

      <Evergreen x={520} y={598} s={0.95} seed={41} />
      <Evergreen x={905} y={628} s={1.25} seed={97} />

      {/* street lamp */}
      <g>
        <ellipse cx="742" cy="500" rx="140" ry="150" fill="url(#lampGlow)" />
        <rect x="739" y="500" width="6" height="128" fill="#0a2028" />
        <rect x="726" y="624" width="32" height="7" rx="3" fill="#0a2028" />
        <path d="M 730 502 L 754 502 L 748 476 L 736 476 Z" fill="#0a2028" />
        <circle cx="742" cy="492" r="9" fill="#ffe7bb" className="anim-breathe" style={{ ["--dur" as string]: "7s" }} />
        <rect x="734" y="466" width="16" height="8" rx="3" fill="#0a2028" />
      </g>

      {/* one person, walking home */}
      <g fill="#08202a" opacity="0.92" transform="translate(806 628) scale(1.05)">
        <circle cx="0" cy="-26" r="4.6" />
        <path d="M -5 -21 L 5 -21 L 7 -4 L -7 -4 Z" />
        <rect x="-5.5" y="-4" width="4" height="12" rx="1.6" />
        <rect x="1.5" y="-4" width="4" height="12" rx="1.6" />
      </g>
      <ellipse cx="806" cy="638" rx="14" ry="3" fill="#000" opacity="0.35" />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Snow                                                              */
/* ────────────────────────────────────────────────────────────────── */

export function Snow({ count = 46 }: { count?: number }) {
  const rng = makeRng(5150);
  const flakes = Array.from({ length: count }, () => ({
    cx: round(rng.range(320, 1280)),
    cy: round(rng.range(-40, 40)),
    r: round(rng.range(1.1, 3.2)),
    dur: round(rng.range(11, 26)),
    delay: round(rng.range(0, 26)),
    dx: round(rng.range(-70, 90)),
    o: round(rng.range(0.3, 0.85)),
  }));
  return (
    <g>
      {flakes.map((f, i) => (
        <circle
          key={i}
          cx={f.cx}
          cy={f.cy}
          r={f.r}
          fill="#eaf3ee"
          className="anim-snow"
          style={{
            ["--dur" as string]: `${f.dur}s`,
            ["--dx" as string]: `${f.dx}px`,
            ["--o" as string]: `${f.o}`,
            animationDelay: `-${f.delay}s`,
          }}
        />
      ))}
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  The room: bookshelves, window joinery, sill, floor, rug, table    */
/* ────────────────────────────────────────────────────────────────── */

function Books({
  x,
  y,
  w,
  seed,
}: {
  x: number;
  y: number;
  w: number;
  seed: number;
}) {
  const rng = makeRng(seed);
  const spines = [];
  let cursor = x + 3;
  const palette = [
    "#5e1a18", "#7a3b1f", "#2c4a52", "#3d5a3a", "#6b4429",
    "#4a2a4e", "#8c6b2f", "#1f3a45", "#7a2f28", "#3a4a2f",
  ];
  while (cursor < x + w - 6) {
    const sw = round(rng.range(6, 15));
    if (cursor + sw > x + w - 4) break;
    const sh = round(rng.range(38, 54));
    const lean = rng.chance(0.08);
    spines.push({
      x: cursor,
      w: sw,
      h: sh,
      fill: rng.pick(palette),
      band: rng.chance(0.45),
      lean,
    });
    cursor += sw + 1.4;
  }
  return (
    <g>
      {spines.map((s, i) => (
        <g key={i} transform={s.lean ? `rotate(-7 ${s.x} ${y})` : undefined}>
          <rect x={s.x} y={y - s.h} width={s.w} height={s.h} fill={s.fill} />
          <rect x={s.x} y={y - s.h} width={1.4} height={s.h} fill="#fff" opacity="0.09" />
          {s.band && (
            <>
              <rect x={s.x} y={y - s.h + 7} width={s.w} height={2} fill="#c9a227" opacity="0.55" />
              <rect x={s.x} y={y - 11} width={s.w} height={1.6} fill="#c9a227" opacity="0.35" />
            </>
          )}
        </g>
      ))}
    </g>
  );
}

function Bookcase({ x, w, seed }: { x: number; w: number; seed: number }) {
  const shelfYs = [96, 176, 256, 336, 416, 496, 576, 656, 736];
  return (
    <g>
      <rect x={x} y={-20} width={w} height={860} fill="url(#woodV)" />
      <rect x={x} y={-20} width={w} height={860} fill="#0a0603" opacity="0.35" />
      {shelfYs.map((sy, i) => (
        <g key={i}>
          <Books x={x + 10} y={sy} w={w - 20} seed={seed + i * 31} />
          <rect x={x + 4} y={sy} width={w - 8} height={7} fill="#3a2317" />
          <rect x={x + 4} y={sy} width={w - 8} height={2} fill="#6b4429" opacity="0.7" />
          <rect x={x + 4} y={sy + 7} width={w - 8} height={3} fill="#000" opacity="0.4" />
        </g>
      ))}
      {/* uprights */}
      <rect x={x} y={-20} width={9} height={860} fill="#2a1a10" />
      <rect x={x + w - 9} y={-20} width={9} height={860} fill="#2a1a10" />
      {/* light spilling from the window onto the inner edge */}
      <rect
        x={x < 800 ? x + w - 26 : x}
        y={-20}
        width={26}
        height={860}
        fill="#f5b95c"
        opacity="0.07"
      />
    </g>
  );
}

export function Room() {
  return (
    <g>
      {/* NB: the wall is painted in <HeroScene/> *before* the glass group.
          Painting it here would cover the view. */}
      <Bookcase x={0} w={300} seed={900} />
      <Bookcase x={1300} w={300} seed={1400} />

      {/* window joinery: the arched casing */}
      <path
        d={`M 296 744 L 296 196 Q 800 -40 1304 196 L 1304 744 Z M ${GLASS.x1} ${GLASS.bottom} L ${GLASS.x1} ${GLASS.top} Q 800 ${GLASS.apex} ${GLASS.x2} ${GLASS.top} L ${GLASS.x2} ${GLASS.bottom} Z`}
        fill="url(#wood)"
        fillRule="evenodd"
      />
      {/* brass bead on the inner edge, catching the moonlight */}
      <path
        d={GLASS_PATH}
        fill="none"
        stroke="#c9a227"
        strokeWidth="2.5"
        opacity="0.38"
      />
      <path
        d={GLASS_PATH}
        fill="none"
        stroke="#000"
        strokeWidth="9"
        opacity="0.35"
        transform="translate(0 3)"
      />

      {/* keystone at the apex */}
      <path d="M 776 82 L 824 82 L 832 132 L 768 132 Z" fill="#3a2317" />
      <path d="M 776 82 L 824 82 L 826 96 L 774 96 Z" fill="#6b4429" opacity="0.5" />

      {/* sill */}
      <rect x="278" y="694" width="1044" height="20" rx="4" fill="#4a2f1d" />
      <rect x="278" y="694" width="1044" height="5" rx="2" fill="#7d5433" opacity="0.75" />
      <rect x="278" y="712" width="1044" height="12" fill="#20130a" />

      {/* warm spill from the window onto the floor */}
      <rect x="300" y="724" width="1000" height="200" fill="url(#spill)" />

      {/* floor */}
      <rect x="0" y="724" width="1600" height="300" fill="url(#floor)" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={-40 + i * 122} y="724" width="2" height="300" fill="#000" opacity="0.3" />
      ))}
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  The rug — a real Persian layout: field, medallion, guard bands    */
/* ────────────────────────────────────────────────────────────────── */

export function Rug() {
  const rng = makeRng(31415);
  return (
    <g>
      <ellipse cx="800" cy="1010" rx="760" ry="150" fill="#000" opacity="0.5" />
      <g transform="translate(800 952) skewX(0)">
        {/* the whole rug in perspective — a wide, squashed rectangle */}
        <g transform="scale(1 0.42)">
          <rect x="-720" y="-190" width="1440" height="380" rx="6" fill="#5e1a18" />
          <rect x="-700" y="-172" width="1400" height="344" fill="#9b3028" />
          {/* outer guard band */}
          <rect x="-676" y="-150" width="1352" height="300" fill="none" stroke="#e6d4ae" strokeWidth="7" opacity="0.75" />
          <rect x="-660" y="-136" width="1320" height="272" fill="#7d2320" />
          <rect x="-640" y="-118" width="1280" height="236" fill="#5e1a18" />
          {/* the field */}
          <rect x="-624" y="-104" width="1248" height="208" fill="#9b3028" />

          {/* medallion */}
          <g>
            <path d="M 0 -96 L 130 0 L 0 96 L -130 0 Z" fill="#22282e" />
            <path d="M 0 -78 L 106 0 L 0 78 L -106 0 Z" fill="#c2564a" />
            <path d="M 0 -54 L 74 0 L 0 54 L -74 0 Z" fill="#e6d4ae" />
            <path d="M 0 -30 L 42 0 L 0 30 L -42 0 Z" fill="#22282e" />
            <circle cx="0" cy="0" r="12" fill="#c9a227" />
          </g>

          {/* corner spandrels */}
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy], i) => (
            <path
              key={i}
              d={`M ${sx * 624} ${sy * 104} Q ${sx * 430} ${sy * 96} ${sx * 440} ${sy * 20} Q ${sx * 560} ${sy * 40} ${sx * 624} ${sy * 30} Z`}
              fill="#22282e"
              opacity="0.85"
            />
          ))}

          {/* repeating boteh / hook motifs across the field */}
          {Array.from({ length: 34 }, (_, i) => {
            const gx = round(rng.range(-600, 600));
            const gy = round(rng.range(-92, 92));
            if (Math.abs(gx) < 165 && Math.abs(gy) < 105) return null;
            const s = round(rng.range(0.7, 1.25));
            const c = rng.pick(["#e6d4ae", "#22282e", "#c9a227", "#c2564a"]);
            return (
              <g key={i} transform={`translate(${gx} ${gy}) scale(${s})`} opacity="0.9">
                <path d="M 0 -18 C 13 -14, 15 4, 4 14 C -2 19, -10 17, -12 10 C -14 2, -7 -2, -3 2" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
              </g>
            );
          })}

          {/* guard band motifs */}
          {Array.from({ length: 46 }, (_, i) => {
            const gx = round(-664 + i * 29.5);
            return (
              <g key={`gb${i}`}>
                <path d={`M ${gx} -143 l 9 8 l -9 8 l -9 -8 Z`} fill="#e6d4ae" opacity="0.8" />
                <path d={`M ${gx} 143 l 9 -8 l -9 -8 l -9 8 Z`} fill="#e6d4ae" opacity="0.8" />
              </g>
            );
          })}
        </g>
      </g>
      {/* fringe */}
      <g stroke="#e6d4ae" strokeWidth="2" opacity="0.4">
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1={90 + i * 24} y1={1032} x2={90 + i * 24} y2={1000} />
        ))}
      </g>
      {/* the room is dark; dim the rug so it doesn't shout */}
      <rect x="0" y="860" width="1600" height="200" fill="#04121a" opacity="0.42" />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  The table, two cups, a stack of books, steam                      */
/* ────────────────────────────────────────────────────────────────── */

function Cup({ x, y, s = 1, delay = 0 }: { x: number; y: number; s?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* steam */}
      <g opacity="0.9">
        {[-5, 2, 8].map((dx, i) => (
          <ellipse
            key={i}
            cx={dx}
            cy={-16}
            rx={2.6}
            ry={7}
            fill="#f4ecdc"
            className="anim-steam"
            style={{
              ["--dur" as string]: `${4 + i * 0.9}s`,
              animationDelay: `${delay + i * 0.7}s`,
            }}
          />
        ))}
      </g>
      <ellipse cx="0" cy="8" rx="17" ry="5" fill="#000" opacity="0.4" />
      <path d="M -13 -11 L 13 -11 L 10 6 L -10 6 Z" fill="#efe6d4" />
      <path d="M -13 -11 L 13 -11 L 12 -7 L -12 -7 Z" fill="#cfc4ae" />
      <ellipse cx="0" cy="-11" rx="13" ry="4" fill="#4a2f1d" />
      <ellipse cx="0" cy="-11.5" rx="10.5" ry="3" fill="#2a1a10" />
      <path d="M 12 -7 q 9 3 0 9" fill="none" stroke="#efe6d4" strokeWidth="2.6" />
      <ellipse cx="0" cy="8" rx="19" ry="5" fill="#e6dcc7" opacity="0.5" />
    </g>
  );
}

export function Table() {
  return (
    <g>
      {/* pool of lamplight on the rug under the table */}
      <ellipse cx="800" cy="946" rx="230" ry="52" fill="#000" opacity="0.42" />

      {/* legs */}
      <g fill="#3a2317">
        <path d="M 706 856 q -10 44 -26 82 l 14 4 q 18 -42 26 -84 Z" />
        <path d="M 894 856 q 10 44 26 82 l -14 4 q -18 -42 -26 -84 Z" />
        <path d="M 792 858 l 16 0 l 3 88 l -22 0 Z" />
        <path d="M 760 938 q 40 -14 80 0 l 0 10 q -40 -12 -80 0 Z" />
      </g>

      {/* table top */}
      <ellipse cx="800" cy="848" rx="150" ry="40" fill="#4a2f1d" />
      <ellipse cx="800" cy="843" rx="150" ry="40" fill="#6b4429" />
      <ellipse cx="800" cy="843" rx="150" ry="40" fill="url(#spill)" />
      <ellipse cx="800" cy="840" rx="126" ry="31" fill="#7d5433" opacity="0.45" />

      {/* a small stack of books */}
      <g>
        <rect x="700" y="824" width="86" height="11" rx="2" fill="#2c4a52" />
        <rect x="700" y="824" width="86" height="3" rx="1.5" fill="#456d78" />
        <rect x="706" y="813" width="78" height="11" rx="2" fill="#7a2f28" />
        <rect x="706" y="813" width="78" height="3" rx="1.5" fill="#a8483e" />
        <rect x="712" y="803" width="70" height="10" rx="2" fill="#3d5a3a" />
        <rect x="712" y="803" width="70" height="3" rx="1.5" fill="#5c8055" />
        <rect x="700" y="835" width="86" height="3" fill="#000" opacity="0.35" />
      </g>

      {/* candle */}
      <g>
        <rect x="866" y="806" width="12" height="30" rx="3" fill="#efe6d4" />
        <rect x="866" y="806" width="4" height="30" fill="#fff" opacity="0.35" />
        <ellipse cx="872" cy="836" rx="8" ry="3" fill="#000" opacity="0.3" />
        <ellipse cx="872" cy="796" rx="4.5" ry="9" fill="#f5b95c" className="anim-breathe" style={{ ["--dur" as string]: "2.4s" }} />
        <ellipse cx="872" cy="798" rx="2.2" ry="5" fill="#ffe7bb" />
        <circle cx="872" cy="798" r="42" fill="url(#lampGlow)" opacity="0.7" />
      </g>

      <Cup x={812} y={828} s={1} delay={0} />
      <Cup x={848} y={840} s={0.88} delay={1.4} />
    </g>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sofa arm intruding from the bottom-left, as in the reference      */
/* ────────────────────────────────────────────────────────────────── */

export function SofaArm() {
  return (
    <g>
      <path d="M -20 1010 L -20 852 q 0 -42 46 -42 l 128 0 q 46 0 46 42 l 0 158 Z" fill="#123a5a" />
      <path d="M -20 1010 L -20 852 q 0 -42 46 -42 l 128 0 q 46 0 46 42 l 0 158 Z" fill="#000" opacity="0.28" />
      <path d="M 4 866 q 0 -30 40 -30 l 96 0 q 40 0 40 30 l 0 20 l -176 0 Z" fill="#1c5480" />
      {/* cushion with a small pattern */}
      <g transform="translate(58 902) rotate(-8)">
        <rect x="0" y="0" width="118" height="104" rx="10" fill="#1a4e78" />
        <rect x="6" y="6" width="106" height="92" rx="8" fill="#215f8e" />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M ${16 + (i % 4) * 28} ${20 + Math.floor(i / 4) * 28} l 8 8 l -8 8 l -8 -8 Z`}
            fill="#e6d4ae"
            opacity="0.5"
          />
        ))}
      </g>
      <rect x="-20" y="840" width="240" height="180" fill="#04121a" opacity="0.3" />
    </g>
  );
}

/** A tall wing chair on the right, mostly silhouette. */
export function Chair() {
  return (
    <g>
      <path d="M 1620 1010 L 1620 856 q 0 -40 -44 -40 l -120 0 q -44 0 -44 40 l 0 154 Z" fill="#3a2317" />
      <path d="M 1620 1010 L 1620 856 q 0 -40 -44 -40 l -120 0 q -44 0 -44 40 l 0 154 Z" fill="#000" opacity="0.34" />
      <rect x="1428" y="828" width="200" height="26" rx="10" fill="#5b3a24" opacity="0.7" />
      <rect x="1400" y="840" width="240" height="180" fill="#04121a" opacity="0.34" />
    </g>
  );
}
