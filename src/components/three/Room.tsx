"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { makeRng } from "@/lib/rand";
import { useBookshelf } from "./buildings";
import { Poster, useToonRamp } from "./StreetScene";

/* ═══════════════════════════════════════════════════════════════════
   The room behind the shopfront.

   Same pipeline as the street — toon ramp, ink outlines, posterise,
   bloom — so walking through the door doesn't change medium. Warm
   inside, cold through the window, and a Persian rug on the floor.
   ═══════════════════════════════════════════════════════════════════ */

/** 0 while the room sleeps, 1 once it's woken. Written by the page, read
    here each frame. */
export const roomLight = { v: 0 };

/** A hotspot: a steady ring with two pulses running out of it. Reads as
    "this is interactive" without spelling it out, and being real geometry it
    scales and sits in perspective with the lamp. */
function Hotspot({ radius }: { radius: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.34 + Math.sin(t * 2.2) * 0.16;
    }

    pulses.current.forEach((mesh, i) => {
      if (!mesh) return;
      // two rings half a cycle apart, so one is always on its way out
      const p = ((t * 0.55 + i * 0.5) % 1 + 1) % 1;
      const k = 1 + p * 1.15;
      mesh.scale.set(k, k, 1);
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - p) * (1 - p) * 0.5;
    });
  });

  return (
    <group>
      <mesh ref={ring}>
        <ringGeometry args={[radius, radius + 0.035, 60]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.4} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            pulses.current[i] = m;
          }}
        >
          <ringGeometry args={[radius, radius + 0.02, 60]} />
          <meshBasicMaterial color="#ffc880" transparent opacity={0} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

const SHELF_OFF = new THREE.Color("#150e08");
const SHELF_ON = new THREE.Color("#6d5238");
const NIGHT_OFF = new THREE.Color("#0a1220");
const NIGHT_ON = new THREE.Color("#1b3550");

const SHADE_OFF = new THREE.Color("#3a2a18");
const SHADE_ON = new THREE.Color("#e0a860");
const BULB_OFF = new THREE.Color("#6b4a24");
const BULB_ON = new THREE.Color("#ffdca6");

const W = 15; // width
const H = 6.4; // height
const D = 12; // depth

/** A plain rug: woven ground, a simple border, and a little fringe. */
function useRug() {
  return useMemo(() => {
    const w = 640;
    const h = 940;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;
    const rng = makeRng(1618);

    const GROUND = "#7a3a30";
    const BORDER = "#5e2a24";
    const TRIM = "#c9a77a";

    g.fillStyle = GROUND;
    g.fillRect(0, 0, w, h);

    // the weave: fine horizontal threading, slightly uneven
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = `rgba(0,0,0,${rng.range(0.02, 0.07).toFixed(3)})`;
      g.fillRect(0, y, w, 1.4);
    }
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = `rgba(255,220,190,${rng.range(0.01, 0.035).toFixed(3)})`;
      g.fillRect(x, 0, 1.2, h);
    }

    // gentle patches where the pile has worn or the dye lot shifted
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${rng.chance(0.5) ? "0,0,0" : "255,200,170"},${rng.range(0.015, 0.05).toFixed(3)})`;
      g.beginPath();
      g.ellipse(rng.range(0, w), rng.range(0, h), rng.range(60, 200), rng.range(40, 140), rng.range(0, 3), 0, Math.PI * 2);
      g.fill();
    }

    // a simple double border
    const band = (inset: number, thickness: number, colour: string) => {
      g.strokeStyle = colour;
      g.lineWidth = thickness;
      g.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    };
    band(26, 16, BORDER);
    band(44, 3, TRIM);
    band(70, 3, TRIM);

    // fringe at both ends
    g.strokeStyle = "#d8c39c";
    g.lineWidth = 2.4;
    for (let x = 8; x < w - 8; x += 9) {
      const j = rng.range(-2, 2);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + j, 16);
      g.moveTo(x, h);
      g.lineTo(x + j, h - 16);
      g.stroke();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
  }, []);
}

/** Floorboards. */
function useBoards() {
  return useMemo(() => {
    const size = 512;
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    const g = cv.getContext("2d")!;
    const rng = makeRng(4242);
    g.fillStyle = "#6b4a2c";
    g.fillRect(0, 0, size, size);
    const rows = 7;
    const bh = size / rows;
    for (let r = 0; r < rows; r++) {
      const v = rng.range(0.82, 1.06);
      g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(108 * v)},${Math.round(66 * v)})`;
      g.fillRect(0, r * bh + 2, size, bh - 4);
      // grain
      g.strokeStyle = "rgba(60,36,18,0.22)";
      g.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        const yy = r * bh + rng.range(6, bh - 8);
        g.beginPath();
        g.moveTo(0, yy);
        for (let x = 0; x < size; x += 24) g.lineTo(x, yy + rng.range(-1.6, 1.6));
        g.stroke();
      }
      // board ends
      g.fillStyle = "rgba(40,24,12,0.5)";
      g.fillRect(rng.range(80, size - 80), r * bh, 3, bh);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/* ────────────────────────────────────────────────────────────────── */

