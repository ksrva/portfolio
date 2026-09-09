"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { makeRng } from "@/lib/rand";
import { Poster, useToonRamp } from "./StreetScene";
import { Framing, Hotspot, NightWindow, roomLight } from "./roomKit";

/* ═══════════════════════════════════════════════════════════════════
   The workshop behind the second shopfront.

   Same pipeline and the same window onto the same street as the
   bookshop, so the two read as one town — but this is where things get
   made rather than shelved: a pegboard of tools, a drafting board with
   the drawing still on it, a plan chest, and one hard-working lamp on
   an arm instead of a soft dome on a flex.
   ═══════════════════════════════════════════════════════════════════ */

const BOARD_OFF = new THREE.Color("#141009");
const BOARD_ON = new THREE.Color("#6a5537");
const NIGHT_OFF = new THREE.Color("#0a1220");
const NIGHT_ON = new THREE.Color("#1b3550");

const SHADE_OFF = new THREE.Color("#33291a");
const SHADE_ON = new THREE.Color("#e8b268");
const BULB_OFF = new THREE.Color("#6b4a24");
const BULB_ON = new THREE.Color("#ffe4b4");

const W = 15; // width
const H = 6.4; // height
const D = 12; // depth

/** Pegboard: a grid of holes punched into a warm ply. Drawn once to a
    canvas and tiled, the same trick the bookshelf wall uses. */
function usePegboard() {
  return useMemo(() => {
    const s = 128;
    const cv = document.createElement("canvas");
    cv.width = s;
    cv.height = s;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#c9a978";
    g.fillRect(0, 0, s, s);

    // faint ply grain, so the board isn't a flat field under the holes
    g.strokeStyle = "rgba(120,88,52,0.16)";
    g.lineWidth = 1;
    for (let y = 4; y < s; y += 9) {
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(s * 0.3, y - 2, s * 0.7, y + 2, s, y);
      g.stroke();
    }

    g.fillStyle = "#2a1d0f";
    for (let y = 8; y < s; y += 16) {
      for (let x = 8; x < s; x += 16) {
        g.beginPath();
        g.arc(x, y, 2.1, 0, Math.PI * 2);
        g.fill();
      }
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(9, 4);
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/** A drawing pinned to the board: pale ink on blue, just enough line work
    to read as a plan from across the room. */
function useBlueprint(seed: number) {
  return useMemo(() => {
    const rng = makeRng(seed);
    const w = 256;
    const h = 176;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#1c3b5c";
    g.fillRect(0, 0, w, h);

    // grid
    g.strokeStyle = "rgba(190,220,245,0.12)";
    g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }

    // an elevation of something — boxes, a circle, a couple of leader lines
    g.strokeStyle = "rgba(215,235,255,0.85)";
    g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const bx = rng.range(24, w - 96);
      const by = rng.range(22, h - 70);
      g.strokeRect(bx, by, rng.range(34, 74), rng.range(26, 52));
    }
    g.beginPath();
    g.arc(rng.range(60, w - 60), rng.range(50, h - 50), rng.range(14, 26), 0, Math.PI * 2);
    g.stroke();

    g.strokeStyle = "rgba(215,235,255,0.4)";
    g.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = rng.range(16, h - 16);
      g.beginPath();
      g.moveTo(12, y);
      g.lineTo(w - 12, y);
      g.stroke();
    }

    // title block, bottom right
    g.strokeStyle = "rgba(215,235,255,0.7)";
    g.lineWidth = 1.4;
    g.strokeRect(w - 84, h - 40, 72, 28);
    g.fillStyle = "rgba(215,235,255,0.55)";
    for (let i = 0; i < 3; i++) g.fillRect(w - 78, h - 34 + i * 8, rng.range(20, 58), 2);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [seed]);
}

/** The lamp you click. An anglepoise on the drafting board: two arms, a
    spring, and a cone pointed at the work — deliberately not the bookshop's
    hanging dome, so the rooms don't read as the same room redressed. */
function TaskLamp({
  ramp,
  position,
  prompt = false,
  onPrompt,
}: {
  ramp: THREE.Texture;
  position: [number, number, number];
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
    // a filament stutters harder than a soft shade before it settles
    const e = k > 0.985 ? 1 : k * (0.48 + 0.52 * Math.abs(Math.sin(k * 30)));
    if (shade.current) shade.current.color.copy(SHADE_OFF).lerp(SHADE_ON, e);
    if (bulb.current) bulb.current.color.copy(BULB_OFF).lerp(BULB_ON, e);
    if (light.current) light.current.intensity = (22 + 30 * roomLight.v) * e;
  });

  const arm = "#3d3226";

  return (
    <group position={position}>
      {/* weighted base */}
      <mesh>
        <cylinderGeometry args={[0.34, 0.4, 0.1, 16]} />
        <meshToonMaterial color={arm} gradientMap={ramp} />
      </mesh>

      {/* lower arm, raked back */}
      <group rotation={[0, 0, 0.42]}>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.24, 8]} />
          <meshToonMaterial color={arm} gradientMap={ramp} />
        </mesh>
        {/* the spring that holds it up */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.9, 8, 1, true]} />
          <meshToonMaterial color="#5b4a33" gradientMap={ramp} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* elbow */}
      <mesh position={[-0.51, 1.16, 0]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshToonMaterial color="#59492f" gradientMap={ramp} />
      </mesh>

      {/* upper arm, reaching out over the board */}
      <group position={[-0.51, 1.16, 0]} rotation={[0, 0, -1.05]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 1, 8]} />
          <meshToonMaterial color={arm} gradientMap={ramp} />
        </mesh>
      </group>

      {/* the head: a cone aimed down at the work */}
      <group position={[0.36, 1.63, 0]} rotation={[0.5, 0, -0.5]}>
        <mesh>
          <coneGeometry args={[0.42, 0.5, 18, 1, true]} />
          <meshBasicMaterial ref={shade} color="#33291a" side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshBasicMaterial ref={bulb} color="#6b4a24" toneMapped={false} />
        </mesh>
      </group>

      <pointLight
        ref={light}
        position={[0.5, 1.35, 0.3]}
        color="#ffb055"
        intensity={0}
        distance={16}
        decay={1.6}
      />

      {prompt && (
        <>
          <mesh
            position={[0.36, 1.5, 0]}
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
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {/* concentric with the cone head */}
          <group position={[0.36, 1.63, 0.42]}>
            <Hotspot radius={0.62} />
          </group>
        </>
      )}
    </group>
  );
}

