"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { makeRng } from "@/lib/rand";
import { StreetGuide } from "./StreetGuide";
import { AlleyGuide } from "./AlleyGuide";
import { StreetMenu } from "./StreetMenu";
import { WipView } from "./WipView";
import { ALLEY, INK, LEFT_ROW, PAVEMENT_H, PAVEMENT_W, Pavement, RIGHT_ROW, STREET_END, STREET_HALF, StreetLamps, StreetSnow, Terrace, featureHover, placeOf, setAccentGlow, HOLD_T, INTRO_FIRST, INTRO_END } from "./buildings";
import { ALLEY_CAM, ALLEY_LOOK, Alley, alleyFocus, alleyGlow, alleyLight } from "./Alley";

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

/** The skyline's nearest row. It stands right across the road, so the walk
    has to stop well short of it (see WALK_TO). */
const SKYLINE_Z = -105;

function useTown() {
  return useMemo(() => {
    const rng = makeRng(20260806);
    const buildings: Building[] = [];
    const windows: Win[] = [];
    const lamps: [number, number, number][] = [];

    // A skyline behind and above the terrace, well back in the fog. It only
    // has to give the roofline something to sit against.
    for (let row = 0; row < 3; row++) {
      const z = SKYLINE_Z - row * 16;
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

/* The way in. Nothing is drawn — the gap between the buildings is the only
   cue there is, which is the point. An invisible pane across the mouth
   catches the click; it can't be `visible={false}`, because three skips
   invisible objects when raycasting and it would never be hit. */
function AlleyMouth({ active, onEnter }: { active: boolean; onEnter: () => void }) {
  return (
    <mesh
      position={[STREET_HALF - 0.25, 3, ALLEY.z]}
      rotation={[0, -Math.PI / 2, 0]}
      onPointerOver={(e) => {
        if (!active) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        if (!active) return;
        e.stopPropagation();
        onEnter();
      }}
    >
      <planeGeometry args={[ALLEY.width, 6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Which stretch of street you're standing on, relative to the gallery. */
type Zone = "none" | "alley" | "past";

/* One watcher rather than two, because the zones have to be mutually
   exclusive: the alley prompt's range used to run well past the gap, so a
   second independent check would have put two panels in the same spot at
   the same time.

   Runs in the frame loop but only calls back when you cross a boundary, so
   React re-renders a couple of times a visit rather than sixty times a
   second. */
function WalkZones({ onChange }: { onChange: (zone: Zone) => void }) {
  const was = useRef<Zone>("none");
  useFrame(() => {
    const z = walk.z;
    const next: Zone =
      z <= ALLEY.zFar - 1.5
        ? "past"
        : z < ALLEY.zNear + 7 && z > ALLEY.zFar
          ? "alley"
          : "none";
    if (next !== was.current) {
      was.current = next;
      onChange(next);
    }
  });
  return null;
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
    // the alley's lantern comes up with everything else, so the gap is
    // already glowing by the time the street can be walked
    alleyGlow.v = e;
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

/** Where the camera ends up depends on which door was taken, so the
    destination rides on the fly state rather than being a module constant. */
type Fly = { t: number; running: boolean; dest: Door | null };

/* ── Walking down the street ──────────────────────────────────────────
   Arrow keys walk, the mouse turns your head. It was scroll-as-pace, which
   read as scrubbing a video rather than walking, and — worse — tied the
   look to a ±23° nudge, which meant anything at right angles to the street
   simply could not be seen. Keys and a real head turn fix both.

   The Rig reads this each frame rather than re-rendering: at 60fps a React
   state update per keypress would be the most expensive thing here. */

/** Where you stand before walking, and the last stride the street allows.
    STREET_END holds back from the end of the side rows, but the skyline
    blocks stand across the road well before that, and walking on brought
    you face to face with a blank wall. So the walk also stops short of the
    skyline: at SKYLINE_CLEARANCE the exp² fog has started to take it, and
    it still reads as the town beyond rather than a wall in front of you. */
const SKYLINE_CLEARANCE = 40;
const WALK_FROM = -16;
/** How far past the last shopfront the street stays walkable.

    Both shops sit inside the first 40 units, but the walk used to run to the
    fog line at −65, leaving ~25 units — half the stroll — of empty street
    past the final door. Measured off the doors rather than fixed, so it
    follows if a seed ever moves a shop. */
const WALK_PAST_LAST_DOOR = 18;
const LAST_DOOR_Z = DOORS.length ? Math.min(...DOORS.map((d) => d.z)) : -Infinity;
const WALK_TO = Math.max(
  -STREET_END,
  SKYLINE_Z + SKYLINE_CLEARANCE,
  LAST_DOOR_Z - WALK_PAST_LAST_DOOR,
);
/** World units per second. */
const WALK_SPEED = 11;
/** How far the mouse turns your head, as a real yaw rather than a sideways
    offset on a distant point. It has to reach past 80°: the alley opens at
    a right angle to the street, and the old ±23° glance is precisely why
    nobody could find it. */
const MAX_YAW = 1.45; // ~83°
/* Yaw only — no pitch. Looking up and down in a street you're walking down
   buys nothing and costs the horizon: tilt it and the whole town leans. */
/** How far ahead the look point is thrown. */
const LOOK_DIST = 40;

/** Which arrow keys are down, as a forward/back direction only. Written by
    the page. Stepping sideways used to live here too, but crossing a street
    with nothing close enough to parallax against read as almost no movement
    at all, so it earned its keep in neither the code nor the instructions. */
const move = { fwd: 0 };
/** All four arrows are still captured, so left and right are swallowed rather
    than handed back to the browser to scroll the page with — they simply map
    to no movement now. */
const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/** Where you're standing, and how far you've walked — the gait runs off
    distance covered, so it keeps time at any pace. */
const walk = { z: WALK_FROM, dist: 0 };

/** Scratch for the alley pose — allocated once, not per frame. */
const ALLEY_AIM = new THREE.Vector3();
const ALLEY_POS = new THREE.Vector3();

/** Whether you're down the alley, and how far the pose has blended in. */
type AlleyState = { want: boolean; t: number };

function Rig({
  fly,
  alley,
}: {
  fly: React.RefObject<Fly>;
  alley: React.RefObject<AlleyState>;
}) {
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
  /* Where the walk alone would put you. Held apart from camera.position so
     the alley can blend between the street pose and the alley pose without
     fighting the easing that produced it. */
  const pos = useRef(new THREE.Vector3(0, 6.5, WALK_FROM));

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

    // ── the alley ──────────────────────────────────────────────────
    // A detour, not a destination: the pose blends in and back out again, so
    // leaving puts you down exactly where you were standing.
    const a = alley.current;
    a.t += ((a.want ? 1 : 0) - a.t) * Math.min(1, dt * 1.25);
    /* Smootherstep, not smoothstep, and slower. Turning in swings the look
       point from 62 units down the street to one inside the alley — close to
       a right angle — and on the old curve that arrived as a whip. Flatter
       ends make it read as turning your head to look down a gap. */
    const s = a.t;
    const inAlley = s * s * s * (s * (s * 6 - 15) + 10);
    alleyLight.v = inAlley;

    // and a step closer still, if a sheet has been clicked
    alleyFocus.t += ((alleyFocus.want ? 1 : 0) - alleyFocus.t) * Math.min(1, dt * 2.4);
    const ft = alleyFocus.t;
    const focus = ft * ft * ft * (ft * (ft * 6 - 15) + 10);

    // ── the walk ───────────────────────────────────────────────────
    // Velocity, not a target position: holding a key should keep you moving
    // and letting go should stop you, which an ease-toward-a-point can't
    // express. Frozen once you're down the alley — the street is behind you.
    let moved = 0;
    if (a.t < 0.5) {
      const z0 = walk.z;
      // forward is −z, and the ends of the street are hard stops
      walk.z = Math.min(WALK_FROM, Math.max(WALK_TO, walk.z - move.fwd * WALK_SPEED * dt));
      moved = Math.abs(walk.z - z0);
      walk.dist += moved;
    }

    // Speed drives how much the gait shows — standing still, it settles.
    const gait = Math.min(1, moved / (dt || 0.016) / 6);
    // two footfalls per stride, so the vertical bob runs at twice the sway
    const step = walk.dist * 0.42;
    const bob = Math.sin(step * 2) * 0.13 * gait;
    const sway = Math.sin(step) * 0.35 * gait;

    // the body follows the feet only; the mouse no longer drags you sideways
    pos.current.z += (walk.z - pos.current.z) * Math.min(1, dt * 6);
    pos.current.x += (sway - pos.current.x) * k;
    pos.current.y += (6.5 + bob - pos.current.y) * k;

    const turn = Math.min(1, dt * 3.2);
    aimX.current += (pointer.x * MAX_YAW - aimX.current) * turn;

    /* A direction rather than a sideways offset on a fixed point ahead:
       an offset can only ever lean the view a few degrees, where a yaw
       turns all the way to the shopfronts and to what sits between them.

       The look point stays exactly at eye height, so the view is level by
       construction — there is no pitch to accumulate and nothing that can
       leave you facing the sky or the cobbles. */
    const yaw = aimX.current;
    target.current.set(
      pos.current.x + Math.sin(yaw) * LOOK_DIST,
      pos.current.y,
      pos.current.z - Math.cos(yaw) * LOOK_DIST,
    );

    if (inAlley > 0.001) {
      // Inside, the cursor barely moves the view. The pictures are hung to
      // face where you stand, so there's nothing to hunt for — and a wide
      // swing in a space this narrow just makes it hard to hold still.
      /* The wall runs along x now, not z, so the cursor pans along it — and
         it's worth a little more travel than before, because the cluster is
         wider than the view is. */
      ALLEY_AIM.set(
        ALLEY_LOOK.x + pointer.x * 1.7,
        ALLEY_LOOK.y,
        ALLEY_LOOK.z,
      );
      ALLEY_POS.copy(ALLEY_CAM);

      /* Stepping up to a sheet is the same pose carried further, not a mode
         of its own — which is why backing out of one lands you exactly where
         you were standing, and why the cursor stops panning once you're in
         front of it. */
      if (focus > 0.001) {
        ALLEY_POS.lerp(alleyFocus.pos, focus);
        ALLEY_AIM.lerp(alleyFocus.look, focus);
      }

      camera.position.lerpVectors(pos.current, ALLEY_POS, inAlley);
      look.current.lerpVectors(target.current, ALLEY_AIM, inAlley);
    } else {
      camera.position.copy(pos.current);
      look.current.copy(target.current);
    }
    camera.lookAt(look.current);
    // Level, always. lookAt against world up already leaves no roll; this
    // makes sure nothing downstream reintroduces any. The gait now shows in
    // the bob and the sway of the body alone, which is where it belongs.
    camera.rotation.z = 0;
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
  alley,
  sketches,
  canEnterAlley,
  onEnterAlley,
  onZone,
  onWip,
}: {
  clock: React.RefObject<{ t: number; ceiling: number }>;
  prompt: boolean;
  onPrompt: () => void;
  fly: React.RefObject<Fly>;
  onEnter: (d: Door) => void;
  alley: React.RefObject<AlleyState>;
  sketches: string[];
  canEnterAlley: boolean;
  onEnterAlley: () => void;
  onZone: (zone: Zone) => void;
  onWip: (file: string) => void;
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

      <Alley ramp={ramp} sketches={sketches} onWip={onWip} />
      <AlleyMouth active={canEnterAlley} onEnter={onEnterAlley} />
      <WalkZones onChange={onZone} />

      <Snow />
      <Rig fly={fly} alley={alley} />
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

/* Whether the gallery has introduced itself yet this page-load. Same reasoning
   as streetLit: it survives client-side navigation to a shop and back, but
   dies on a real reload — so you're greeted once, not every single time you
   duck down the alley. */
let galleryGreeted = false;


export default function StreetScene({ sketches }: { sketches: string[] }) {
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
  const alley = useRef<AlleyState>({ want: false, t: 0 });
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [inAlley, setInAlley] = useState(false);
  const [zone, setZone] = useState<Zone>("none");
  const nearAlley = zone === "alley";
  const pastGallery = zone === "past";
  const [galleryOpen, setGalleryOpen] = useState(false);
  /** which drawing's comparison is open, by filename; null for none */
  const [wipFile, setWipFile] = useState<string | null>(null);

  /* Its photo, matched on the drawing's own base name. Deliberately not
     "the first file ending -ref": with more than one pair in the folder
     that hands every drawing the same photo. */
  const wipReference = wipFile
    ? sketches.find((f) =>
        f.toLowerCase().startsWith(`${wipFile.replace(/\.[^.]+$/, "").toLowerCase()}-ref.`),
      )
    : undefined;
  const [guideDue, setGuideDue] = useState(false);
  /** the menu asking the guide to open at a panel; a fresh id each time */
  const [guideRequest, setGuideRequest] = useState<{ id: number; step: number }>();
  const [phase, setPhase] = useState<"dark" | "waiting" | "running" | "done">(
    alreadyLit ? "done" : "dark",
  );

  /* A beat of darkness, then one lamp — and only one — comes on by itself
     and waits to be clicked.

     A name used to type itself out here first, and the lamp waited on it.
     The lamp alone says "something is about to happen" without spelling it
     out, so the wait is now just a held beat rather than a queue behind a
     sentence. */
  useEffect(() => {
    if (alreadyLit) return;
    const id = setTimeout(() => {
      clock.current.ceiling = HOLD_T;
      setPhase("waiting");
    }, 900);
    return () => clearTimeout(id);
  }, [alreadyLit]);

  const start = () => {
    if (phase !== "waiting") return;
    clock.current.ceiling = Number.POSITIVE_INFINITY;
    streetLit = true;
    setPhase("running");
    setTimeout(() => setPhase("done"), (INTRO_END - HOLD_T) * 1000 + 400);
    // the street finishes lighting first, then the guide opens over it. The
    // lamps striking are the thing worth watching, so nothing covers them.
    setTimeout(() => setGuideDue(true), (INTRO_END - HOLD_T) * 1000 + 150);
  };

  const walking = phase === "done";

  /* Down the alley and back. Nothing is routed — you never leave the street,
     which is what keeps it a secret rather than a URL someone can guess. */
  const enterAlley = () => {
    alley.current.want = true;
    setInAlley(true);
    // let the walk-in finish before the card opens over it — arriving to a
    // dialog you haven't seen the room behind is disorienting
    if (!galleryGreeted) {
      galleryGreeted = true;
      setTimeout(() => setGalleryOpen(true), 950);
    }
  };
  const leaveAlley = () => {
    alley.current.want = false;
    alleyFocus.want = false;
    alleyFocus.id = "";
    setGalleryOpen(false);
    setWipFile(null);
    setInAlley(false);
  };

  useEffect(() => {
    if (!inAlley) return;
    /* Escape backs out one step at a time — card, then sheet, then the alley
       itself. One listener with an explicit order rather than one per layer:
       separate window listeners would resolve by registration order, which is
       no way to decide what a keypress means. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (wipFile) {
        setWipFile(null);
        return;
      }
      if (galleryOpen) {
        setGalleryOpen(false);
        return;
      }
      if (alleyFocus.want) {
        alleyFocus.want = false;
        alleyFocus.id = "";
        return;
      }
      leaveAlley();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inAlley, galleryOpen, wipFile]);

  /* The arrow keys, held as a set and reduced to a direction the Rig polls.
     Deliberately not React state: re-rendering the whole scene graph on a
     keypress would cost far more than the walking does.

     `blur` matters more than it looks — alt-tab away mid-stride and the
     keyup never arrives, so without it you come back still walking. */
  useEffect(() => {
    if (!walking) {
      move.fwd = 0;
      return;
    }
    const held = new Set<string>();
    const apply = () => {
      move.fwd = (held.has("ArrowUp") ? 1 : 0) - (held.has("ArrowDown") ? 1 : 0);
    };
    const down = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return;
      e.preventDefault(); // or the page tries to scroll behind the scene
      held.add(e.key);
      apply();
    };
    const up = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return;
      held.delete(e.key);
      apply();
    };
    const stop = () => {
      held.clear();
      apply();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", stop);
      stop();
    };
  }, [walking]);

  // coming back from a shop drops you at the near end again, on foot
  useEffect(() => {
    walk.z = WALK_FROM;
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
      {/* Exactly one screen tall. Nothing scrolls any more — the arrow keys
          do the walking — so there's no tall page behind the scene. */}
      <div style={{ height: "100svh" }} />

      <div className="fixed inset-0 h-[100svh] w-full">
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 0.45 }}
        camera={{ position: [0, 6.5, -16], fov: 54, near: 0.1, far: 300 }}
      >
        <Scene
          clock={clock}
          prompt={phase === "waiting"}
          onPrompt={start}
          fly={fly}
          onEnter={enterShop}
          alley={alley}
          sketches={sketches}
          canEnterAlley={walking && !entering && !inAlley}
          onEnterAlley={enterAlley}
          onZone={setZone}
          onWip={setWipFile}
        />
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

      {/* How to get about. Under the entry wipe (z-40), and gone once a
          shop is chosen. Only offered unprompted on the first arrival —
          guideDue is set by start(), which a return visit never calls. */}
      {/* The nudge toward the alley: nothing at all until you're level with
          the gap, then a small panel in the same blocky, bevelled language
          as the guide. It says what to do without saying what's down there,
          which is the whole trick — you still have to take the peek. */}
      <AnimatePresence>
        {nearAlley && walking && !entering && !inAlley && (
          <motion.button
            key="peek"
            type="button"
            onClick={enterAlley}
            className="fixed bottom-16 left-1/2 z-[36] flex -translate-x-1/2 items-center gap-2.5 border-2 border-black bg-[#17120e]/95 px-4 py-2.5 font-masthead text-[0.95rem] leading-none text-paper transition-colors duration-200 hover:bg-glow-500/20 sm:bottom-20"
            style={{
              boxShadow:
                "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <kbd
              className="rounded-[3px] border border-b-[3px] border-black bg-paper/10 px-1.5 py-px font-mono text-[0.68rem] leading-[1.6]"
              style={{ boxShadow: "inset 1px 1px 0 rgba(255,236,200,0.18)" }}
            >
              Click
            </kbd>
            Take a peek
            <motion.span
              aria-hidden
              className="text-glow-400"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Past the gallery there's nothing built yet, so say so rather than
          let the street just run out. Not a dialog: it needs no dismissing
          and nothing to click, and it clears itself the moment you turn
          back. */}
      <AnimatePresence>
        {pastGallery && walking && !entering && !inAlley && (
          <motion.div
            key="under-construction"
            className="pointer-events-none fixed bottom-16 left-1/2 z-[36] flex -translate-x-1/2 items-center gap-2.5 border-2 border-black bg-[#17120e]/95 px-4 py-2.5 font-masthead text-[0.95rem] leading-none text-paper sm:bottom-20"
            style={{
              boxShadow:
                "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span aria-hidden className="text-glow-400">
              ⚠
            </span>
            Still under construction
          </motion.div>
        )}
      </AnimatePresence>

      {/* The way back out of the alley — top left, the same corner every
          room uses, so it's where a visitor already expects it. */}
      <AnimatePresence>
        {inAlley && (
          <motion.button
            key="leave-alley"
            type="button"
            onClick={leaveAlley}
            /* same panel as the "Take a peek" prompt, so every way out of
               somewhere looks like the same control */
            className="fixed left-5 top-5 z-[36] inline-flex items-center gap-2.5 border-2 border-black bg-[#17120e]/95 px-4 py-2.5 font-masthead text-[0.95rem] leading-none text-paper transition-colors duration-200 hover:bg-glow-500/20 sm:left-8 sm:top-8"
            style={{
              boxShadow:
                "inset 2px 2px 0 rgba(255,236,200,0.14), inset -2px -2px 0 rgba(0,0,0,0.55), 0 18px 40px rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span aria-hidden className="text-glow-400">
              ←
            </span>
            Back to the street
          </motion.button>
        )}
      </AnimatePresence>

      <WipView
        open={wipFile !== null}
        onClose={() => setWipFile(null)}
        sketch={wipFile ?? undefined}
        reference={wipReference}
      />

      <AlleyGuide
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onOpen={() => setGalleryOpen(true)}
        available={inAlley && !entering}
      />

      {/* Not gated on the intro finishing, unlike the "?" — the menu is the
          way out of here, so it shouldn't make anyone sit through the street
          lighting up before it appears. It's there from the first frame. */}
      <StreetMenu
        available={!entering && !inAlley}
        hidden={entering || inAlley}
        onAbout={() => setGuideRequest({ id: Date.now(), step: 0 })}
        onControls={() => setGuideRequest({ id: Date.now(), step: 1 })}
      />

      <StreetGuide
        offer={guideDue}
        available={walking && !entering && !inAlley}
        hidden={entering || inAlley}
        request={guideRequest}
      />
      </div>
    </div>
  );
}
