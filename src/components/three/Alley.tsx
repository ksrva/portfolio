"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { ALLEY, STREET_HALF, useWallMap, useWallTextures } from "./buildings";

/* ═══════════════════════════════════════════════════════════════════
   The alley, and the poster wall down it.

   A deliberate gap in the right-hand row — everywhere else the rows sit
   0.2–0.9 apart, which is a shadow rather than a way through.

   Inside, the drawings are the one thing in the whole scene that isn't
   stylised. Everywhere else light is quantised into flat toon bands,
   which would shred pencil work into three tones — so the sheets use a
   lambert material instead: no banding, and they take the light properly,
   which is what lets a string of small lamps read across them.

   They go up on one wall, squared up and evenly spaced — the highlighted
   sheet centred with the other four around it — on mixed paper stock,
   held with push pins, with a string of lights across the lot.
   ═══════════════════════════════════════════════════════════════════ */

/** How far back the alley runs from the street edge. */
export const ALLEY_D = 18;
const WALL_H = 24;

/** 0 out on the street, 1 once you've walked in. Written by the Rig each
    frame, read here to bring the lights up. Same shape as `roomLight`. */
export const alleyLight = { v: 0 };

/** Follows the street's own intro: 0 before the lamps strike, 1 once they're
    all lit. Drives the one lamp left out on the facade beside the gap.
    Written by IntroClock, same as setAccentGlow. */
export const alleyGlow = { v: 0 };

const LAMP_OFF = new THREE.Color("#100a04");
const LAMP_ON = new THREE.Color("#ffb768");

/* The fairy lights share one material — a module-level instance ramped once
   a frame, exactly as buildings.tsx does with ACCENT. Twenty-six bulbs, one
   colour write, and nothing reaching into a hook's return value. */
const FAIRY_OFF = new THREE.Color("#0d0a06");
const FAIRY_ON = new THREE.Color("#ffd9a0");
const FAIRY = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });

/** Where the cluster sits along the alley, and how wide it runs. */
const WALL_X = STREET_HALF + 7;

/* Where you stand, and what you look at.

   The sheets are on the FAR wall, whose face points back up the street —
   so looking at it means looking in −z, the same heading you were already
   walking. Stepping into the alley is a sidestep rather than a 90° turn,
   which is what stops the entry reading as being swung around.

   You stand almost against the opposite wall — 0.55 off it, so about 5.0
   back from the sheets. The extra half-unit is not cosmetic: at 0.9 off,
   the frame was only wide enough on a 16:9 window, and the outer columns
   fell outside a 16:10 one, which is what most laptops are. */
export const ALLEY_CAM = new THREE.Vector3(WALL_X, 3.3, ALLEY.zNear - 0.55);
export const ALLEY_LOOK = new THREE.Vector3(WALL_X, 3.2, ALLEY.zFar);

/** Which sheet you've stepped up to, if any.

    A nested pose rather than a separate mode: the closer look is still the
    alley, just further in, so backing out of a sheet puts you exactly where
    you were standing at the wall. Written on click, read by the Rig. */
export const alleyFocus = {
  want: false,
  t: 0,
  /** the url of the sheet in focus, so clicking it again steps back out */
  id: "",
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
};

/** The sheet that takes the middle of the wall, matched by filename. */
const HIGHLIGHT = /ststephens/i;

/** Reference photos: they live in the sketches folder alongside the drawings
    but belong to one sketch rather than to the gallery, so they never get
    hung on the wall. Anything named "<something>-ref.<ext>". */
const REFERENCE = /-ref\.[a-z0-9]+$/i;

type Slot = {
  pos: [number, number, number];
  h: number;
  /** the paper it's printed on; the set is deliberately mixed stock */
  paper: string;
};

/* The arrangement: the highlighted sheet centred, the other four squared up
   around it in two columns and two rows. Nothing overlaps and nothing is
   tilted. The four share a height so the rows line up, and each column
   shares a centre line, so the set reads as deliberately hung.

   Widths still differ — they follow each drawing's own aspect, and the
   sketches aren't all the same shape — so the columns align on their centre
   lines rather than their edges.

   Sized to the narrowest screen worth supporting rather than the widest.
   Every sheet's paper runs MARGIN past its image on all four sides, so the
   real extents are wider than the drawings — measured, not eyeballed: the
   first pass left the rows 0.02 apart, which is no overlap and still reads
   as touching. */
