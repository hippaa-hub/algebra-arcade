// Level 4 — Exponent Rocket: an exponent is repeated multiplication, so multiplying powers of the same base
// adds the exponents. Coefficients are multiplied on their own; different bases never merge.
import { fmt, fmtFactor, letterPart, mulTerms, term, type Term } from '../../math/term';
import { isHomework } from '../homework';
import { chance, int, LETTERS, pick, sample, sign } from '../random';
import type { FuelQ, Rng, Tier } from '../types';

const chainOf = (t: Term) => {
  const parts: string[] = [];
  if (t.c !== 1) parts.push(String(t.c).replace('-', '−'));
  for (const l of Object.keys(t.v).sort()) for (let i = 0; i < t.v[l]; i++) parts.push(l);
  return parts.join(' × ');
};

function letterWhy(factors: Term[], answer: Term): string {
  return Object.keys(answer.v).sort().map((l) => {
    const es = factors.map((f) => f.v[l]).filter((e): e is number => !!e);
    return es.length > 1 ? `${l}: ${es.join(' + ')} = ${answer.v[l]}` : `${l}: only one lot, so ${l}${answer.v[l] === 1 ? '' : letterPart({ [l]: answer.v[l] }).slice(1)}`;
  }).join(' · ');
}

function merge(_r: Rng, concept: FuelQ['concept'], tier: Tier, cells: boolean, make: () => Term[]): FuelQ {
  for (let tries = 0; ; tries++) {
    const factors = make();
    const expr = factors.map((f) => fmtFactor(f)).join(' × ');
    const answer = mulTerms(...factors);
    if ((isHomework(expr) || Object.values(answer.v).some((e) => e > 12)) && tries < 100) continue;
    const coefs = factors.map((f) => f.c);
    const coefText = coefs.some((c) => c !== 1) ? `Numbers: ${coefs.map((c) => (c < 0 ? `(${c})` : c)).join(' × ').replace(/-/g, '−')} = ${answer.c}. ` : '';
    return {
      kind: 'fuel', concept, tier, mode: 'merge', factors, answer, cells, expr,
      key: `fuel:merge:${expr}`,
      hint: concept === 'multivar' ? 'Only the same letter can merge. Do each letter on its own.'
        : concept === 'coefpow' ? 'Two jobs: multiply the numbers, then add the exponents of the letter.'
          : 'Write each power as a chain of letters and count them all.',
      why: `${coefText}${letterWhy(factors, answer)}. So ${expr} = ${fmt(answer)}.`,
      rule: concept === 'multivar'
        ? 'Add the exponents of each letter separately. Different letters do not merge: x² × y³ = x²y³.'
        : concept === 'coefpow'
          ? 'Multiply the coefficients. Add the exponents of the same base: 2x³ × 5x² = 10x⁵.'
          : 'Same base: add the exponents. x³ × x² = (x·x·x)(x·x) = x⁵, because there are 5 x’s.',
      demo: { v: 'expand', factors },
    };
  }
}

/** 'repeat': repeated multiplication ↔ power. */
export function fuelRepeat(r: Rng, tier: Tier): FuelQ {
  let t: Term;
  let mode: FuelQ['mode'];
  if (tier === 1) { t = term(1, { [pick(r, LETTERS)]: int(r, 2, 6) }); mode = 'count'; }
  else if (tier === 2) { t = term(1, { [pick(r, LETTERS)]: int(r, 3, 7) }); mode = 'expand'; }
  else if (chance(r, 0.5)) { t = term(int(r, 2, 9), { [pick(r, LETTERS)]: int(r, 2, 5) }); mode = 'count'; }
  else { const [a, b] = sample(r, LETTERS, 2); t = term(1, { [a]: int(r, 1, 3), [b]: int(r, 2, 4) }); mode = 'count'; }
  const chain = chainOf(t);
  return {
    kind: 'fuel', concept: 'repeat', tier, mode, factors: [t], answer: t, cells: true, expr: mode === 'count' ? chain : fmt(t),
    key: `fuel:${mode}:${fmt(t)}`,
    hint: mode === 'expand' ? 'The exponent tells you how many times the letter is multiplied.' : 'Count how many times each letter appears.',
    why: `${chain} = ${fmt(t)}. The exponent counts how many times the letter is multiplied by itself.`,
    rule: 'An exponent means repeated multiplication: x⁴ = x × x × x × x. It does NOT mean 4 × x.',
    demo: { v: 'chain', letter: Object.keys(t.v)[0], n: Object.values(t.v)[0], coef: t.c },
  };
}

/** 'product': x³ × x⁴, one letter, no numbers in front. */
export function fuelProduct(r: Rng, tier: Tier): FuelQ {
  return merge(r, 'product', tier, tier === 1, () => {
    const l = pick(r, LETTERS);
    if (tier === 3) return [term(1, { [l]: int(r, 1, 4) }), term(1, { [l]: int(r, 1, 3) }), term(1, { [l]: int(r, 2, 4) })];
    const lo = tier === 1 ? 2 : 1;
    return [term(1, { [l]: int(r, lo, 5) }), term(1, { [l]: int(r, lo, 4) })];
  });
}

/** 'coefpow': 3x² × 4x⁵ — numbers multiply, exponents add. */
export function fuelCoefPow(r: Rng, tier: Tier): FuelQ {
  return merge(r, 'coefpow', tier, false, () => {
    const l = pick(r, LETTERS);
    const c = () => (tier === 1 ? 1 : sign(r, 0.45)) * int(r, 2, 7);
    if (tier === 3) return [term(c(), { [l]: int(r, 1, 4) }), term(sign(r, 0.5) * int(r, 1, 3), { [l]: int(r, 2, 5) }), term(c(), { [l]: 1 })];
    return [term(c(), { [l]: int(r, 1, 5) }), term(c(), { [l]: int(r, 2, 5) })];
  });
}

/** 'multivar': several letters — each letter is done on its own. */
export function fuelMultivar(r: Rng, tier: Tier): FuelQ {
  return merge(r, 'multivar', tier, false, () => {
    const [a, b, c] = sample(r, LETTERS, 3).sort();
    if (tier === 1) return [term(int(r, 1, 5), { [a]: int(r, 1, 4) }), term(int(r, 1, 5), { [b]: int(r, 1, 4) })];
    const k = () => sign(r, tier === 2 ? 0.3 : 0.5) * (chance(r, 0.2) ? 1 : int(r, 2, 6));
    if (tier === 2) return [term(k(), { [a]: int(r, 1, 3), [b]: int(r, 1, 3) }), term(k(), { [a]: int(r, 1, 3), [b]: int(r, 1, 3) })];
    return chance(r, 0.5)
      ? [term(k(), { [a]: int(r, 1, 3), [b]: int(r, 1, 2) }), term(k(), { [b]: int(r, 1, 3), [c]: int(r, 1, 3) })]
      : [term(k(), { [a]: int(r, 1, 2) }), term(k(), { [a]: int(r, 1, 2), [b]: int(r, 1, 3) }), term(k(), { [b]: int(r, 1, 2) })];
  });
}