/** A hanging lamp. The shade itself glows — a dark shade in a dark room
    reads as a silhouette, and it's the lit shade that feels warm. */
function Pendant({
  ramp,
  position,
  drop = 2.2,
  size = 1,
  prompt = false,
  onPrompt,
}: {
  ramp: THREE.Texture;
  position: [number, number, number];
  drop?: number;
  size?: number;
  prompt?: boolean;
  onPrompt?: () => void;
}) {
  const shade = useRef<THREE.MeshBasicMaterial>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  const on = useRef(0);
  useFrame((_, dt) => {
    // the lamp lights itself as soon as it's offered; the *room* waits for
    // the click, so this is its own value rather than roomLight
    const want = prompt || roomLight.v > 0.02 ? 1 : 0;
    on.current += (want - on.current) * Math.min(1, dt * 2.6);
    const k = on.current;
    const e = k > 0.985 ? 1 : k * (0.55 + 0.45 * Math.abs(Math.sin(k * 26)));
    if (shade.current) shade.current.color.copy(SHADE_OFF).lerp(SHADE_ON, e);
    if (bulb.current) bulb.current.color.copy(BULB_OFF).lerp(BULB_ON, e);
    // brighter still once the room is awake, so the click reads as a
    // change and not just a fade
    if (light.current) light.current.intensity = (26 + 34 * roomLight.v) * e;
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.11, 0.13, 0.07, 10]} />
        <meshToonMaterial color="#3a2a16" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, -drop / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.016, drop, 6]} />
        <meshToonMaterial color="#2a1c0e" gradientMap={ramp} />
      </mesh>

      {/* a plain dome, lit from inside */}
      <mesh position={[0, -drop, 0]} scale={size}>
        <sphereGeometry args={[0.52, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial ref={shade} color="#3a2a18" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, -drop - 0.12, 0]} scale={size}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshBasicMaterial ref={bulb} color="#6b4a24" toneMapped={false} />
      </mesh>

      <pointLight ref={light} position={[0, -drop - 0.35, 0]} color="#ffa848" intensity={0} distance={17} decay={1.6} />

      {prompt && (
        <>
          <mesh
            position={[0, -drop - 0.1, 0]}
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
          {/* concentric with the shade — its outer radius is 0.52 x size */}
          <group position={[0, -drop, 0.05]}>
            <Hotspot radius={0.52 * size + 0.22} />
          </group>
        </>
      )}
    </group>
  );
}

/** Books, stacked. The building block for every table and counter. */
function Stack({ x, z, n, seed }: { x: number; z: number; n: number; seed: number }) {
  const rng = makeRng(seed);
  const spines = ["#8d4a2a", "#6b2f28", "#4a5b3a", "#2f3f5e", "#7a6030", "#57324a"];
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh
          key={i}
          position={[rng.range(-0.05, 0.05), 0.92 + i * 0.11, rng.range(-0.05, 0.05)]}
          rotation={[0, rng.range(-0.3, 0.3), 0]}
        >
          <boxGeometry args={[rng.range(0.42, 0.6), 0.1, rng.range(0.3, 0.44)]} />
          <meshToonMaterial color={rng.pick(spines)} />
        </mesh>
      ))}
    </group>
  );
}

