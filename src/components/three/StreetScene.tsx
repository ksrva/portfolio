"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { makeRng } from "@/lib/rand";
import { INK, LEFT_ROW, PAVEMENT_H, PAVEMENT_W, Pavement, RIGHT_ROW, STREET_END, STREET_HALF, StreetLamps, StreetSnow, Terrace, featureHover, placeOf, setAccentGlow, HOLD_T, INTRO_FIRST, INTRO_END } from "./buildings";

/* ═══════════════════════════════════════════════════════════════════
   A night street, built rather than drawn — and then deliberately
   un-rendered so it reads as illustration.

   Default three.js looks like CG because PBR is physically correct.
   Illustration isn't. Four things break the realism on purpose:

     1. no reflections, no specular — mirror finish is the loudest
        "this is 3D" tell there is;
     2. toon shading — light is quantised into 3 flat bands by a
        gradient ramp, so surfaces read as filled shapes;
     3. inverted-hull outlines — every form drawn a second time,
        slightly larger and inside-out in near-black, which puts an
        ink line around it;
     4. posterise + grain in post, so the final frame reads as printed
        rather than rendered.

   What stays physical: the windows are real emissive sources feeding a
   real bloom pass, and the fog is real depth. Those are the parts a
   flat illustration can't do, so they're worth keeping.
   ═══════════════════════════════════════════════════════════════════ */

const WARM = ["#d9a055", "#c98a3e", "#e6b878", "#bf7a30", "#d49b57", "#ab672a"];

type Building = { pos: [number, number, number]; size: [number, number, number]; tone: number };
type Win = { x: number; y: number; z: number; side: number; color: THREE.Color };

/** A 3-step ramp. Nearest filtering is what makes the bands hard. */
/** Vertical sky gradient: night above, snow-haze at the vanishing point. */
function useSkyGradient() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 8;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#070c17");
    grad.addColorStop(0.42, "#111a2b");
    grad.addColorStop(0.72, "#26354a");
    grad.addColorStop(0.9, "#3f5069");
    grad.addColorStop(1, "#4e6178");
    g.fillStyle = grad;
    g.fillRect(0, 0, 8, 256);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/** A cobbled road, drawn once into a canvas and tiled down the street. */
function useCobbles() {
  return useMemo(() => {
    const size = 1024;
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const g = cv.getContext("2d")!;
    const rng = makeRng(8123);

    // mortar
    g.fillStyle = "#4b5568";
    g.fillRect(0, 0, size, size);

    const rows = 22;
    const cols = 22;
    const cw = size / cols;
    const ch = size / rows;
    for (let r = -1; r <= rows; r++) {
      // every other course is offset by half a stone, like real setts
      const off = (r % 2) * (cw / 2);
      for (let i = -1; i <= cols; i++) {
        const cx = off + i * cw + rng.range(-2, 2);
        const cy = r * ch + rng.range(-2, 2);
        const w = cw * rng.range(0.74, 0.94);
        const h = ch * rng.range(0.72, 0.92);
        const v = rng.range(0.62, 1);
        g.fillStyle = `rgb(${Math.round(178 * v)},${Math.round(190 * v)},${Math.round(212 * v)})`;
        g.beginPath();
        g.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) * 0.34);
        g.fill();
        // a lit top edge on each stone so they read as domed
        g.fillStyle = `rgba(232,241,252,${rng.range(0.10, 0.24).toFixed(3)})`;
        g.beginPath();
        g.roundRect(cx - w / 2, cy - h / 2, w, h * 0.34, Math.min(w, h) * 0.3);
        g.fill();
      }
    }

    // snow lying in the joints and drifting across
    for (let i = 0; i < 150; i++) {
      g.fillStyle = `rgba(226,236,247,${rng.range(0.08, 0.42).toFixed(3)})`;
      g.beginPath();
      g.ellipse(
        rng.range(0, size),
        rng.range(0, size),
        rng.range(14, 78),
        rng.range(9, 38),
        rng.range(0, Math.PI),
        0,
        Math.PI * 2,
      );
      g.fill();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(18, 31);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
  }, []);
}