function slots(): Slot[] {
  const { zFar } = ALLEY;
  const Z = zFar + 0.06; // just clear of the brick
  const COL = 2.4; // how far the side columns sit off centre
  const TOP = 4.4;
  const BOTTOM = 2.2;
  const SIDE_H = 1.6; // shared, so the two rows line up

  return [
    // the middle — the largest, and the one the wire hangs closest over
    { pos: [WALL_X, 3.3, Z], h: 2.7, paper: "#efe9d8" },
    // top row
    { pos: [WALL_X - COL, TOP, Z], h: SIDE_H, paper: "#e3d7b6" },
    { pos: [WALL_X + COL, TOP, Z], h: SIDE_H, paper: "#d9cfa4" },
    // bottom row
    { pos: [WALL_X - COL, BOTTOM, Z], h: SIDE_H, paper: "#dfe3dd" },
    { pos: [WALL_X + COL, BOTTOM, Z], h: SIDE_H, paper: "#e8ddbe" },
  ];
}

/** One sheet, pinned up. Width follows the image's own aspect so nothing is
    stretched — the sketches are all slightly different shapes. */
function Poster({
  url,
  slot,
  onWip,
}: {
  url: string;
  slot: Slot;
  /** given only to the sheet that has a reference photo: clicking it opens
      the two of them side by side instead of stepping the camera up */
  onWip?: () => void;
}) {
  const raw = useTexture(url);

  /* drei caches textures globally, so the object it hands back is shared with
     anything else asking for the same file — setting colorSpace on it would
     reach outside this component. Clone first and dress the copy, which is
     what useWallMap does before setting a repeat. */
  const tex = useMemo(() => {
    const t = raw.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [raw]);

  const img = raw.image as { width: number; height: number } | undefined;
  const aspect = img && img.height ? img.width / img.height : 0.8;
  const h = slot.h;
  const w = h * aspect;

  /* The sheet's own margin — paper all the way out, part of the print
     rather than a mount sitting behind it. */
  const MARGIN = 0.14;

  /* Step up to it, or step back if you're already there.

     The guard matters: r3f raycasts every mesh carrying a handler and does
     not treat the building in between as opaque, so without it a click from
     out on the street would reach straight through the wall and pull you
     into a sheet you cannot even see. */
  const look = (e: { stopPropagation: () => void }) => {
    if (alleyLight.v < 0.6) return;
    e.stopPropagation();
    // the one with a reference photo opens the comparison instead
    if (onWip) {
      onWip();
      return;
    }
    if (alleyFocus.want && alleyFocus.id === url) {
      alleyFocus.want = false;
      alleyFocus.id = "";
      return;
    }
    const [px, py, pz] = slot.pos;
    /* Far enough back that the sheet fills the frame with a little air:
       the view is 2·tan(27°) ≈ 1.02 units tall per unit of distance, and
       1.25 leaves the margin visible rather than cropping to the image. */
    const d = (h + MARGIN * 2) * 1.227;
    alleyFocus.pos.set(px, py, pz + d);
    alleyFocus.look.set(px, py, pz);
    alleyFocus.id = url;
    alleyFocus.want = true;
  };

  return (
    <group position={slot.pos}>
      <mesh
        onClick={look}
        onPointerOver={(e) => {
          if (alleyLight.v < 0.6) return;
          e.stopPropagation();
          document.body.style.cursor = "zoom-in";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[w + MARGIN * 2, h + MARGIN * 2]} />
        <meshLambertMaterial color={slot.paper} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[w, h]} />
        <meshLambertMaterial map={tex} />
      </mesh>
      {/* a push pin at each top corner, sitting on the paper */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (w / 2 - 0.1), h / 2 - 0.08, 0.02]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color="#cdd5da" />
        </mesh>
      ))}
    </group>
  );
}

/** The string, and the only thing lighting the alley.

    There was a spotlight on the middle sheet and a fill light on the wall.
    Between them, bloom, and paper that reflects nearly everything falling
    on it, the centre burned out to flat white — the drawing was gone. So
    the lights on the wire are now the whole lighting rig: two soft sources
    hung where the swags dip, and nothing else.

    Self-contained rather than threaded through Lighting: it owns its own
    bulbs and its own two lamps, so there are no extra refs to pass. */
