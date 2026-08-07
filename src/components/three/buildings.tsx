"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html, Outlines } from "@react-three/drei";
import { makeRng } from "@/lib/rand";

/* ═══════════════════════════════════════════════════════════════════
   A terrace seen head-on.

   The previous version pointed the camera down a street, which meant
   every facade was viewed at a grazing angle and all the window detail
   was foreshortened into nothing. Front-on is the only way windows get
   enough screen area to hold mullions, curtains and wreaths.

   Buildings sit in a row along x, facades on the z = 0 plane, depth
   running back into −z. Camera looks straight at them.

   Every piece of window furniture is instanced across the whole
   terrace — one draw call per *kind* of thing, not per window — so the
   detail is essentially free.
   ═══════════════════════════════════════════════════════════════════ */

export const INK = "#0a0e15";
const SNOW = "#dbe4ef";
const GREEN = "#1f4a2c";
const GREEN_HI = "#2f6b3d";
/* Small emissive accents — finials, baubles, berries. They're unlit
   materials, so without this they glow at full strength before a single lamp
   has come on. Shared instances, ramped once per frame by the intro clock. */
const GOLD_FULL = new THREE.Color("#e8b45c");
const BERRY_FULL = new THREE.Color("#a8342c");
const CURTAIN_FULL = new THREE.Color("#7a2f22");
const DORMER_FULL = new THREE.Color("#d59a55");
export const ACCENT = {
  gold: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
  berry: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
  curtain: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
  dormer: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
};
export function setAccentGlow(f: number) {
  ACCENT.gold.color.copy(GOLD_FULL).multiplyScalar(f);
  ACCENT.berry.color.copy(BERRY_FULL).multiplyScalar(f);
  ACCENT.curtain.color.copy(CURTAIN_FULL).multiplyScalar(f);
  ACCENT.dormer.color.copy(DORMER_FULL).multiplyScalar(f);
}

const WARM = ["#d9a055", "#c98a3e", "#e6b878", "#bf7a30", "#d49b57", "#ab672a"];

export type WinStyle = "sash" | "arched" | "french" | "shuttered";

export type Facade = {
  id: string;
  x: number;
  w: number;
  h: number;
  d: number;
  colour: string;
  trim: string;
  roof: "pitched" | "mansard" | "stepped" | "flat";
  /** storeys above the shop — height is derived from this, never the reverse */
  floors: number;
  /** each building gets its own window vocabulary */
  win: WinStyle;
  wall: "brick" | "stone" | "stucco";
  /** not every shop has an awning */
  awning: boolean;
  shop: "shopfront" | "door" | "plain";
  accent?: string;
  seed: number;
};

/* The row that closes the end of the street — the three you can enter. */
export const TERRACE: Facade[] = [
  { id: "a", awning: true, wall: "stone" as Facade["wall"], win: "arched" as WinStyle, x: -25, w: 11, floors: 2, h: 16.6, d: 7, colour: "#22324c", trim: "#3a5372", roof: "mansard", shop: "shopfront", accent: "#2f5a52", seed: 11 },
  { id: "cafe", awning: true, wall: "brick" as Facade["wall"], win: "sash" as WinStyle, x: -14, w: 11.5, floors: 2, h: 16.6, d: 7.5, colour: "#6b2721", trim: "#8c4036", roof: "flat", shop: "shopfront", accent: "#8f2f26", seed: 22 },
  { id: "no23", awning: true, wall: "stucco" as Facade["wall"], win: "french" as WinStyle, x: -2.5, w: 10, floors: 3, h: 21.2, d: 7, colour: "#493524", trim: "#6a5038", roof: "pitched", shop: "door", seed: 33 },
  { id: "shop", awning: true, wall: "brick" as Facade["wall"], win: "shuttered" as WinStyle, x: 7.5, w: 12, floors: 2, h: 16.6, d: 7.5, colour: "#1a2740", trim: "#304560", roof: "stepped", shop: "shopfront", accent: "#1f4a45", seed: 44 },
  { id: "e", awning: true, wall: "stone" as Facade["wall"], win: "arched" as WinStyle, x: 19.5, w: 10.5, floors: 2, h: 16.6, d: 7, colour: "#57201b", trim: "#79352c", roof: "mansard", shop: "shopfront", accent: "#6b4a2a", seed: 55 },
];

const GROUND_H = 5.2;
const FLOOR_H = 4.6;

/* Each style is a different window: proportion, pane grid, and what it
   carries. This is what stops every building reading as the same block. */
const STYLE: Record<
  WinStyle,
  { w: number; h: number; cols: number; rows: number; arch?: boolean; balcony?: boolean; shutters?: boolean }
> = {
  sash: { w: 2.2, h: 3.3, cols: 3, rows: 4 },
  arched: { w: 2.2, h: 2.9, cols: 3, rows: 3, arch: true },
  french: { w: 2.4, h: 3.9, cols: 3, rows: 5, balcony: true },
  shuttered: { w: 1.9, h: 2.4, cols: 2, rows: 2, shutters: true },
};

/* ────────────────────────────────────────────────────────────────── */
/*  Wall textures                                                     */
/*                                                                    */
/*  These are multipliers, not colours: a `map` multiplies the         */
/*  material colour, so they sit near white with darker mortar and let */
/*  each building's own colour come through. Anything darker here and  */
/*  every wall would sink toward black the moment it was applied.      */
/* ────────────────────────────────────────────────────────────────── */

/** World size of one texture tile, in units. Keeps brick courses the same
    physical size on a two-storey shop and a six-storey block. */
export const WALL_TILE = 3.4;

function makeCanvas(size = 1024) {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  return { cv, g: cv.getContext("2d")!, size };
}

