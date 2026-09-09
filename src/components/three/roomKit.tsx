"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { makeRng } from "@/lib/rand";

/* ═══════════════════════════════════════════════════════════════════
   Shared fittings for the rooms behind the shopfronts.

   Anything both interiors need lives here so the bookshop and the
   workshop stay one place with two doors: the same wake-up ease, the
   same hotspot, the same night and weather through the glass.
   ═══════════════════════════════════════════════════════════════════ */

/** 0 while a room sleeps, 1 once it's woken. Written by the page, read each
    frame. Only one room is mounted at a time, so a single value is enough. */
export const roomLight = { v: 0 };

/** A hotspot: a steady ring with two pulses running out of it. Reads as
    "this is interactive" without spelling it out, and being real geometry it
    scales and sits in perspective with the lamp. */
export function Hotspot({ radius }: { radius: number }) {
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
      const p = (((t * 0.55 + i * 0.5) % 1) + 1) % 1;
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

/** Points the camera once on mount. Each room aims somewhere different, so
    the target comes in rather than being baked. */
export function Framing({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const [tx, ty, tz] = target;
  useEffect(() => {
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
  }, [camera, tx, ty, tz]);
  return null;
}

/** Curtains, drawn back either side. A lathe again: revolving a wavy
    profile gives the vertical folds of hanging fabric without modelling
    them one by one. Only a slice of the revolution is used. */
export function Curtain({
  ramp,
  side,
  height,
  color = "#5e1b1b",
}: {
  ramp: THREE.Texture;
  side: -1 | 1;
  height: number;
  color?: string;
}) {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
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
        <meshToonMaterial color={color} gradientMap={ramp} side={THREE.DoubleSide} />
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
export function WindowSnow({ count = 150 }: { count?: number }) {
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

/** The night beyond the glass, and the weather in it. Both rooms look onto
    the same street, so the view out is shared even though the rooms aren't. */
export function NightWindow({
  ramp,
  night,
  curtain,
}: {
  ramp: THREE.Texture;
  night: React.RefObject<THREE.MeshBasicMaterial | null>;
  curtain?: string;
}) {
  return (
    <>
      <mesh position={[0, 0, -3]}>
        <planeGeometry args={[18, 12]} />
        <meshBasicMaterial ref={night} color="#0d1826" toneMapped={false} />
      </mesh>
      {/* wings, so an oblique view can't slip past the backdrop's edge */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 9, 0, -1.5]} rotation={[0, (-sx * Math.PI) / 2, 0]}>
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
        <meshToonMaterial color={curtain ?? "#4a1616"} gradientMap={ramp} />
      </mesh>
      <Curtain ramp={ramp} side={-1} height={4.78} color={curtain} />
      <Curtain ramp={ramp} side={1} height={4.78} color={curtain} />
      <pointLight position={[0, 0, 1.2]} color="#7fa6cc" intensity={7} distance={9} decay={2} />
    </>
  );
}