function FairyString({ z }: { z: number }) {
  const left = useRef<THREE.PointLight>(null);
  const right = useRef<THREE.PointLight>(null);

  /* Two shallow swags across the top of the cluster. */
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      out.push([
        WALL_X - 3.8 + t * 7.6,
        5.62 - 0.46 * Math.sin(Math.PI * ((t * 2) % 1)),
        z + 0.24,
      ]);
    }
    return out;
  }, [z]);

  /* No eslint-disable needed here, unlike Lighting below: the immutability
     rule only objects to refs arrived as props, and these two are created
     in this component. FAIRY is module scope, so it's nobody's hook value. */
  useFrame(() => {
    const e = alleyLight.v;
    FAIRY.color.copy(FAIRY_OFF).lerp(FAIRY_ON, e);
    if (left.current) left.current.intensity = 2.6 * e;
    if (right.current) right.current.intensity = 2.6 * e;
  });

  return (
    <>
      {bulbs.map(([bx, by, bz]) => (
        <mesh key={`${bx}-${by}`} position={[bx, by, bz]} material={FAIRY}>
          <sphereGeometry args={[0.052, 8, 8]} />
        </mesh>
      ))}
      {/* hung off the wire itself, and deliberately weak: the sheets should
          be legible in warm half-light, not lit like a gallery */}
      <pointLight
        ref={left}
        position={[WALL_X - 1.9, 5.0, z + 0.9]}
        color="#ffc07a"
        intensity={0}
        distance={9}
        decay={1.6}
      />
      <pointLight
        ref={right}
        position={[WALL_X + 1.9, 5.0, z + 0.9]}
        color="#ffc07a"
        intensity={0}
        distance={9}
        decay={1.6}
      />
    </>
  );
}

/** Brings the alley up as you walk in. Everything in here is off out on the
    street — that's what keeps it a dark slot rather than an invitation. */