function finish(cv: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function brickTexture() {
  const { cv, g, size } = makeCanvas();
  const rng = makeRng(5150);
  const rows = 11;
  const cols = 6;
  const bh = size / rows;
  const bw = size / cols;

  g.fillStyle = "#5e5b57"; // mortar — deliberately dark, see above
  g.fillRect(0, 0, size, size);

  for (let r = -1; r <= rows; r++) {
    const off = (r % 2) * (bw / 2); // running bond
    for (let c = -1; c <= cols; c++) {
      const v = rng.range(0.8, 1.05);
      const warm = rng.range(-12, 12);
      g.fillStyle = `rgb(${Math.round(250 * v + warm)},${Math.round(242 * v)},${Math.round(236 * v - warm)})`;
      g.fillRect(off + c * bw + 5, r * bh + 5, bw - 10, bh - 10);
      // a lit top edge and a shaded bottom, so each brick has a form
      g.fillStyle = `rgba(255,255,255,${rng.range(0.14, 0.32).toFixed(3)})`;
      g.fillRect(off + c * bw + 5, r * bh + 5, bw - 10, 4);
      g.fillStyle = `rgba(70,66,62,${rng.range(0.12, 0.26).toFixed(3)})`;
      g.fillRect(off + c * bw + 5, r * bh + bh - 9, bw - 10, 4);
    }
  }
  // soot and weathering, so the wall isn't mechanically even
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(120,116,112,${rng.range(0.03, 0.12).toFixed(3)})`;
    g.beginPath();
    g.ellipse(rng.range(0, size), rng.range(0, size), rng.range(40, 190), rng.range(30, 120), 0, 0, Math.PI * 2);
    g.fill();
  }
  return finish(cv);
}

function stoneTexture() {
  const { cv, g, size } = makeCanvas();
  const rng = makeRng(6270);
  const rows = 6;
  const cols = 3;
  const bh = size / rows;
  const bw = size / cols;

  g.fillStyle = "#57544f";
  g.fillRect(0, 0, size, size);

  for (let r = -1; r <= rows; r++) {
    const off = (r % 2) * (bw / 2);
    for (let c = -1; c <= cols; c++) {
      const v = rng.range(0.82, 1.04);
      g.fillStyle = `rgb(${Math.round(248 * v)},${Math.round(244 * v)},${Math.round(235 * v)})`;
      g.beginPath();
      g.roundRect(off + c * bw + 7, r * bh + 7, bw - 14, bh - 14, 3);
      g.fill();
      // chamfer along the top of each course
      g.fillStyle = `rgba(255,255,255,${rng.range(0.08, 0.22).toFixed(3)})`;
      g.fillRect(off + c * bw + 7, r * bh + 7, bw - 14, 5);
      g.fillStyle = `rgba(110,106,102,${rng.range(0.06, 0.16).toFixed(3)})`;
      g.fillRect(off + c * bw + 7, r * bh + bh - 12, bw - 14, 5);
    }
  }
  return finish(cv);
}

function stuccoTexture() {
  const { cv, g, size } = makeCanvas(512);
  const rng = makeRng(7391);
  g.fillStyle = "#f2efe9";
  g.fillRect(0, 0, size, size);
  // plaster mottling
  for (let i = 0; i < 900; i++) {
    const d = rng.range(0, 1) > 0.5 ? 255 : 176;
    g.fillStyle = `rgba(${d},${d},${d},${rng.range(0.02, 0.09).toFixed(3)})`;
    g.beginPath();
    g.ellipse(rng.range(0, size), rng.range(0, size), rng.range(5, 40), rng.range(4, 26), rng.range(0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // the odd hairline crack
  g.strokeStyle = "rgba(150,145,140,0.35)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    let x = rng.range(0, size);
    let y = rng.range(0, size);
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 9; k++) {
      x += rng.range(-14, 14);
      y += rng.range(6, 26);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return finish(cv);
}

export function useWallTextures() {
  return useMemo(
    () => ({ brick: brickTexture(), stone: stoneTexture(), stucco: stuccoTexture() }),
    [],
  );
}

/** Each building needs its own copy so the tiling can match its size. */
export function useWallMap(base: THREE.Texture, w: number, h: number) {
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, w / WALL_TILE), Math.max(1, h / WALL_TILE));
    return t;
  }, [base, w, h]);
}

/* ────────────────────────────────────────────────────────────────── */
/*  Instancing helper                                                 */
/* ────────────────────────────────────────────────────────────────── */

function Batch({
  matrices,
  colours,
  children,
}: {
  matrices: THREE.Matrix4[];
  colours?: THREE.Color[];
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    if (!ref.current) return;
    matrices.forEach((m, i) => ref.current.setMatrixAt(i, m));
    if (colours) colours.forEach((c, i) => ref.current.setColorAt(i, c));
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [matrices, colours]);

  if (matrices.length === 0) return null;
  return (
    // frustumCulled off: an InstancedMesh derives its bounding sphere from
    // the geometry at the origin, not from where the instances actually sit,
    // so a batch spread down the street gets culled wholesale the moment the
    // origin leaves frame. That was the "missing windows".
    <instancedMesh ref={ref} frustumCulled={false} args={[undefined, undefined, matrices.length]}>
      {children}
    </instancedMesh>
  );
}

const OFF = new THREE.Color(0, 0, 0);
const tmpCol = new THREE.Color();

/** Like Batch, but each instance lights at its own moment during the intro. */
function GlowBatch({
  matrices,
  colours,
  onAt,
  clock,
  children,
}: {
  matrices: THREE.Matrix4[];
  colours: THREE.Color[];
  onAt: number[];
  clock?: React.RefObject<{ t: number }>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const settled = useRef(false);

  useLayoutEffect(() => {
    if (!ref.current) return;
    matrices.forEach((m, i) => ref.current.setMatrixAt(i, m));
    colours.forEach((_, i) => ref.current.setColorAt(i, clock ? OFF : colours[i]));
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    settled.current = !clock;
  }, [matrices, colours, clock]);

  useFrame(() => {
    if (!clock?.current || settled.current || !ref.current) return;
    const t = clock.current.t;
    let all = true;
    for (let i = 0; i < colours.length; i++) {
      const k = (t - onAt[i]) / INTRO_WARMUP;
      if (k >= 1) {
        tmpCol.copy(colours[i]);
      } else if (k <= 0) {
        tmpCol.copy(OFF);
        all = false;
      } else {
        // the same stutter the lamps have, so a room reads as switching on
        tmpCol.copy(colours[i]).multiplyScalar(k * (0.5 + 0.5 * Math.abs(Math.sin(k * 24))));
        all = false;
      }
      ref.current.setColorAt(i, tmpCol);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    settled.current = all;
  });

  if (matrices.length === 0) return null;
  return (
    <instancedMesh ref={ref} frustumCulled={false} args={[undefined, undefined, matrices.length]}>
      {children}
    </instancedMesh>
  );
}

const scratch = new THREE.Object3D();
function mat(
  pos: [number, number, number],
  scale: [number, number, number] = [1, 1, 1],
  rot: [number, number, number] = [0, 0, 0],
) {
  scratch.position.set(...pos);
  scratch.scale.set(...scale);
  scratch.rotation.set(...rot);
  scratch.updateMatrix();
  return scratch.matrix.clone();
}

/* ────────────────────────────────────────────────────────────────── */
/*  Every window on the terrace, and everything hanging in it         */
/* ────────────────────────────────────────────────────────────────── */

function useWindowFurniture(data: Facade[]) {
  return useMemo(() => {
    const reveals: THREE.Matrix4[] = [];
    const interiors: THREE.Matrix4[] = [];
    const intCol: THREE.Color[] = [];
    const intAt: number[] = [];
    const archReveals: THREE.Matrix4[] = [];
    const archGlass: THREE.Matrix4[] = [];
    const archCol: THREE.Color[] = [];
    const archAt: number[] = [];
    const keystones: THREE.Matrix4[] = [];
    const barsV: THREE.Matrix4[] = [];
    const barsH: THREE.Matrix4[] = [];
    const sills: THREE.Matrix4[] = [];
    const lintels: THREE.Matrix4[] = [];
    const shutters: THREE.Matrix4[] = [];
    const rails: THREE.Matrix4[] = [];
    const balusters: THREE.Matrix4[] = [];
    const curtains: THREE.Matrix4[] = [];
    const wreaths: THREE.Matrix4[] = [];
    const wreathBerries: THREE.Matrix4[] = [];
    const boxes: THREE.Matrix4[] = [];
    const foliage: THREE.Matrix4[] = [];

    for (const b of data) {
      const rng = makeRng(b.seed);
      // a row building's |x| becomes -|x| in world z once the row is rotated,
      // so its distance from the camera is ||x| − |CAM_Z||
      const dist = Math.abs(Math.abs(b.x) - Math.abs(CAM_Z));
      // 0..3 — whether this building fills left-to-right or right-to-left,
      // and whether each column runs up or down
      const order = rng.int(0, 3);
      const st = STYLE[b.win];
      const floors = b.floors;
      const cols = Math.max(2, Math.round((b.w - 2.2) / (st.w + 1.4)));
      const step = (b.w - 2.4) / cols;
      // how bright this building is overall — some are mostly asleep
      const wakefulness = rng.range(0.5, 0.95);

      const seq = (f: number, c: number) => {
        const col = order & 1 ? cols - 1 - c : c;
        const row = order & 2 ? floors - 1 - f : f; // f = 0 is the ground-most storey
        return col * floors + row;
      };

      for (let f = 0; f < floors; f++) {
        for (let c = 0; c < cols; c++) {
          const wx = b.x - b.w / 2 + 1.2 + (c + 0.5) * step;
          const wy = GROUND_H + 2.1 + f * FLOOR_H;
          const lit = rng.chance(wakefulness);

          const col = new THREE.Color(lit ? rng.pick(WARM) : "#141d28");
          if (lit) col.multiplyScalar(rng.range(0.45, 1.05));

          reveals.push(mat([wx, wy, 0.02], [st.w + 0.5, st.h + 0.5, 0.34]));
          interiors.push(mat([wx, wy, 0.2], [st.w, st.h, 1]));
          intCol.push(col);
          intAt.push(litAt(dist, seq(f, c) * INTRO_WIN_STEP));

          // ── arched head, with a keystone
          if (st.arch) {
            const top = wy + st.h / 2;
            archReveals.push(mat([wx, top, 0.04], [st.w / 2 + 0.25, st.w / 2 + 0.25, 1]));
            archGlass.push(mat([wx, top, 0.2], [st.w / 2, st.w / 2, 1]));
            archCol.push(col);
            archAt.push(litAt(dist, seq(f, c) * INTRO_WIN_STEP));
            keystones.push(mat([wx, top + st.w / 2 + 0.08, 0.3], [0.34, 0.46, 0.4]));
          }

          // ── glazing bars, gridded to the style
          for (let i = 1; i < st.cols; i++) {
            barsV.push(mat([wx - st.w / 2 + (i * st.w) / st.cols, wy, 0.24], [0.07, st.h, 0.1]));
          }
          for (let i = 1; i < st.rows; i++) {
            barsH.push(mat([wx, wy - st.h / 2 + (i * st.h) / st.rows, 0.24], [st.w, 0.07, 0.1]));
          }
          // the surrounding frame: without it the outer panes run off into the
          // reveal and the grid looks like it stops short of the opening
          barsV.push(mat([wx - st.w / 2, wy, 0.24], [0.12, st.h + 0.12, 0.12]));
          barsV.push(mat([wx + st.w / 2, wy, 0.24], [0.12, st.h + 0.12, 0.12]));
          barsH.push(mat([wx, wy - st.h / 2, 0.24], [st.w + 0.12, 0.12, 0.12]));
          if (!st.arch) {
            barsH.push(mat([wx, wy + st.h / 2, 0.24], [st.w + 0.12, 0.12, 0.12]));
          }

          sills.push(mat([wx, wy - st.h / 2 - 0.22, 0.34], [st.w + 0.9, 0.2, 0.5]));
          if (!st.arch) {
            lintels.push(mat([wx, wy + st.h / 2 + 0.24, 0.28], [st.w + 0.75, 0.26, 0.4]));
          }

          // ── shutters, folded back against the wall
          if (st.shutters) {
            for (const s of [-1, 1]) {
              shutters.push(mat([wx + s * (st.w / 2 + 0.32), wy, 0.36], [0.58, st.h + 0.2, 0.14]));
            }
          }

          // ── a little iron balcony
          if (st.balcony) {
            const by = wy - st.h / 2;
            rails.push(mat([wx, by + 0.75, 0.62], [st.w + 0.9, 0.09, 0.09]));
            rails.push(mat([wx, by - 0.05, 0.62], [st.w + 0.9, 0.09, 0.09]));
            const n = Math.round((st.w + 0.9) / 0.3);
            for (let i = 0; i <= n; i++) {
              balusters.push(
                mat([wx - (st.w + 0.9) / 2 + i * 0.3, by + 0.35, 0.62], [0.05, 0.85, 0.05]),
              );
            }
          }

          if (lit) {
            if (rng.chance(0.5)) {
              for (const s of [-1, 1]) {
                curtains.push(mat([wx + s * (st.w / 2 - 0.26), wy, 0.21], [0.46, st.h * 0.94, 1]));
              }
            }
            if (rng.chance(0.34)) {
              const r = st.w * 0.26;
              wreaths.push(mat([wx, wy + 0.2, 0.215], [r / 0.62, r / 0.62, 0.7]));
              for (let k = 0; k < 5; k++) {
                const a = (k / 5) * Math.PI * 2 + rng.range(0, 1);
                wreathBerries.push(
                  mat([wx + Math.cos(a) * r, wy + 0.2 + Math.sin(a) * r, 0.225], [0.1, 0.1, 0.1]),
                );
              }
            }
          }

          if (f < 2 && rng.chance(0.45)) {
            boxes.push(mat([wx, wy - st.h / 2 - 0.52, 0.55], [st.w + 0.2, 0.42, 0.7]));
            for (let k = 0; k < 4; k++) {
              foliage.push(
                mat([wx - st.w / 2 + 0.28 + k * (st.w / 3.4), wy - st.h / 2 - 0.32, 0.6], [0.34, 0.3, 0.34]),
              );
            }
          }
        }
      }
    }

    return {
      reveals, interiors, intCol, intAt, archReveals, archGlass, archCol, archAt,
      keystones,
      barsV, barsH, sills, lintels, shutters, rails, balusters,
      curtains, wreaths, wreathBerries, boxes, foliage,
    };
  }, [data]);
}

export function Windows({
  ramp,
  data,
  clock,
}: {
  ramp: THREE.Texture;
  data: Facade[];
  clock?: React.RefObject<{ t: number }>;
}) {
  const f = useWindowFurniture(data);
  return (
    <group>
      <Batch matrices={f.reveals}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.archReveals}>
        <circleGeometry args={[1, 16, 0, Math.PI]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>

      <GlowBatch matrices={f.interiors} colours={f.intCol} onAt={f.intAt} clock={clock}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </GlowBatch>
      <GlowBatch matrices={f.archGlass} colours={f.archCol} onAt={f.archAt} clock={clock}>
        <circleGeometry args={[1, 16, 0, Math.PI]} />
        <meshBasicMaterial toneMapped={false} />
      </GlowBatch>

      {/* silhouetted against the lit room */}
      <Batch matrices={f.curtains}>
        <planeGeometry args={[1, 1]} />
        <primitive object={ACCENT.curtain} attach="material" />
      </Batch>
      <Batch matrices={f.wreaths}>
        <torusGeometry args={[0.62, 0.16, 6, 14]} />
        <meshToonMaterial color={GREEN} gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.wreathBerries}>
        <sphereGeometry args={[1, 6, 6]} />
        <primitive object={ACCENT.berry} attach="material" />
      </Batch>

      {/* joinery in front of the glass */}
      <Batch matrices={f.barsV}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.barsH}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>

      <Batch matrices={f.lintels}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#6d7d92" gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.keystones}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#8092a8" gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.sills}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={SNOW} gradientMap={ramp} />
      </Batch>

      <Batch matrices={f.shutters}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#33414f" gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.rails}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.balusters}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </Batch>

      <Batch matrices={f.boxes}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#4a3524" gradientMap={ramp} />
      </Batch>
      <Batch matrices={f.foliage}>
        <sphereGeometry args={[1, 7, 6]} />
        <meshToonMaterial color={GREEN_HI} gradientMap={ramp} />
      </Batch>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Roofs                                                             */
/* ────────────────────────────────────────────────────────────────── */

function Roof({ b, ramp }: { b: Facade; ramp: THREE.Texture }) {
  const dark = useMemo(() => new THREE.Color(b.colour).multiplyScalar(0.5).getStyle(), [b.colour]);

  if (b.roof === "pitched") {
    const rise = 2.6;
    const slope = Math.sqrt((b.d / 2) ** 2 + rise ** 2) + 0.3;
    const angle = Math.atan2(rise, b.d / 2);
    return (
      <group position={[b.x, b.h, -b.d / 2]}>
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh position={[0, rise / 2, (s * b.d) / 4]} rotation={[s * angle, 0, 0]}>
              <boxGeometry args={[b.w + 0.5, 0.26, slope]} />
              <meshToonMaterial color={dark} gradientMap={ramp} />
              <Outlines thickness={0.04} color={INK} />
            </mesh>
            <mesh position={[0, rise / 2 + 0.17, (s * b.d) / 4]} rotation={[s * angle, 0, 0]}>
              <boxGeometry args={[b.w + 0.3, 0.12, slope * 0.9]} />
              <meshToonMaterial color={SNOW} gradientMap={ramp} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (b.roof === "stepped") {
    return (
      <group position={[b.x, b.h, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const sw = b.w * (1 - i * 0.19);
          const sy = 0.5 + i * 0.85;
          return (
            <group key={i}>
              <mesh position={[0, sy, -b.d / 2]}>
                <boxGeometry args={[sw, 0.9, b.d * 0.5]} />
                <meshToonMaterial color={i % 2 ? dark : b.trim} gradientMap={ramp} />
                <Outlines thickness={0.04} color={INK} />
              </mesh>
              <mesh position={[0, sy + 0.5, -b.d / 2]}>
                <boxGeometry args={[sw + 0.16, 0.14, b.d * 0.5 + 0.16]} />
                <meshToonMaterial color={SNOW} gradientMap={ramp} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (b.roof === "flat") {
    return (
      <group position={[b.x, b.h, 0]}>
        <mesh position={[0, 0.14, -b.d / 2]}>
          <boxGeometry args={[b.w, 0.28, b.d]} />
          <meshToonMaterial color={SNOW} gradientMap={ramp} />
        </mesh>
        <mesh position={[0, 0.6, 0.05]}>
          <boxGeometry args={[b.w + 0.5, 1.2, 0.4]} />
          <meshToonMaterial color={b.trim} gradientMap={ramp} />
          <Outlines thickness={0.04} color={INK} />
        </mesh>
        {/* balusters along the parapet */}
        {Array.from({ length: Math.floor(b.w / 1.1) }, (_, i) => (
          <mesh key={i} position={[-b.w / 2 + 0.6 + i * 1.1, 0.62, 0.3]}>
            <cylinderGeometry args={[0.12, 0.16, 1, 6]} />
            <meshToonMaterial color={b.trim} gradientMap={ramp} />
          </mesh>
        ))}
        <mesh position={[0, 1.28, 0.05]}>
          <boxGeometry args={[b.w + 0.7, 0.18, 0.6]} />
          <meshToonMaterial color={SNOW} gradientMap={ramp} />
        </mesh>
      </group>
    );
  }

  // mansard with dormers
  return (
    <group position={[b.x, b.h, -b.d / 2]}>
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[b.w / 3, 1, b.d / 3]}>
        <cylinderGeometry args={[1.7, 2.12, 2.8, 4]} />
        <meshToonMaterial color={dark} gradientMap={ramp} />
        <Outlines thickness={0.04} color={INK} />
      </mesh>
      <mesh position={[0, 2.86, 0]} rotation={[0, Math.PI / 4, 0]} scale={[b.w / 3, 1, b.d / 3]}>
        <cylinderGeometry args={[1.72, 1.72, 0.18, 4]} />
        <meshToonMaterial color={SNOW} gradientMap={ramp} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * b.w) / 4.6, 1.1, b.d / 2 - 0.5]}>
          <mesh>
            <boxGeometry args={[1.8, 1.9, 1.4]} />
            <meshToonMaterial color={b.trim} gradientMap={ramp} />
            <Outlines thickness={0.035} color={INK} />
          </mesh>
          <mesh position={[0, 0, 0.72]}>
            <planeGeometry args={[1.1, 1.3]} />
            <primitive object={ACCENT.dormer} attach="material" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[2, 0.16, 1.6]} />
            <meshToonMaterial color={SNOW} gradientMap={ramp} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Ground floor                                                      */
/* ────────────────────────────────────────────────────────────────── */

function GroundFloor({
  b,
  ramp,
  clock,
}: {
  b: Facade;
  ramp: THREE.Texture;
  clock?: React.RefObject<{ t: number }>;
}) {
  const glow = useRef<THREE.MeshBasicMaterial[]>([]);
  const base = useRef<THREE.Color[]>([]);
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  const lightMax = useRef<number[]>([]);
  const settled = useRef(false);
  const at = litAt(Math.abs(Math.abs(b.x) - Math.abs(CAM_Z)), 0.15);

  const holdLight = (l: THREE.PointLight | null, i: number, full: number) => {
    if (!l) return;
    lights.current[i] = l;
    lightMax.current[i] = full;
    if (clock) l.intensity = 0;
  };

  const hold = (m: THREE.MeshBasicMaterial | null, i: number) => {
    if (!m) return;
    glow.current[i] = m;
    if (!base.current[i]) {
      base.current[i] = m.color.clone();
      if (clock) m.color.setRGB(0, 0, 0);
    }
  };

  useFrame(() => {
    if (!clock?.current || settled.current) return;
    const k = (clock.current.t - at) / INTRO_WARMUP;
    const f = k >= 1 ? 1 : k <= 0 ? 0 : k * (0.5 + 0.5 * Math.abs(Math.sin(k * 24)));
    glow.current.forEach((m, i) => {
      if (m && base.current[i]) m.color.copy(base.current[i]).multiplyScalar(f);
    });
    lights.current.forEach((l, i) => {
      if (l) l.intensity = (lightMax.current[i] ?? 0) * f;
    });
    if (k >= 1) settled.current = true;
  });


  if (b.shop === "door") {
    return (
      <group>
        <mesh position={[b.x, GROUND_H / 2 - 0.4, 0.06]}>
          <boxGeometry args={[b.w - 1.4, GROUND_H - 0.8, 0.3]} />
          <meshToonMaterial color={b.trim} gradientMap={ramp} />
        </mesh>
        <mesh position={[b.x, 2.1, 0.26]}>
          <planeGeometry args={[2.6, 4.2]} />
          <meshToonMaterial color="#17403c" gradientMap={ramp} />
        </mesh>
        {/* fanlight over the door */}
        <mesh position={[b.x, 4.5, 0.28]}>
          <circleGeometry args={[1.35, 18, 0, Math.PI]} />
          <meshBasicMaterial ref={(m) => hold(m, 0)} color="#dcae70" toneMapped={false} />
        </mesh>
        <mesh position={[b.x, 3.05, 0.32]}>
          <torusGeometry args={[0.66, 0.17, 6, 14]} />
          <meshToonMaterial color={GREEN} gradientMap={ramp} />
        </mesh>
        {[-1.6, 1.6].map((dx, li) => (
          <group key={dx} position={[b.x + dx, 4.2, 0.5]}>
            <mesh>
              <boxGeometry args={[0.34, 0.5, 0.34]} />
              <meshBasicMaterial ref={(m) => hold(m, 1)} color="#dcae70" toneMapped={false} />
            </mesh>
            <pointLight ref={(l) => holdLight(l, li, 9)} color="#ffc06a" intensity={0} distance={7} decay={2.3} />
          </group>
        ))}
        <mesh position={[b.x, 0.16, 0.9]}>
          <boxGeometry args={[3.6, 0.32, 1.8]} />
          <meshToonMaterial color={SNOW} gradientMap={ramp} />
          <Outlines thickness={0.03} color={INK} />
        </mesh>
      </group>
    );
  }

  if (b.shop === "plain") {
    return (
      <mesh position={[b.x, GROUND_H / 2, 0.06]}>
        <boxGeometry args={[b.w - 0.6, GROUND_H, 0.2]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </mesh>
    );
  }

  const glassW = b.w - 1.8;
  return (
    <group>
      {/* the lit shop window */}
      <mesh position={[b.x, GROUND_H / 2 - 0.3, 0.24]}>
        <planeGeometry args={[glassW, GROUND_H - 1.6]} />
        <meshBasicMaterial ref={(m) => hold(m, 2)} color="#d99f57" toneMapped={false} />
      </mesh>
      {/* Just depth behind the glass — a counter line and a darker back wall.
          Literal objects read as icons at this distance; light does not. */}
      <mesh position={[b.x, 1.15, 0.29]}>
        <planeGeometry args={[glassW - 0.5, 0.9]} />
        <meshBasicMaterial ref={(m) => hold(m, 3)} color="#a86a24" toneMapped={false} />
      </mesh>
      <mesh position={[b.x, 3.5, 0.28]}>
        <planeGeometry args={[glassW, 1.2]} />
        <meshBasicMaterial ref={(m) => hold(m, 4)} color="#c98a3e" toneMapped={false} />
      </mesh>

      {/* mullions */}
      {[-0.33, 0, 0.33].map((t) => (
        <mesh key={t} position={[b.x + t * glassW, GROUND_H / 2 - 0.3, 0.32]}>
          <boxGeometry args={[0.12, GROUND_H - 1.6, 0.12]} />
          <meshToonMaterial color={INK} gradientMap={ramp} />
        </mesh>
      ))}
      <mesh position={[b.x, 0.5, 0.32]}>
        <boxGeometry args={[glassW + 0.6, 1, 0.3]} />
        <meshToonMaterial color={INK} gradientMap={ramp} />
      </mesh>
      {/* light leaking out of the shop, off until the shop is lit */}
      <pointLight
        ref={(l) => holdLight(l, 0, 7)}
        position={[b.x, GROUND_H - 2.2, 0.5]}
        color="#ffb45c"
        intensity={0}
        distance={8}
        decay={2.2}
      />

      {/* fascia + awning */}
      <mesh position={[b.x, GROUND_H + 0.35, 0.34]}>
        <boxGeometry args={[b.w - 0.3, 1, 0.42]} />
        <meshToonMaterial color={b.trim} gradientMap={ramp} />
        <Outlines thickness={0.035} color={INK} />
      </mesh>
      {b.awning ? (
        <>
          <mesh position={[b.x, GROUND_H - 0.28, 0.95]} rotation={[-0.36, 0, 0]}>
            <boxGeometry args={[b.w - 0.4, 0.16, 1.7]} />
            <meshToonMaterial color={b.accent ?? "#8f2f26"} gradientMap={ramp} />
            <Outlines thickness={0.035} color={INK} />
          </mesh>
          <mesh position={[b.x, GROUND_H - 0.12, 0.98]} rotation={[-0.36, 0, 0]}>
            <boxGeometry args={[b.w - 0.5, 0.1, 1.55]} />
            <meshToonMaterial color={SNOW} gradientMap={ramp} />
          </mesh>
        </>
      ) : (
        /* no awning: a projecting sign on a bracket instead */
        <>
          <mesh position={[b.x + b.w / 2 - 1.2, GROUND_H + 0.4, 0.9]}>
            <boxGeometry args={[0.08, 0.08, 1.3]} />
            <meshToonMaterial color={INK} gradientMap={ramp} />
          </mesh>
          <mesh position={[b.x + b.w / 2 - 1.2, GROUND_H - 0.18, 1.45]}>
            <boxGeometry args={[0.1, 1.1, 0.85]} />
            <meshToonMaterial color={b.accent ?? "#8f2f26"} gradientMap={ramp} />
            <Outlines thickness={0.03} color={INK} />
          </mesh>
        </>
      )}

      {/* garland swagged across the fascia */}
      {Array.from({ length: 14 }, (_, i) => {
        const t = i / 13;
        const sag = Math.sin(t * Math.PI) * 0.55;
        return (
          <mesh key={i} position={[b.x - (b.w - 1.4) / 2 + t * (b.w - 1.4), GROUND_H + 1.1 - sag, 0.6]}>
            <sphereGeometry args={[0.24, 6, 5]} />
            <meshToonMaterial color={i % 4 === 0 ? GREEN_HI : GREEN} gradientMap={ramp} />
          </mesh>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const t = (i + 0.5) / 6;
        const sag = Math.sin(t * Math.PI) * 0.55;
        return (
          <mesh key={`b${i}`} position={[b.x - (b.w - 1.4) / 2 + t * (b.w - 1.4), GROUND_H + 1.0 - sag, 0.78]}>
            <sphereGeometry args={[0.13, 6, 5]} />
            <primitive object={i % 2 ? ACCENT.gold : ACCENT.berry} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */

function Body({ b, ramp, base }: { b: Facade; ramp: THREE.Texture; base: THREE.Texture }) {
  const map = useWallMap(base, b.w, b.h);
  return (
    <mesh position={[b.x, b.h / 2, -b.d / 2]}>
      <boxGeometry args={[b.w, b.h, b.d]} />
      <meshToonMaterial map={map} color={b.colour} gradientMap={ramp} />
      <Outlines thickness={0.06} color={INK} />
    </mesh>
  );
}

export function Terrace({
  ramp,
  data = TERRACE,
  clock,
}: {
  ramp: THREE.Texture;
  data?: Facade[];
  clock?: React.RefObject<{ t: number }>;
}) {
  const walls = useWallTextures();
  return (
    <group>
      {data.map((b) => (
        <group key={b.id}>
          <Body b={b} ramp={ramp} base={walls[b.wall]} />

          {/* cornice */}
          <mesh position={[b.x, b.h - 0.35, -b.d / 2]}>
            <boxGeometry args={[b.w + 0.5, 0.7, b.d + 0.36]} />
            <meshToonMaterial color={b.trim} gradientMap={ramp} />
            <Outlines thickness={0.04} color={INK} />
          </mesh>
          <mesh position={[b.x, b.h + 0.08, -b.d / 2]}>
            <boxGeometry args={[b.w + 0.6, 0.16, b.d + 0.46]} />
            <meshToonMaterial color={SNOW} gradientMap={ramp} />
          </mesh>

          {/* a band between every floor */}
          {Array.from({ length: b.floors }, (_, f) => (
            <mesh key={f} position={[b.x, GROUND_H + 4.1 + f * FLOOR_H, 0.16]}>
              <boxGeometry args={[b.w + 0.1, 0.22, 0.34]} />
              <meshToonMaterial color={b.trim} gradientMap={ramp} />
            </mesh>
          ))}

          <Roof b={b} ramp={ramp} />
          <GroundFloor b={b} ramp={ramp} clock={clock} />
        </group>
      ))}
      <Windows ramp={ramp} data={data} clock={clock} />
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  The rows that line the street.                                    */
/*  Rendered inside a rotated group, so the same front-facing code    */
/*  builds facades that look sideways across the road.                */
/* ────────────────────────────────────────────────────────────────── */

export const STREET_HALF = 10;

function makeRow(seed: number, count: number, sign: 1 | -1): Facade[] {
  const rng = makeRng(seed);
  // Three families only: deep dark red, deep dark blue, deep dark brown.
  // Two shades of each so neighbours differ without introducing a new hue.
  // These sit a little above the intended tone because the wall texture is a
  // multiplier and pulls them down again.
  const palettes: [string, string][] = [
    ["#6b2721", "#8c4036"], // deep red
    ["#57201b", "#79352c"],
    ["#22324c", "#3a5372"], // deep blue
    ["#1a2740", "#304560"],
    ["#493524", "#6a5038"], // deep brown
    ["#3b2a1c", "#59432d"],
  ];
  const roofs: Facade["roof"][] = ["mansard", "flat", "pitched", "stepped"];
  const wins: WinStyle[] = ["sash", "arched", "french", "shuttered"];
  const walls: Facade["wall"][] = ["brick", "brick", "stone", "stucco"];
  const out: Facade[] = [];
  let x = 4;
  for (let i = 0; i < count; i++) {
    const w = rng.range(8.5, 13);
    const [colour, trim] = rng.pick(palettes);
    // two storeys to six, which is a genuinely ragged roofline
    const floors = rng.int(2, 6);
    out.push({
      id: `${seed}-${i}`,
      // sign flips the whole row for the far side of the street: with a
      // −90° group rotation, local +x maps to world +z, which would march
      // the row toward the camera instead of away from it.
      x: sign * (x + w / 2),
      w,
      floors,
      h: GROUND_H + floors * FLOOR_H + rng.range(1.6, 3.2),
      d: rng.range(7, 10),
      colour,
      trim,
      roof: rng.pick(roofs),
      win: rng.pick(wins),
      wall: rng.pick(walls),
      awning: rng.chance(0.62),
      shop: i < 4 ? "shopfront" : rng.chance(0.4) ? "shopfront" : "plain",
      accent: rng.pick(["#8f2f26", "#1f4a45", "#2f5a52", "#6b4a2a"]),
      seed: seed * 100 + i,
    });
    x += w + rng.range(0.2, 0.9);
  }
  return out;
}

/* Long enough that the far end is pure fog rather than a visible stop. */
export const LEFT_ROW = makeRow(717, 16, 1);
export const RIGHT_ROW = makeRow(919, 16, -1);

/** Where a row building actually ends up in world space. */
export function placeOf(row: Facade[], index: number, side: 1 | -1) {
  const b = row[index];
  return {
    x: side * STREET_HALF,
    z: side === -1 ? -b.x : b.x,
    w: b.w,
    rotY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
  };
}

/* ────────────────────────────────────────────────────────────────── */
/*  Standing street lamps — cast-iron post, glazed lantern, and a     */
/*  garland wound round the neck.                                     */
/* ────────────────────────────────────────────────────────────────── */

const LAMP_H = 4.9;

/* Intro timing, in seconds from when the scene mounts. */
/** Where the camera sits, so "distance down the street" is measured from it. */
export const CAM_Z = -16;

export const FIRST_LAMP_AT = 0.25; // the one lamp that lights on its own
export const HOLD_T = 0.95; // clock parks here until the visitor clicks
export const INTRO_FIRST = 1.3; // everything else starts after that click
export const INTRO_PER_UNIT = 0.016; // seconds per unit further down the street
export const INTRO_WIN_STEP = 0.2; // gap between one window and the next
export const INTRO_WARMUP = 0.42; // how long one light takes to strike
export const INTRO_END = INTRO_FIRST + 200 * INTRO_PER_UNIT + 26 * INTRO_WIN_STEP + INTRO_WARMUP;

/** When a thing this far down the street should come on. */
export const litAt = (dist: number, jitter = 0) =>
  INTRO_FIRST + dist * INTRO_PER_UNIT + jitter;

/** Letters set along an arc, arriving one at a time. */
function CircleLabel({
  text,
  radius,
  arc = 150,
}: {
  text: string;
  radius: number;
  /** degrees the phrase spans, centred on the top of the circle */
  arc?: number;
}) {
  const chars = [...text];
  const step = arc / Math.max(1, chars.length - 1);
  const start = -arc / 2;
  return (
    <div className="relative h-0 w-0 select-none">
      {chars.map((ch, i) => (
        <span
          key={i}
          className="absolute left-0 top-0 font-mono text-[11px] font-medium uppercase text-white"
          style={{
            // translate first, then rotate about the centre, so each glyph
            // sits tangent to the circle
            transform: `rotate(${start + i * step}deg) translate(-50%, -${radius}px)`,
            transformOrigin: "0 0",
            opacity: 0,
            animation: `fadeIn 0.45s ease-out ${0.06 * i}s forwards`,
            textShadow: "0 0 10px rgba(0,0,0,0.85)",
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </div>
  );
}

const LAMP_OFF = new THREE.Color("#1a1e26");
const LAMP_ON = new THREE.Color("#ffcb85");

function LampPost({
  p,
  ramp,
  clock,
  first = false,
  prompt = false,
  onPrompt,
}: {
  p: [number, number, number];
  ramp: THREE.Texture;
  clock?: React.RefObject<{ t: number }>;
  first?: boolean;
  prompt?: boolean;
  onPrompt?: () => void;
}) {
  const [x, y, z] = p;
  const light = useRef<THREE.PointLight>(null);
  const glass = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const decal = useGlowDecal();

  useFrame(() => {
    if (!clock?.current || !light.current || !glass.current) return;
    const at = first ? FIRST_LAMP_AT : litAt(Math.abs(z - CAM_Z));
    const raw = (clock.current.t - at) / INTRO_WARMUP;
    const k = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
    // a filament stutters before it settles
    const f = k >= 1 ? 1 : k * (0.55 + 0.45 * Math.abs(Math.sin(k * 26)));
    light.current.intensity = 46 * f;
    glass.current.color.copy(LAMP_OFF).lerp(LAMP_ON, f);
    // the pools on the ground are emissive, so they have to be driven too
    if (pool.current) pool.current.opacity = 0.5 * f;
    if (spill.current) spill.current.opacity = 0.34 * f;
  });

  return (
    <group position={[x, y, z]}>
      {/* stepped base */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.46, 0.56, 0.32, 8]} />
        <meshToonMaterial color="#141b25" gradientMap={ramp} />
        <Outlines thickness={0.03} color={INK} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.3, 0.42, 0.42, 8]} />
        <meshToonMaterial color="#141b25" gradientMap={ramp} />
      </mesh>
      {/* tapered column */}
      <mesh position={[0, LAMP_H / 2 + 0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.19, LAMP_H, 8]} />
        <meshToonMaterial color="#161e29" gradientMap={ramp} />
        <Outlines thickness={0.025} color={INK} />
      </mesh>
      {/* collar under the lantern */}
      <mesh position={[0, LAMP_H + 0.62, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.22, 8]} />
        <meshToonMaterial color="#1d2733" gradientMap={ramp} />
      </mesh>
      {/* the glass: a four-sided lantern, tapering upward */}
      <mesh position={[0, LAMP_H + 1.28, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.26, 0.38, 1.1, 4]} />
        <meshBasicMaterial ref={glass} color="#1a1e26" toneMapped={false} />
      </mesh>
      {/* corner bars of the cage */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, LAMP_H + 1.28, Math.sin(a) * 0.3]}>
            <boxGeometry args={[0.06, 1.14, 0.06]} />
            <meshToonMaterial color={INK} gradientMap={ramp} />
          </mesh>
        );
      })}
      {/* cap and finial */}
      <mesh position={[0, LAMP_H + 2.02, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.06, 0.44, 0.44, 4]} />
        <meshToonMaterial color="#141b25" gradientMap={ramp} />
        <Outlines thickness={0.025} color={INK} />
      </mesh>
      <mesh position={[0, LAMP_H + 2.36, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <primitive object={ACCENT.gold} attach="material" />
      </mesh>

      <pointLight ref={light} position={[0, LAMP_H + 1.2, 0]} color="#ff9f42" intensity={0} distance={24} decay={2} />

      {first && prompt && (
        <>
          {/* An invisible sphere over the lantern: a generous, stationary
              click target. The lantern glass itself is far too small to hit
              while the camera is drifting under the pointer. */}
          <mesh
            position={[0, LAMP_H + 1.28, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPrompt?.();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <sphereGeometry args={[1.15, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* the words, set round the lamp head */}
          <Html center position={[0, LAMP_H + 1.28, 0]} zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
            <CircleLabel text="CLICK HERE" radius={96} arc={128} />
          </Html>
        </>
      )}

      {/* light lying on the pavement, and spilling off the kerb */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial ref={pool} map={decal} color="#ffb257" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[-Math.sign(x) * 3.4, -y + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 11]} />
        <meshBasicMaterial ref={spill} map={decal} color="#ff9f42" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function useGlowDecal() {
  return useMemo(() => {
    const size = 256;
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const g = cv.getContext("2d")!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.34)");
    grad.addColorStop(0.7, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

export function StreetLamps({
  positions,
  ramp,
  clock,
  prompt = false,
  onPrompt,
}: {
  positions: [number, number, number][];
  ramp: THREE.Texture;
  clock?: React.RefObject<{ t: number }>;
  prompt?: boolean;
  onPrompt?: () => void;
}) {
  // The nearest lamp on the right-hand pavement that is actually in front of
  // the camera. Lamps alternate sides and the first two sit behind us, so
  // neither "index 0" nor "nearest overall" gives the one you can see.
  const firstIdx = useMemo(() => {
    let best = 0;
    let d = Infinity;
    positions.forEach((p, i) => {
      const ahead = CAM_Z - p[2];
      if (p[0] > 0 && ahead > 4 && ahead < d) {
        d = ahead;
        best = i;
      }
    });
    return best;
  }, [positions]);


  return (
    <group>
      {positions.map((p, i) => (
        <LampPost key={i} p={p} ramp={ramp} clock={clock} first={i === firstIdx} prompt={prompt} onPrompt={onPrompt} />
      ))}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Pavement                                                          */
/*                                                                    */
/*  A raised walkway either side, from the shopfronts out to a kerb.   */
/*  The lamps stand on this, which is also what keeps them clear of    */
/*  the awnings — those project about 1.8 units from each facade.      */
/* ────────────────────────────────────────────────────────────────── */

export const PAVEMENT_W = 3.4;
export const PAVEMENT_H = 0.34;

export function Pavement({
  streetHalf,
  ramp,
  paving,
}: {
  streetHalf: number;
  ramp: THREE.Texture;
  paving: THREE.Texture;
}) {
  const len = 260;
  const midZ = -95;
  return (
    <group>
      {[-1, 1].map((side) => {
        const cx = side * (streetHalf - PAVEMENT_W / 2);
        const kerbX = side * (streetHalf - PAVEMENT_W);
        return (
          <group key={side}>
            {/* the slab */}
            <mesh position={[cx, PAVEMENT_H / 2, midZ]}>
              <boxGeometry args={[PAVEMENT_W, PAVEMENT_H, len]} />
              <meshToonMaterial map={paving} color="#cfd9e6" gradientMap={ramp} />
            </mesh>
            {/* kerb stone along the street edge, standing slightly proud */}
            <mesh position={[kerbX, PAVEMENT_H / 2 + 0.03, midZ]}>
              <boxGeometry args={[0.3, PAVEMENT_H + 0.06, len]} />
              <meshToonMaterial color="#8d99ab" gradientMap={ramp} />
            </mesh>
            {/* snow banked against the shopfronts */}
            <mesh position={[side * (streetHalf - 0.35), PAVEMENT_H + 0.08, midZ]}>
              <boxGeometry args={[0.7, 0.22, len]} />
              <meshToonMaterial color="#e6edf6" gradientMap={ramp} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Snow lying on the road                                            */
/*                                                                    */
/*  Two things read as settled snow: soft-edged patches lying over the */
/*  cobbles where it hasn't been walked off, and banks pushed up       */
/*  against the kerbs where it has.                                    */
/* ────────────────────────────────────────────────────────────────── */

function useSnowPatch() {
  return useMemo(() => {
    const size = 256;
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const g = cv.getContext("2d")!;
    const rng = makeRng(3311);
    g.clearRect(0, 0, size, size);

    // Build the mass from lobes spread right across the canvas, not clustered
    // in the middle — circles centred near the centre just average out into a
    // smooth oval, which is what made these read as puddles.
    for (let i = 0; i < 40; i++) {
      const r = rng.range(size * 0.06, size * 0.2);
      const cx = rng.range(r, size - r);
      const cy = rng.range(r, size - r);
      const grad = g.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.75, "rgba(255,255,255,0.92)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }

    // Then bite chunks out of it. Erasing is what actually produces a ragged
    // silhouette — additive lobes alone can only ever round the shape off.
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 46; i++) {
      const r = rng.range(size * 0.05, size * 0.19);
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(size * 0.26, size * 0.52);
      const cx = size / 2 + Math.cos(a) * d;
      const cy = size / 2 + Math.sin(a) * d;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

export function StreetSnow({
  streetHalf,
  ramp,
  length = 240,
  from = 12,
}: {
  streetHalf: number;
  ramp: THREE.Texture;
  length?: number;
  from?: number;
}) {
  const patch = useSnowPatch();
  const kerbX = streetHalf - PAVEMENT_W;

  const { patches, banks } = useMemo(() => {
    const rng = makeRng(6161);
    const patches: THREE.Matrix4[] = [];
    const banks: THREE.Matrix4[] = [];

    for (let i = 0; i < 460; i++) {
      const z = from - rng.range(0, length);
      // more of it toward the gutters, less down the middle where it's walked
      const edge = rng.chance(0.55);
      const x = edge
        ? (rng.chance(0.5) ? -1 : 1) * rng.range(kerbX * 0.45, kerbX - 0.3)
        : rng.range(-kerbX * 0.5, kerbX * 0.5);
      const sc = rng.range(2, 6);
      patches.push(
        mat([x, 0.035, z], [sc, sc * rng.range(0.6, 1.1), 1], [-Math.PI / 2, 0, rng.range(0, Math.PI)]),
      );
    }

    // and lying on the pavements — deeper against the shopfronts, thinner
    // near the kerb where people actually walk
    for (const side of [-1, 1]) {
      for (let i = 0; i < 190; i++) {
        const z = from - rng.range(0, length);
        const t = Math.pow(rng.range(0, 1), 0.6); // biased to the wall side
        const x = side * (kerbX + 0.2 + t * (PAVEMENT_W - 0.4));
        const sc = rng.range(1, 2.6);
        patches.push(
          mat(
            [x, PAVEMENT_H + 0.04, z],
            [sc, sc * rng.range(0.6, 1.15), 1],
            [-Math.PI / 2, 0, rng.range(0, Math.PI)],
          ),
        );
      }
      // little drifts piled where the pavement meets the shopfronts
      for (let i = 0; i < 46; i++) {
        const z = from - rng.range(0, length);
        const h = rng.range(0.18, 0.46);
        banks.push(
          mat(
            [side * (streetHalf - rng.range(0.3, 1.1)), PAVEMENT_H + h / 2, z],
            [rng.range(0.7, 1.4), h, rng.range(5, 13)],
          ),
        );
      }
    }

    // banks shovelled against both kerbs
    for (const side of [-1, 1]) {
      let z = from;
      while (z > from - length) {
        const len = rng.range(4, 12);
        const h = rng.range(0.3, 0.72);
        banks.push(
          mat([side * (kerbX - rng.range(0.25, 0.7)), h / 2, z - len / 2], [rng.range(0.9, 1.6), h, len * rng.range(1.4, 2.2)]),
        );
        z -= len + rng.range(0.2, 1.8);
      }
    }
    return { patches, banks };
  }, [kerbX, streetHalf, length, from]);

  return (
    <group>
      <Batch matrices={patches}>
        <planeGeometry args={[1, 1]} />
        <meshToonMaterial
          map={patch}
          color="#eef3fa"
          gradientMap={ramp}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </Batch>
      <Batch matrices={banks}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshToonMaterial color="#e4ebf5" gradientMap={ramp} />
      </Batch>
    </group>
  );
}