/** The table of new titles in the middle of the floor. */
function BookTable({ ramp }: { ramp: THREE.Texture }) {
  return (
    <group position={[0.4, 0, 1.4]}>
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[3.4, 0.14, 1.9]} />
        <meshToonMaterial color="#5b3a1e" gradientMap={ramp} />
      </mesh>
      {[
        [-1.2, -0.45],
        [-1.2, 0.5],
        [1.2, -0.5],
        [1.25, 0.42],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.4, z]}>
          <boxGeometry args={[0.14, 0.8, 0.14]} />
          <meshToonMaterial color="#42290f" gradientMap={ramp} />
        </mesh>
      ))}
      <Stack x={-1.1} z={0} n={5} seed={11} />
      <Stack x={-0.1} z={0.35} n={7} seed={22} />
      <Stack x={0.9} z={-0.3} n={4} seed={33} />
      <Stack x={1.4} z={0.4} n={6} seed={44} />
    </group>
  );
}

/** The rolling ladder, leaning on the back shelves. */
function Ladder({ ramp }: { ramp: THREE.Texture }) {
  return (
    <group position={[3.6, 0, -D / 2 + 0.55]} rotation={[0.17, 0, 0]}>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 2.6, 0]}>
          <boxGeometry args={[0.11, 5.2, 0.11]} />
          <meshToonMaterial color="#5b3a1e" gradientMap={ramp} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.62, 0]}>
          <boxGeometry args={[0.84, 0.07, 0.16]} />
          <meshToonMaterial color="#6b4526" gradientMap={ramp} />
        </mesh>
      ))}
    </group>
  );
}

/** The counter, with a lamp and a till. */
function Counter({ ramp }: { ramp: THREE.Texture }) {
  return (
    <group position={[4.6, 0, 1.9]} rotation={[0, -0.35, 0]}>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[3.2, 1.16, 1.1]} />
        <meshToonMaterial color="#4a2f1a" gradientMap={ramp} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3.5, 0.12, 1.35]} />
        <meshToonMaterial color="#6b4526" gradientMap={ramp} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 1, 0.58, 0.58]}>
          <boxGeometry args={[0.78, 0.72, 0.05]} />
          <meshToonMaterial color="#5b3a24" gradientMap={ramp} />
        </mesh>
      ))}
      <mesh position={[-1, 1.45, 0]}>
        <boxGeometry args={[0.62, 0.44, 0.5]} />
        <meshToonMaterial color="#33200f" gradientMap={ramp} />
      </mesh>
      <Stack x={0.2} z={0} n={3} seed={77} />
    </group>
  );
}

/** r3f points a fresh camera at the origin, which here is the middle of the
    floor. Aim it at the shop instead. */
function Framing() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 2.1, -2.2);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/** Curtains, drawn back either side. A lathe again: revolving a wavy
    profile gives the vertical folds of hanging fabric without modelling
    them one by one. Only a slice of the revolution is used. */
function Curtain({
  ramp,
  side,
  height,
}: {
  ramp: THREE.Texture;
  side: -1 | 1;
  height: number;
}) {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // gathered at the top, falling wider toward the hem
      // t = 0 at the hem, 1 at the heading: wide at the floor, gathered at top
      const r = 0.64 - t * 0.3 + Math.sin(t * Math.PI) * 0.09;
      pts.push(new THREE.Vector2(r, t * height));
    }
    return pts;
  }, [height]);

  return (
    <group position={[side * 2.05, 1.9 - height, 0.18]}>
      {/* a half-turn of the lathe reads as a hanging panel, folds and all */}
      <mesh rotation={[0, side < 0 ? -0.5 : Math.PI + 0.5, 0]}>
        <latheGeometry args={[profile, 14, 0, Math.PI]} />
        <meshToonMaterial color="#5e1b1b" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      {/* the tieback, cinching it in */}
      <mesh position={[0, height * 0.62, 0]}>
        <torusGeometry args={[0.4, 0.055, 6, 16]} />
        <meshToonMaterial color="#8a6a34" gradientMap={ramp} />
      </mesh>
    </group>
  );
}

/** Snow drifting past outside. Sits behind the glass, clipped by the frame,
    so it only shows through the window. */
