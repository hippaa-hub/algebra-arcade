// Level 3 — The Multiplication Lab: signs, then numbers × letters, then different letters.
import { fmt, fmtFactor, mulTerms, term, type Term } from '../../math/term';
import { isHomework } from '../homework';
import { chance, int, LETTERS, pick, sample, sign } from '../random';
import type { MixQ, Rng, Tier } from '../types';

const minusCount = (fs: Term[]) => fs.filter((f) => f.c < 0).length;

function signWhy(fs: Term[]): string {
  const m = minusCount(fs);
  if (m === 0) return 'No minus signs, so the answer is positive.';
  if (m === 1) return 'One minus sign, so the answer is negative.';
  return `${m} minus signs. ${m % 2 === 0 ? 'An even number of minuses gives +' : 'An odd number of minuses gives −'}.`;
}

function build(_r: Rng, concept: MixQ['concept'], tier: Tier, make: () => Term[]): MixQ {
  for (let tries = 0; ; tries++) {
    const factors = make();
    const expr = factors.map((f) => fmtFactor(f)).join(' × ');
    if (isHomework(expr) && tries < 100) continue;
    const answer = mulTerms(...factors);
    const nums = factors.map((f) => (f.c < 0 ? `(${f.c})` : String(f.c))).join(' × ').replace(/-/g, '−');
    const hasLetters = Object.keys(answer.v).length > 0;
    return {
      kind: 'mix', concept, tier, factors, answer, expr,
      key: `mix:${expr}`,
      hint: concept === 'signs' ? 'Count the minus signs first. Even → +, odd → −.'
        : concept === 'coef' ? 'Multiply the numbers. The letter just comes along.'
          : 'Numbers first, then write all the letters together in alphabetical order.',
      why: `${signWhy(factors)} Numbers: ${nums} = ${answer.c}.${!hasLetters ? '' : Object.keys(answer.v).length === 1 ? ` The letter ${Object.keys(answer.v)[0]} comes along.` : ` Letters: ${Object.keys(answer.v).join(' × ')} = ${Object.keys(answer.v).join('')}.`} So ${expr} = ${fmt(answer)}.`,
      rule: concept === 'signs'
        ? '+ × + = +   − × − = +   + × − = −   − × + = −. Two minuses cancel each other out.'
        : 'Multiply the numbers (watch the signs), then write the letters next to each other: 2a × 3b = 6ab.',
      demo: concept === 'signs' && factors.length === 2 ? { v: 'signline', a: factors[0].c, b: factors[1].c } : { v: 'expand', factors },
    };
  }
}

/** Numbers only: the four sign rules, then three factors. */
export function mixSigns(r: Rng, tier: Tier): MixQ {
  return build(r, 'signs', tier, () => {
    if (tier === 1) return [term(sign(r) * int(r, 2, 9)), term(sign(r) * int(r, 2, 9))];
    if (tier === 2) {
      // Mostly both negative or one (−1), the cases that trip people up.
      const a = chance(r, 0.3) ? -1 : -int(r, 2, 9);
      return [term(a), term(sign(r, 0.7) * int(r, 2, 12))];
    }
    return [term(sign(r) * int(r, 2, 5)), term(sign(r) * int(r, 1, 4)), term(sign(r, 0.6) * int(r, 2, 5))];
  });
}

/** A number times a term with one letter: 3 × (−2a), (−4x) × (−5). */
export function mixCoef(r: Rng, tier: Tier): MixQ {
  return build(r, 'coef', tier, () => {
    const l = pick(r, LETTERS);
    const n = term((tier === 1 ? 1 : sign(r, 0.5)) * int(r, 2, 9));
    const t = term((tier === 1 ? 1 : sign(r, 0.5)) * int(r, 2, 9), { [l]: 1 });
    if (tier === 3) return [term(sign(r) * int(r, 2, 4)), term(sign(r) * int(r, 2, 5), { [l]: 1 }), term(sign(r, 0.6) * int(r, 1, 3))];
    return chance(r, 0.5) ? [n, t] : [t, n];
  });
}

/** Different letters: 2a × 3b = 6ab, (−x) × 4y = −4xy, and three factors. */
export function mixLetters(r: Rng, tier: Tier): MixQ {
  return build(r, 'letters', tier, () => {
    const ls = sample(r, LETTERS, 3);
    const c = () => (chance(r, 0.2) ? 1 : int(r, 2, 7)) * (tier === 1 ? 1 : sign(r, 0.45));
    if (tier === 3) return [term(c(), { [ls[0]]: 1 }), term(c(), { [ls[1]]: 1 }), term(c(), { [ls[2]]: 1 })];
    return [term(c(), { [ls[0]]: 1 }), term(c(), { [ls[1]]: 1 })];
  });
}
