import type { Rng } from './types';

/** A small seeded random generator (mulberry32), so tests can repeat a run exactly. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
export const chance = (r: Rng, p: number) => r() < p;
export const sign = (r: Rng, pNeg = 0.5) => (r() < pNeg ? -1 : 1);

export function shuffle<T>(r: Rng, xs: readonly T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** n different items from a list. */
export function sample<T>(r: Rng, xs: readonly T[], n: number): T[] {
  return shuffle(r, xs).slice(0, n);
}

/** Letters used in the questions (no i, l or o, which look like numbers). */
export const LETTERS = ['a', 'b', 'c', 'k', 'm', 'n', 'p', 'q', 't', 'x', 'y', 'w'] as const;