export function useToonRamp() {
  return useMemo(() => {
    const steps = new Uint8Array([64, 132, 198, 255]);
    const tex = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function useTown() {
  return useMemo(() => {
    const rng = makeRng(20260806);
    const buildings: Building[] = [];
    const windows: Win[] = [];
    const lamps: [number, number, number][] = [];

    // A skyline behind and above the terrace, well back in the fog. It only
    // has to give the roofline something to sit against.
    for (let row = 0; row < 3; row++) {
      const z = -105 - row * 16;
      let x = -46;
      while (x < 46) {
        const w = rng.range(5, 11);
        const h = rng.range(9, 24) - row * 1.5;
        buildings.push({ pos: [x + w / 2, h / 2, z], size: [w, h, rng.range(5, 9)], tone: rng.range(0, 1) });

        const rows = Math.max(2, Math.floor((h - 3) / 2.2));
        const cols = Math.max(1, Math.floor(w / 2.2));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const lit = rng.chance(0.45);
            const base = new THREE.Color(lit ? rng.pick(WARM) : "#0a0f16");
            if (lit) base.multiplyScalar(rng.range(0.35, 0.85));
            windows.push({
              x: x + 1 + c * 2.2,
              y: 1.6 + r * 2.2,
              z: z + rng.range(2.6, 4.4),
              side: 0,
              color: base,
            });
          }
        }
        x += w + rng.range(0.4, 2);
      }
    }

    // out near the kerb, which also clears the awnings overhead
    for (let i = 0; i < 14; i++) {
      lamps.push([(i % 2 === 0 ? -1 : 1) * (STREET_HALF - PAVEMENT_W + 0.75), PAVEMENT_H, -3 - i * 8]);
    }
    return { buildings, windows, lamps };
  }, []);
}

/* ── Buildings, banded, with an ink edge ────────────────────────────── */

function Buildings({ data, ramp }: { data: Building[]; ramp: THREE.Texture }) {
  const body = useRef<THREE.InstancedMesh>(null!);
  const hull = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    data.forEach((b, i) => {
      dummy.position.set(...b.pos);
      dummy.scale.set(...b.size);
      dummy.updateMatrix();
      body.current.setMatrixAt(i, dummy.matrix);
      // muted, desaturated, never black
      c.setHSL(0.6 - b.tone * 0.16, 0.16, 0.1 + b.tone * 0.05);
      body.current.setColorAt(i, c);

      // the outline: same box, a constant thicker on each axis so the ink
      // line is even regardless of how big the building is
      dummy.scale.set(b.size[0] + 0.18, b.size[1] + 0.18, b.size[2] + 0.18);
      dummy.updateMatrix();
      hull.current.setMatrixAt(i, dummy.matrix);
    });
    body.current.instanceMatrix.needsUpdate = true;
    hull.current.instanceMatrix.needsUpdate = true;
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true;
  }, [data]);

  return (
    <>
      <instancedMesh ref={hull} args={[undefined, undefined, data.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} fog />
      </instancedMesh>
      <instancedMesh ref={body} args={[undefined, undefined, data.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial gradientMap={ramp} />
      </instancedMesh>
    </>
  );
}

function Rooftops({ data, ramp }: { data: Building[]; ramp: THREE.Texture }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    data.forEach((b, i) => {
      dummy.position.set(b.pos[0], b.size[1] + 0.14, b.pos[2]);
      dummy.scale.set(b.size[0] + 0.3, 0.26, b.size[2] + 0.3);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshToonMaterial color="#cdd8e6" gradientMap={ramp} />
    </instancedMesh>
  );
}

function Windows({ data }: { data: Win[] }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    data.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      ref.current.setColorAt(i, w.color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
      <planeGeometry args={[0.85, 1.15]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* The ways in — one per row that carries a feature shop. Each is found by
   its `feature` tag rather than positioned by hand, so a door follows if the
   generator ever moves its building, and each carries the camera
   destination for its own side of the street. */
type Door = ReturnType<typeof placeOf> & {
  id: string;
  label: string;
  href: string;
  pos: THREE.Vector3;
  look: THREE.Vector3;
};

const doorOn = (row: typeof LEFT_ROW, side: 1 | -1, label: string, href: string): Door | null => {
  const i = row.findIndex((b) => b.feature);
  if (i < 0) return null;
  const at = placeOf(row, i, side);
  return {
    ...at,
    id: row[i].feature!,
    label,
    href,
    // facades sit at x = ±STREET_HALF; the interior is further out again, so
    // the camera ends up through the door rather than in the glass
    pos: new THREE.Vector3(side * (STREET_HALF + 2.2), 2.7, at.z),
    look: new THREE.Vector3(side * (STREET_HALF + 9), 2.4, at.z),
  };
};

const DOORS: Door[] = [
  doorOn(LEFT_ROW, -1, "Experience", "/experience"),
  doorOn(RIGHT_ROW, 1, "Projects", "/projects"),
].filter((d): d is Door => d !== null);

function Shopfront({ d, onEnter }: { d: Door; onEnter: (d: Door) => void }) {
  const [hovered, setHovered] = useState(false);

  // no lights of our own — the building brightens its own interior.
  // Only ever clear the slot we still own, so the shop being left can't
  // blank out the one the pointer has already moved onto.
  useEffect(() => {
    if (hovered) featureHover.id = d.id;
    else if (featureHover.id === d.id) featureHover.id = "";
    return () => {
      if (featureHover.id === d.id) featureHover.id = "";
    };
  }, [hovered, d.id]);

  return (
    <group position={[d.x, 3.2, d.z]} rotation={[0, d.rotY, 0]}>
      <mesh
        position={[0, -0.4, 0.9]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEnter(d);
        }}
      >
        <planeGeometry args={[d.w - 0.8, 5.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

    </group>
  );
}

function Snow({ count = 3200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { geometry, drift } = useMemo(() => {
    const rng = makeRng(99);
    const pos = new Float32Array(count * 3);
    const drift = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      // biased toward the far end: nearer flakes read as individual specks,
      // distant ones pile up into haze
      const t = Math.pow(rng.range(0, 1), 0.55);
      pos[i * 3] = rng.range(-30, 30);
      pos[i * 3 + 1] = rng.range(0, 36);
      pos[i * 3 + 2] = 12 - t * 120;
      drift[i * 2] = rng.range(0.4, 1.3);
      drift[i * 2 + 1] = rng.range(-0.3, 0.3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, drift };
  }, [count]);

  useFrame((_, dt) => {
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const a = p.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= drift[i * 2] * dt;
      a[i * 3] += drift[i * 2 + 1] * dt;
      if (a[i * 3 + 1] < 0) {
        a[i * 3 + 1] = 36;
        a[i * 3] = (Math.random() - 0.5) * 60;
      }
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.11} color="#f2f7fc" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Posterise + paper grain ────────────────────────────────────────── */

const POSTER_FRAG = /* glsl */ `
uniform float levels;
uniform float grain;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  // Quantise luminance and rescale the colour to it. Doing this per channel
  // makes R, G and B cross their steps at different points, which fabricates
  // hues the scene never contained.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Quantise in perceptual space, not linear. Evenly-spaced bands across a
  // linear 0..1 put almost no steps below 0.1, so a night wall sits entirely
  // inside band zero and all its surface texture flattens to one value.
  // Stepping on l^(1/2.2) puts most of the bands where the picture actually
  // lives, which is the darks.
  float lp = pow(max(l, 0.0), 1.0 / 2.2);
  float qp = (floor(lp * levels) + 0.5) / levels;
  float q = pow(qp, 2.2);
  c *= (l > 0.0015) ? (q / l) : 1.0;
  // a little tooth so the flat areas aren't dead
  float n = hash(uv * vec2(1024.0, 1024.0)) - 0.5;
  c += n * grain;
  outputColor = vec4(c, inputColor.a);
}
`;

export class PosterEffect extends Effect {
  constructor(levels = 7, grain = 0.05) {
    super("PosterEffect", POSTER_FRAG, {
      uniforms: new Map<string, THREE.Uniform>([
        ["levels", new THREE.Uniform(levels)],
        ["grain", new THREE.Uniform(grain)],
      ]),
    });
  }
}

export function Poster({ levels = 7, grain = 0.05 }: { levels?: number; grain?: number }) {
  const effect = useMemo(() => new PosterEffect(levels, grain), [levels, grain]);
  return <primitive object={effect} dispose={null} />;
}

/** Drives the intro. A ref rather than state: nothing here should re-render. */
function IntroClock({
  clock,
  ambient,
  moon,
}: {
  clock: React.RefObject<{ t: number; ceiling: number }>;
  ambient: React.RefObject<THREE.AmbientLight | null>;
  moon: React.RefObject<THREE.DirectionalLight | null>;
}) {
  // Same story as Rig: useFrame runs outside React's render, and driving
  // lights by mutation is how r3f is meant to work.
  /* eslint-disable react-hooks/immutability */
  useFrame((_, dt) => {
    clock.current.t = Math.min(clock.current.ceiling, clock.current.t + dt);
    const t = clock.current.t;
    // the sky comes up with the lamps, not before them
    const k = Math.min(1, Math.max(0, (t - INTRO_FIRST) / (INTRO_END - INTRO_FIRST)));
    const e = k * k * (3 - 2 * k); // smoothstep
    if (ambient.current) ambient.current.intensity = 0.02 + 0.26 * e;
    if (moon.current) moon.current.intensity = 0.04 + 0.46 * e;
    // finials, baubles and berries are unlit materials — they need driving
    // too, or they glow through the dark opening
    setAccentGlow(e);
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

/** Where the camera ends up depends on which door was taken, so the
    destination rides on the fly state rather than being a module constant. */
type Fly = { t: number; running: boolean; dest: Door | null };

/* ── Walking down the street ──────────────────────────────────────────
   Scroll is the pace: the page is made tall enough to cover the town, and
   how far down it you are is how far along you've walked. The Rig reads
   this each frame rather than re-rendering on scroll — at 60fps a React
   state update per wheel event would be the most expensive thing here. */

/** Where you stand before walking, and the last stride the street allows.
    STREET_END already holds back several buildings' worth of fog, so the
    far end never becomes an edge you can reach. */
const WALK_FROM = -16;
const WALK_TO = -STREET_END;
const WALK_SPAN = WALK_FROM - WALK_TO;
/** Scroll pixels per world unit. Higher is a slower, more deliberate pace. */
const PX_PER_UNIT = 30;
/* How far the cursor turns your head. Applied to the point you're looking at
   62 units ahead, so 26 across is roughly a 23° glance — enough to face a
   shopfront as you pass it without the street sliding out of frame. */
const LOOK_X = 26;
const LOOK_Y = 6;
export const WALK_PAGE_PX = WALK_SPAN * PX_PER_UNIT;

/** 0 at the near end, 1 at the far. Written by the page, read by the Rig. */
const walk = { to: 0, at: 0, dist: 0 };

function Rig({ fly }: { fly: React.RefObject<Fly> }) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 9, -78));
  const from = useRef(new THREE.Vector3());
  const fromLook = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const captured = useRef(false);
  // the head turn eases on its own; the forward tracking below stays exact,
  // so easing the offsets rather than the whole point keeps the look from
  // dragging behind the camera as you walk
  const aimX = useRef(0);
  const aimY = useRef(0);

  /* eslint-disable react-hooks/immutability */
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.001, dt);

    if (fly.current.running) {
      if (!captured.current) {
        from.current.copy(camera.position);
        fromLook.current.copy(target.current);
        captured.current = true;
      }
      fly.current.t = Math.min(1, fly.current.t + dt / 1.45);
      const t = fly.current.t;
      // slow out of the street, then accelerate through the doorway
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const dest = fly.current.dest;
      if (dest) {
        camera.position.lerpVectors(from.current, dest.pos, e);
        look.current.lerpVectors(fromLook.current, dest.look, e);
      }
      camera.lookAt(look.current);
      // widening the lens as it arrives sells the acceleration
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = 54 + e * 26;
      cam.updateProjectionMatrix();
      return;
    }

    // ── the walk ───────────────────────────────────────────────────
    // Ease toward the scrolled-to position rather than snapping: the lag is
    // what gives a stride weight when you start and stop.
    const before = walk.at;
    walk.at += (walk.to - walk.at) * (1 - Math.pow(0.05, dt));
    const moved = Math.abs(walk.at - before);
    walk.dist += moved;

    // Speed drives how much the gait shows — standing still, it settles.
    const gait = Math.min(1, moved / (dt || 0.016) / 4);
    // two footfalls per stride, so the vertical bob runs at twice the sway
    const step = walk.dist * 0.42;
    const bob = Math.sin(step * 2) * 0.13 * gait;
    const sway = Math.sin(step) * 0.35 * gait;
    const roll = Math.sin(step) * 0.006 * gait;

    const z = WALK_FROM - walk.at * WALK_SPAN;
    camera.position.z += (z - camera.position.z) * Math.min(1, dt * 4);
    // The cursor turns your head, it doesn't move your feet — so the body
    // only leans with it, and the look does the rest.
    camera.position.x += (pointer.x * 0.9 + sway - camera.position.x) * k;
    camera.position.y += (6.5 + pointer.y * 0.45 + bob - camera.position.y) * k;

    const turn = Math.min(1, dt * 2.6);
    aimX.current += (pointer.x * LOOK_X - aimX.current) * turn;
    aimY.current += (pointer.y * LOOK_Y - aimY.current) * turn;

    // look ahead down the street from wherever you're standing, offset by
    // wherever you're looking
    target.current.set(
      camera.position.x + aimX.current + sway * 0.4,
      9 + aimY.current,
      camera.position.z - 62,
    );
    camera.lookAt(target.current);
    camera.rotation.z = roll;
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

function Scene({
  clock,
  prompt,
  onPrompt,
  fly,
  onEnter,
}: {
  clock: React.RefObject<{ t: number; ceiling: number }>;
  prompt: boolean;
  onPrompt: () => void;
  fly: React.RefObject<Fly>;
  onEnter: (d: Door) => void;
}) {
  const ambient = useRef<THREE.AmbientLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const { buildings, windows, lamps } = useTown();
  const ramp = useToonRamp();
  const cobbles = useCobbles();
  const sky = useSkyGradient();

  return (
    <>
      <primitive attach="background" object={sky} />
      <fogExp2 attach="fog" args={["#2e3c4e", 0.0125]} />

      <ambientLight ref={ambient} intensity={0.02} color="#2f4062" />
      <directionalLight ref={moon} position={[-14, 26, 8]} intensity={0.04} color="#8699b6" />

      <Buildings data={buildings} ramp={ramp} />
      <Rooftops data={buildings} ramp={ramp} />
      <Windows data={windows} />
      <Pavement streetHalf={STREET_HALF} ramp={ramp} paving={cobbles} />
      <StreetSnow streetHalf={STREET_HALF} ramp={ramp} />
      <StreetLamps positions={lamps} ramp={ramp} clock={clock} prompt={prompt} onPrompt={onPrompt} />
      {/* Two long rows running away from the camera until the fog takes
          them. No terminating wall — the street just dissipates. */}
      <group position={[-STREET_HALF, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Terrace ramp={ramp} data={LEFT_ROW} clock={clock} />
      </group>
      <group position={[STREET_HALF, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Terrace ramp={ramp} data={RIGHT_ROW} clock={clock} />
      </group>

      {DOORS.map((d) => (
        <Shopfront key={d.id} d={d} onEnter={onEnter} />
      ))}

      {/* Matte snow. No reflector, no metalness — trodden slush, not glass. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -55]} receiveShadow>
        <planeGeometry args={[140, 240]} />
        <meshToonMaterial map={cobbles} color="#e2eaf6" gradientMap={ramp} />
      </mesh>

      <Snow />
      <Rig fly={fly} />
      <IntroClock clock={clock} ambient={ambient} moon={moon} />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.52} luminanceSmoothing={0.3} intensity={1.65} radius={0.78} />
        <Poster levels={11} grain={0.055} />
        <Vignette eskil={false} offset={0.3} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

/* Whether the street has already been woken this page-load.

   Module scope rather than sessionStorage: this survives client-side
   navigation (the bundle isn't re-evaluated when you go to a shop and come
   back) but dies on a real reload — which is precisely the distinction we
   want. sessionStorage survives refreshes too, so it skipped the intro
   forever once you'd seen it. */
let streetLit = false;

const GREETING = "Hello, I'm Kam";

export default function StreetScene() {
  // ceiling gates the clock: 0 while the name types, HOLD_T once the first
  // lamp may strike, then unbounded once the visitor clicks
  // The intro is a first-arrival thing. Coming back from a shop should drop
  // you onto the street as you left it, already lit.
  const [alreadyLit] = useState(() => streetLit);
  const clock = useRef({
    t: alreadyLit ? INTRO_END + 1 : 0,
    ceiling: alreadyLit ? Number.POSITIVE_INFINITY : 0,
  });
  const fly = useRef<Fly>({ t: 0, running: false, dest: null });
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [typed, setTyped] = useState(alreadyLit ? GREETING.length : 0);
  const [phase, setPhase] = useState<"typing" | "waiting" | "running" | "done">(
    alreadyLit ? "done" : "typing",
  );

  useEffect(() => {
    if (typed >= GREETING.length) return;
    const id = setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 700 : 78);
    return () => clearTimeout(id);
  }, [typed]);

  // once the name is written, let one lamp — and only one — come on
  useEffect(() => {
    if (alreadyLit || typed < GREETING.length) return;
    const id = setTimeout(() => {
      clock.current.ceiling = HOLD_T;
      setPhase("waiting");
    }, 550);
    return () => clearTimeout(id);
  }, [typed, alreadyLit]);

  const start = () => {
    if (phase !== "waiting") return;
    clock.current.ceiling = Number.POSITIVE_INFINITY;
    streetLit = true;
    setPhase("running");
    setTimeout(() => setPhase("done"), (INTRO_END - HOLD_T) * 1000 + 400);
  };

  const centred = phase === "typing" || phase === "waiting";
  const walking = phase === "done";

  /* Scroll is read straight off the window each frame the browser offers
     one, and written to the module-level `walk` the Rig polls. Deliberately
     not React state: this fires on every wheel tick, and re-rendering the
     whole scene graph for a camera nudge would cost far more than the walk. */
  useEffect(() => {
    if (!walking) {
      walk.to = 0;
      window.scrollTo(0, 0);
      return;
    }
    const onScroll = () => {
      const span = document.body.scrollHeight - window.innerHeight;
      walk.to = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [walking]);

  // coming back from a shop drops you at the near end again, on foot
  useEffect(() => {
    walk.at = 0;
    walk.dist = 0;
  }, []);

  // fly through the door, then swap routes while the frame is full of light
  const enterShop = (d: Door) => {
    if (entering) return;
    setEntering(true);
    fly.current.dest = d;
    fly.current.running = true;
    router.prefetch(d.href);
    setTimeout(() => router.push(d.href), 1500);
  };

  return (
    <div className="relative w-full bg-[#05070c]">
      {/* The scene is pinned; the page behind it is what actually scrolls.
          Its height is the length of the street in pixels, so one page of
          scrolling is one walk from end to end. Only tall once the lights
          are up — there's nowhere to walk to during the intro. */}
      <div style={{ height: walking ? `calc(100svh + ${Math.round(WALK_PAGE_PX)}px)` : "100svh" }} />

      <div className="fixed inset-0 h-[100svh] w-full">
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 0.45 }}
        camera={{ position: [0, 6.5, -16], fov: 54, near: 0.1, far: 300 }}
      >
        <Scene clock={clock} prompt={phase === "waiting"} onPrompt={start} fly={fly} onEnter={enterShop} />
      </Canvas>

      {alreadyLit && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 bg-[#05070c]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        />
      )}

      {/* Darkness closing over the frame — the route swaps behind it */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-40"
        style={{ background: "#070906" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: entering ? 1 : 0 }}
        transition={{ duration: entering ? 0.85 : 0, delay: entering ? 0.62 : 0, ease: "easeIn" }}
      />

      {/* The greeting: centred while it types, gone once the lights run */}
      <AnimatePresence>
        {centred && (
          <motion.div
            key="greeting"
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6 sm:px-10"
            exit={{ opacity: 0, y: -18, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          >
            <h1 className="font-masthead text-[clamp(1.7rem,4.6vw,3.4rem)] font-normal leading-[1.15] tracking-[-0.03em] text-paper">
              {GREETING.slice(0, typed)}
              {typed < GREETING.length && (
                <span
                  className="ml-[0.04em] inline-block w-[0.045em] animate-pulse bg-paper align-baseline"
                  style={{ height: "0.78em" }}
                >
                  &nbsp;
                </span>
              )}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