function WindowSnow({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { geometry, speed } = useMemo(() => {
    const rng = makeRng(515);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // local −z is *away* from the room once the window group is rotated;
      // keep it all past the wall so none of it drifts inside
      pos[i * 3] = rng.range(-4.2, 4.2);
      pos[i * 3 + 1] = rng.range(-2.2, 3);
      pos[i * 3 + 2] = rng.range(-2.9, -0.9);
      speed[i] = rng.range(0.22, 0.7);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, speed };
  }, [count]);

  useFrame((_, dt) => {
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const a = p.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= speed[i] * dt;
      a[i * 3] += Math.sin(a[i * 3 + 1] * 0.7 + i) * dt * 0.14;
      if (a[i * 3 + 1] < -2.2) {
        a[i * 3 + 1] = 3;
        a[i * 3] = (Math.random() - 0.5) * 8.4;
      }
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.075} color="#e8f0fa" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Eases the room from dark to lit. The shelves and the night outside are
    unlit materials, so they have to be driven explicitly — same trap as the
    street. */
function Lighting({
  lit,
  ambient,
  shelves,
  night,
}: {
  lit: boolean;
  ambient: React.RefObject<THREE.AmbientLight | null>;
  shelves: React.RefObject<(THREE.MeshBasicMaterial | null)[]>;
  night: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  // Driving lights and materials by mutation inside useFrame is how r3f
  // works; it runs outside React's render pass.
  /* eslint-disable react-hooks/immutability */
  useFrame(({ gl }, dt) => {
    roomLight.v += ((lit ? 1 : 0) - roomLight.v) * Math.min(1, dt * 2.2);
    const e = roomLight.v;
    if (ambient.current) ambient.current.intensity = 0.03 + 0.92 * e;
    shelves.current.forEach((m) => {
      if (m) m.color.copy(SHELF_OFF).lerp(SHELF_ON, e);
    });
    if (night.current) night.current.color.copy(NIGHT_OFF).lerp(NIGHT_ON, e);
    // exposure too — toon materials alone don't carry a big enough change
    gl.toneMappingExposure = 0.34 + 0.5 * e;
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

function Scene({ prompt, onPrompt, lit }: { prompt: boolean; onPrompt: () => void; lit: boolean }) {
  const ramp = useToonRamp();
  const rug = useRug();
  const boards = useBoards();
  const shelf = useBookshelf();
  const ambient = useRef<THREE.AmbientLight>(null);
  const shelves = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const night = useRef<THREE.MeshBasicMaterial>(null);

  const shelfTex = useMemo(() => {
    const t = shelf.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(2.4, 1);
    return t;
  }, [shelf]);

  return (
    <>
      <Framing />
      <color attach="background" args={["#140b06"]} />
      <fogExp2 attach="fog" args={["#1d1008", 0.024]} />

      <Lighting lit={lit} ambient={ambient} shelves={shelves} night={night} />
      <ambientLight ref={ambient} intensity={0.05} color="#6b4a34" />

      {/* floor, and the rug on it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial map={boards} color="#d8c3a4" gradientMap={ramp} />
      </mesh>
      {/* 640 x 940 canvas on a 6.2 x 9.1 plane — matching aspect, so the
          weave isn't stretched across its short axis */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.4]}>
        <planeGeometry args={[6.2, 9.1]} />
        <meshToonMaterial map={rug} color="#ffffff" gradientMap={ramp} />
      </mesh>

      {/* back wall: shelves, floor to ceiling */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={(m) => { shelves.current[0] = m; }} map={shelfTex} toneMapped={false} color="#8a6a48" />
      </mesh>
      {/* shelf uprights, to give the wall some relief */}
      {[-5, -1.7, 1.7, 5].map((x) => (
        <mesh key={x} position={[x, H / 2, -D / 2 + 0.12]}>
          <boxGeometry args={[0.22, H, 0.24]} />
          <meshToonMaterial color="#33200f" gradientMap={ramp} />
        </mesh>
      ))}

      {/* side walls: shelved as well — it's a shop, not a sitting room */}
      <mesh position={[-W / 2, H / 2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D - 3, H]} />
        <meshBasicMaterial ref={(m) => { shelves.current[1] = m; }} map={shelfTex} toneMapped={false} color="#6d5238" />
      </mesh>
      {/* stops at z = −3.1, which is where the window opening begins */}
      <mesh position={[W / 2, H / 2, -4.55]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.9, H]} />
        <meshBasicMaterial ref={(m) => { shelves.current[2] = m; }} map={shelfTex} toneMapped={false} color="#6d5238" />
      </mesh>
      {/* plaster on the left where the shelves stop */}
      <mesh position={[-W / 2, H / 2, 4.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3, H]} />
        <meshToonMaterial color="#4a2f1e" gradientMap={ramp} />
      </mesh>

      {/* The right wall, built around the window opening. It used to be two
          panels with a gap between them, which is why the night — and the
          snow — was visible straight through the room. */}
      {[
        // shelves cover z −6…−3.1, so these only span −3.1…6
        { pos: [W / 2, 0.6, 1.45] as [number, number, number], size: [9.1, 1.2] as [number, number] },
        { pos: [W / 2, 5.5, 1.45] as [number, number, number], size: [9.1, 1.8] as [number, number] },
        { pos: [W / 2, 2.9, 3.55] as [number, number, number], size: [4.9, 3.4] as [number, number] },
      ].map((panel, i) => (
        <mesh key={i} position={panel.pos} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={panel.size} />
          <meshToonMaterial color="#4a2f1e" gradientMap={ramp} />
        </mesh>
      ))}

      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial color="#2a1a10" gradientMap={ramp} />
      </mesh>

      {/* the window you came in past — cold night outside */}
      <group position={[W / 2 - 0.3, 2.9, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0, -3]}>
          <planeGeometry args={[18, 12]} />
          <meshBasicMaterial ref={night} color="#0d1826" toneMapped={false} />
        </mesh>
        {/* wings, so an oblique view can't slip past the backdrop's edge */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 9, 0, -1.5]} rotation={[0, -sx * Math.PI / 2, 0]}>
            <planeGeometry args={[3, 12]} />
            <meshBasicMaterial color="#172c44" toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <WindowSnow />
        {[-1.05, 0, 1.05].map((x) => (
          <mesh key={x} position={[x, 0, 0.04]}>
            <boxGeometry args={[0.11, 3.4, 0.1]} />
            <meshToonMaterial color="#2a1a10" gradientMap={ramp} />
          </mesh>
        ))}
        {[-1.1, 0, 1.1].map((y) => (
          <mesh key={y} position={[0, y, 0.04]}>
            <boxGeometry args={[4.2, 0.11, 0.1]} />
            <meshToonMaterial color="#2a1a10" gradientMap={ramp} />
          </mesh>
        ))}

        {/* pole, pelmet and a pair of curtains drawn back */}
        <mesh position={[0, 1.92, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 5.4, 10]} />
          <meshToonMaterial color="#7a5220" gradientMap={ramp} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 2.72, 1.92, 0.2]}>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshToonMaterial color="#8a6a34" gradientMap={ramp} />
          </mesh>
        ))}
        <mesh position={[0, 1.98, 0.24]}>
          <boxGeometry args={[5, 0.42, 0.16]} />
          <meshToonMaterial color="#4a1616" gradientMap={ramp} />
        </mesh>
        <Curtain ramp={ramp} side={-1} height={4.78} />
        <Curtain ramp={ramp} side={1} height={4.78} />
        <pointLight position={[0, 0, 1.2]} color="#7fa6cc" intensity={7} distance={9} decay={2} />
      </group>

      {/* two, hung where people actually stand */}
      <Pendant ramp={ramp} position={[0.4, H, 1.4]} drop={2.6} size={1.15} prompt={prompt} onPrompt={onPrompt} />

      <BookTable ramp={ramp} />
      <Ladder ramp={ramp} />
      <Counter ramp={ramp} />
      {/* one reading chair, tucked out of the way */}
      <group position={[-5.9, 0, 0.6]} rotation={[0, 0.9, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1, 1.4]} />
          <meshToonMaterial color="#5c2b28" gradientMap={ramp} />
        </mesh>
        <mesh position={[0, 1.1, -0.58]}>
          <boxGeometry args={[1.5, 1.3, 0.3]} />
          <meshToonMaterial color="#65302c" gradientMap={ramp} />
        </mesh>
      </group>

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3} intensity={1.1} radius={0.7} />
        <Poster levels={11} grain={0.055} />
        <Vignette eskil={false} offset={0.26} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function Room({
  prompt,
  onPrompt,
  lit,
}: {
  prompt: boolean;
  onPrompt: () => void;
  lit: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 0.62 }}
      camera={{ position: [0, 3.1, 7.4], fov: 50, near: 0.1, far: 80 }}
    >
      <Scene prompt={prompt} onPrompt={onPrompt} lit={lit} />
    </Canvas>
  );
}