/** The drafting board: a raked top on a trestle, with the drawing taped
    down and the tools of the trade lying on it. */
function DraftingBoard({ ramp }: { ramp: THREE.Texture }) {
  const plan = useBlueprint(31);
  return (
    <group position={[-0.4, 0, 0.6]}>
      {/* legs */}
      {[
        [-1.7, -0.5],
        [1.7, -0.5],
        [-1.7, 0.7],
        [1.7, 0.7],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.5, z]}>
          <boxGeometry args={[0.14, 1, 0.14]} />
          <meshToonMaterial color="#3a2a17" gradientMap={ramp} />
        </mesh>
      ))}
      {/* stretcher */}
      <mesh position={[0, 0.28, 0.1]}>
        <boxGeometry args={[3.4, 0.1, 0.12]} />
        <meshToonMaterial color="#3a2a17" gradientMap={ramp} />
      </mesh>

      {/* the raked top */}
      <group position={[0, 1.02, 0.1]} rotation={[-0.34, 0, 0]}>
        <mesh>
          <boxGeometry args={[3.7, 0.09, 2.3]} />
          <meshToonMaterial color="#6b5335" gradientMap={ramp} />
        </mesh>
        {/* the drawing, taped down */}
        <mesh position={[-0.15, 0.055, 0.05]} rotation={[-Math.PI / 2, 0, 0.02]}>
          <planeGeometry args={[2.5, 1.72]} />
          <meshBasicMaterial map={plan} toneMapped={false} />
        </mesh>
        {/* parallel rule across the board */}
        <mesh position={[0, 0.1, -0.42]}>
          <boxGeometry args={[3.5, 0.04, 0.14]} />
          <meshToonMaterial color="#8a7550" gradientMap={ramp} />
        </mesh>
        {/* a set square, left where it was put down */}
        <mesh position={[1.24, 0.09, 0.5]} rotation={[-Math.PI / 2, 0, 0.6]}>
          <circleGeometry args={[0.36, 3]} />
          <meshBasicMaterial color="#9fd0e8" transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        {/* two pencils */}
        {[
          [-1.35, 0.62, 1.5],
          [-1.5, 0.5, 1.42],
        ].map(([x, z, rot], i) => (
          <mesh key={i} position={[x, 0.09, z - 1]} rotation={[0, rot, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.5, 6]} />
            <meshToonMaterial color={i ? "#b8863a" : "#7a3b32"} gradientMap={ramp} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A plan chest — the wide shallow drawers drawings get filed flat in.
    Reads instantly as a room where things are drawn. */
function PlanChest({ ramp, x, z, rotY = 0 }: { ramp: THREE.Texture; x: number; z: number; rotY?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[2.9, 1.24, 1.5]} />
        <meshToonMaterial color="#4a3520" gradientMap={ramp} />
      </mesh>
      {/* drawer fronts, with a brass pull on each */}
      {[0.22, 0.5, 0.78, 1.06].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.76]}>
            <boxGeometry args={[2.74, 0.24, 0.06]} />
            <meshToonMaterial color="#5b4426" gradientMap={ramp} />
          </mesh>
          <mesh position={[0, y, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.44, 8]} />
            <meshToonMaterial color="#b08a3c" gradientMap={ramp} />
          </mesh>
        </group>
      ))}
      {/* rolled drawings standing in a crock on top */}
      <mesh position={[0.95, 1.42, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.42, 12]} />
        <meshToonMaterial color="#3f5a52" gradientMap={ramp} />
      </mesh>
      {[
        [0.86, 0.1, 0.14],
        [1.02, -0.08, 0.2],
        [0.95, 0.04, -0.1],
      ].map(([rx, tilt, rz], i) => (
        <mesh key={i} position={[rx, 2.05, rz]} rotation={[tilt, 0, tilt * 0.6]}>
          <cylinderGeometry args={[0.055, 0.055, 1.3, 8]} />
          <meshToonMaterial color={i === 1 ? "#c8b48c" : "#ddd0b4"} gradientMap={ramp} />
        </mesh>
      ))}
    </group>
  );
}