function Lighting({
  ambient,
  marker,
  markerBulb,
}: {
  ambient: React.RefObject<THREE.AmbientLight | null>;
  marker: React.RefObject<THREE.PointLight | null>;
  markerBulb: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  /* eslint-disable react-hooks/immutability */
  useFrame(() => {
    /* Barely anything: just enough that the brick isn't pure black behind
       the wire. All the actual light comes off the string. */
    const e = alleyLight.v;
    if (ambient.current) ambient.current.intensity = 0.02 + 0.09 * e;

    /* The facade lamp is the exception: it runs off the street's intro, not
       off whether you've come in, so it's alight while you're still out on
       the road. */
    const g = alleyGlow.v;
    if (marker.current) marker.current.intensity = 20 * g;
    if (markerBulb.current) markerBulb.current.color.copy(LAMP_OFF).lerp(LAMP_ON, g);
  });
  /* eslint-enable react-hooks/immutability */
  return null;
}

export function Alley({
  ramp,
  sketches,
  onWip,
}: {
  ramp: THREE.Texture;
  sketches: string[];
  /** called with the sketch's filename, so the view knows which pair to show */
  onWip: (file: string) => void;
}) {
  const walls = useWallTextures();
  const { zNear, zFar, z, width } = ALLEY;

  const brick = useWallMap(walls.brick, ALLEY_D, WALL_H);
  const stone = useWallMap(walls.stone, ALLEY_D, WALL_H);
  const back = useWallMap(walls.stucco, width, WALL_H);

  const ambient = useRef<THREE.AmbientLight>(null);
  const marker = useRef<THREE.PointLight>(null);
  const markerBulb = useRef<THREE.MeshBasicMaterial>(null);

  /* The highlighted sheet takes the middle; the rest fill the surrounding
     slots in whatever order they came off disk. More than five and the
     extras simply aren't put up — the wall is the size it is. */
  const hung = useMemo(() => {
    const s = slots();
    /* Reference photos sit in the same folder but never go on the wall —
       they belong to one sketch rather than to the gallery. Filtered first,
       and deliberately before HIGHLIGHT runs: "ststephens-ref.jpg" matches
       /ststephens/ too, and sorts ahead of "ststephens.jpg" ('-' is 45, '.'
       is 46), so without this the photo would be picked as the centrepiece
       and one real sketch would fall off the end of the five slots. */
    const wall = sketches.filter((f) => !REFERENCE.test(f));
    const star = wall.find((f) => HIGHLIGHT.test(f));
    const rest = wall.filter((f) => f !== star);
    const order = star ? [star, ...rest] : rest;
    return order.slice(0, s.length).map((file, i) => ({ file, slot: s[i] }));
  }, [sketches]);

  /* Which sheets have a photo to sit beside. Derived from the folder rather
     than listed here: a drawing gets the comparison the moment a file named
     "<drawing>-ref.<ext>" appears next to it, and not before. */
  const withReference = useMemo(() => {
    return new Set(
      sketches
        .filter((f) => REFERENCE.test(f))
        .map((f) => f.replace(/-ref\.[a-z0-9]+$/i, "").toLowerCase()),
    );
  }, [sketches]);

  const mid = STREET_HALF + ALLEY_D / 2;

  return (
    <group>
      <ambientLight ref={ambient} intensity={0.02} color="#8a7a5f" />
      <Lighting ambient={ambient} marker={marker} markerBulb={markerBulb} />

      {/* side walls — the exposed flanks of the two neighbouring buildings.
          The far one is the poster wall, so it gets the plainer stone. */}
      <mesh position={[mid, WALL_H / 2, zNear]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ALLEY_D, WALL_H]} />
        <meshToonMaterial map={brick} color="#4a3529" gradientMap={ramp} />
      </mesh>
      <mesh position={[mid, WALL_H / 2, zFar]}>
        <planeGeometry args={[ALLEY_D, WALL_H]} />
        <meshToonMaterial map={stone} color="#3f3a33" gradientMap={ramp} />
      </mesh>

      {/* the wall that closes it off */}
      <mesh position={[STREET_HALF + ALLEY_D, WALL_H / 2, z]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[width, WALL_H]} />
        <meshToonMaterial map={back} color="#463b30" gradientMap={ramp} />
      </mesh>

      {/* ground: wet stone, with snow banked where it hasn't been walked */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mid, 0.012, z]}>
        <planeGeometry args={[ALLEY_D, width]} />
        <meshToonMaterial color="#39414d" gradientMap={ramp} />
      </mesh>
      {[zNear - 0.5, zFar + 0.5].map((zz) => (
        <mesh key={zz} position={[mid, 0.1, zz]}>
          <boxGeometry args={[ALLEY_D, 0.2, 0.8]} />
          <meshToonMaterial color="#d7e0ec" gradientMap={ramp} />
        </mesh>
      ))}

      {/* A bracket lamp on the street-facing wall, right beside the gap.

          This is the one that actually marks the alley. The lantern inside
          is hidden behind the Projects building until you're almost level
          with the opening — measured, it only clears the corner at 77% of
          the way down the street, and by then it sits 75° off your forward
          view. This one is on the facade itself, so it's in sight the whole
          way down and gives the eye a reason to turn. */}
      <mesh position={[STREET_HALF - 0.44, 5.55, zNear + 1.15]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.34, 0.46, 10, 1, true]} />
        <meshToonMaterial color="#2b2118" gradientMap={ramp} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[STREET_HALF - 0.44, 5.28, zNear + 1.15]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshBasicMaterial ref={markerBulb} color="#100a04" toneMapped={false} />
      </mesh>
      <pointLight
        ref={marker}
        position={[STREET_HALF - 0.85, 5.1, zNear + 1.15]}
        color="#ff9d4a"
        intensity={0}
        distance={15}
        decay={1.6}
      />

      {/* Nothing inside the mouth any more. The lantern that stood a couple
          of units in was doing the same job as the facade lamp and reading
          as clutter from the street; the "Take a peek" prompt now carries
          the invitation, so the gap itself can stay dark. */}

      <FairyString z={zFar} />

      {/* The drawings load from disk, so they suspend. Nothing else in the
          scene does, which is why this boundary is here and not at the root. */}
      <Suspense fallback={null}>
        {hung.map(({ file, slot }) => (
          <Poster
            key={file}
            url={`/sketches/${file}`}
            slot={slot}
            onWip={
              withReference.has(file.replace(/\.[^.]+$/, "").toLowerCase())
                ? () => onWip(file)
                : undefined
            }
          />
        ))}
      </Suspense>
    </group>
  );
}
