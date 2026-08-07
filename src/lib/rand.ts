/**
 * Deterministic PRNG. Every generated element (windows, stars, snow, rug knots)
 * must render identically on the server and the client, so nothing here may
 * touch Math.random().
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number) {
  const r = mulberry32(seed);
  return {
    next: r,
    /** float in [min, max) */
    range: (min: number, max: number) => min + r() * (max - min),
    /** integer in [min, max] */
    int: (min: number, max: number) => Math.floor(min + r() * (max - min + 1)),
    /** true with probability p */
    chance: (p: number) => r() < p,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)],
  };
}

export const round = (n: number, places = 2) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};