/** Tools hung on the pegboard. Silhouettes, not models — at this distance
    the outline is the whole story. */
function PegTools({ ramp }: { ramp: THREE.Texture }) {
  const steel = "#8d9299";
  const handle = "#6b3f22";
  return (
    <group position={[0, 0, -D / 2 + 0.2]}>
      {/* a row of hanging hand tools */}
      {[-4.6, -3.5, -2.5].map((x, i) => (
        <group key={x} position={[x, 4.3 - i * 0.12, 0]}>
          <mesh position={[0, -0.42, 0]}>
            <boxGeometry args={[0.11, 0.84, 0.07]} />
            <meshToonMaterial color={handle} gradientMap={ramp} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.5, 0.2, 0.09]} />
            <meshToonMaterial color={steel} gradientMap={ramp} />
          </mesh>
        </group>
      ))}

      {/* a coil of cable on a hook */}
      <mesh position={[3.9, 4.1, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.07, 6, 18]} />
        <meshToonMaterial color="#4a4238" gradientMap={ramp} />
      </mesh>

      {/* a straight-edge and a square, hung flat */}
      <mesh position={[2.1, 4.2, 0.05]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[1.9, 0.11, 0.05]} />
        <meshToonMaterial color="#b8a179" gradientMap={ramp} />
      </mesh>
      <mesh position={[5.4, 3.9, 0.05]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.9, 0.1, 0.05]} />
        <meshToonMaterial color={steel} gradientMap={ramp} />
      </mesh>
      <mesh position={[5.68, 3.62, 0.05]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.9, 0.1, 0.05]} />
        <meshToonMaterial color={steel} gradientMap={ramp} />
      </mesh>
    </group>
  );
}

/** Blueprints pinned up, slightly askew — nobody pins them straight. */
function PinnedPlans({ seeds }: { seeds: readonly [number, number, number][] }) {
  const a = useBlueprint(seeds[0][0]);
  const b = useBlueprint(seeds[1][0]);
  const c = useBlueprint(seeds[2][0]);
  const maps = [a, b, c];
  return (
    <>
      {seeds.map(([, x, y], i) => (
        <mesh key={i} position={[x, y, -D / 2 + 0.26]} rotation={[0, 0, i === 1 ? -0.04 : 0.03]}>
          <planeGeometry args={[2.1, 1.44]} />
          <meshBasicMaterial map={maps[i]} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** Crates and bins of parts, stacked against the wall. */
function Crates({ ramp }: { ramp: THREE.Texture }) {
  const rng = makeRng(88);
  return (
    <group position={[5.4, 0, -2.2]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[rng.range(-0.2, 0.2), 0.4 + i * 0.76, rng.range(-0.2, 0.2)]} rotation={[0, rng.range(-0.25, 0.25), 0]}>
          <boxGeometry args={[1.4, 0.74, 1.2]} />
          <meshToonMaterial color={["#6b4a29", "#5a4526", "#75542f"][i]} gradientMap={ramp} />
        </mesh>
      ))}
    </group>
  );
}

/** Eases the workshop from dark to lit. The pegboard and the night outside
    are unlit materials, so they have to be driven explicitly. */
function Lighting({
  lit,
  ambient,
  boards,
  night,
}: {
  lit: boolean;
  ambient: React.RefObject<THREE.AmbientLight | null>;
  boards: React.RefObject<(THREE.MeshBasicMaterial | null)[]>;
  night: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  /* eslint-disable react-hooks/immutability */
  useFrame(({ gl }, dt) => {
    roomLight.v += ((lit ? 1 : 0) - roomLight.v) * Math.min(1, dt * 2.2);
    const e = roomLight.v;
    if (ambient.current) ambient.current.intensity = 0.03 + 0.92 * e;
    boards.current.forEach((m) => {
      if (m) m.color.copy(BOARD_OFF).lerp(BOARD_ON, e);
    });
    if (night.current) night.current.color.copy(NIGHT_OFF).lerp(NIGHT_ON, e);
    gl.toneMappingExposure = 0.34 + 0.5 * e;
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

function Scene({ prompt, onPrompt, lit }: { prompt: boolean; onPrompt: () => void; lit: boolean }) {
  const ramp = useToonRamp();
  const peg = usePegboard();
  const ambient = useRef<THREE.AmbientLight>(null);
  const boards = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const night = useRef<THREE.MeshBasicMaterial>(null);

  return (
    <>
      <Framing target={[0, 2.2, -2.4]} />
      <color attach="background" args={["#100b06"]} />
      <fogExp2 attach="fog" args={["#191008", 0.024]} />

      <Lighting lit={lit} ambient={ambient} boards={boards} night={night} />
      <ambientLight ref={ambient} intensity={0.05} color="#6b5434" />

      {/* concrete floor — swept, not carpeted */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial color="#6d6154" gradientMap={ramp} />
      </mesh>
      {/* a rubber mat where you'd actually stand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0.012, 1.9]}>
        <planeGeometry args={[4.2, 2.2]} />
        <meshToonMaterial color="#3b3630" gradientMap={ramp} />
      </mesh>

      {/* back wall: pegboard, floor to ceiling */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial
          ref={(m) => {
            boards.current[0] = m;
          }}
          map={peg}
          toneMapped={false}
          color="#8a6a48"
        />
      </mesh>
      {/* a bench rail across it, so the wall has some relief */}
      <mesh position={[0, 2.6, -D / 2 + 0.14]}>
        <boxGeometry args={[W, 0.16, 0.28]} />
        <meshToonMaterial color="#3a2a17" gradientMap={ramp} />
      </mesh>

      <PegTools ramp={ramp} />
      <PinnedPlans
        seeds={[
          [7, -5.2, 1.5],
          [19, 0.2, 1.35],
          [23, 5.1, 1.6],
        ]}
      />

      {/* side walls: plain plaster, this isn't a shop floor */}
      <mesh position={[-W / 2, H / 2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D - 3, H]} />
        <meshBasicMaterial
          ref={(m) => {
            boards.current[1] = m;
          }}
          toneMapped={false}
          color="#4a3a28"
        />
      </mesh>
      <mesh position={[W / 2, H / 2, -4.55]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.9, H]} />
        <meshBasicMaterial
          ref={(m) => {
            boards.current[2] = m;
          }}
          toneMapped={false}
          color="#4a3a28"
        />
      </mesh>

      {/* ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial color="#241a10" gradientMap={ramp} />
      </mesh>

      {/* the same window onto the same street */}
      <group position={[W / 2 - 0.3, 2.9, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <NightWindow ramp={ramp} night={night} curtain="#3d4a3a" />
      </group>

      <DraftingBoard ramp={ramp} />
      <PlanChest ramp={ramp} x={-5.6} z={-2.4} rotY={0.5} />
      <Crates ramp={ramp} />

      {/* the lamp you click, standing on the board's right-hand corner */}
      <TaskLamp ramp={ramp} position={[1.7, 1.12, 1.1]} prompt={prompt} onPrompt={onPrompt} />

      {/* a stool, pushed back from the board */}
      <group position={[-0.6, 0, 2.5]}>
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 14]} />
          <meshToonMaterial color="#5c4326" gradientMap={ramp} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.3, 0.36, Math.sin(a) * 0.3]} rotation={[0.1, 0, 0.1]}>
              <cylinderGeometry args={[0.045, 0.045, 0.74, 6]} />
              <meshToonMaterial color="#3a2a17" gradientMap={ramp} />
            </mesh>
          );
        })}
      </group>

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.3} intensity={1.1} radius={0.7} />
        <Poster levels={11} grain={0.055} />
        <Vignette eskil={false} offset={0.26} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function Workshop({
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
