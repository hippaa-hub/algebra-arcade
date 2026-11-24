// Level 2 — The Like-Terms Kingdom: spotting like terms, then collecting them in the Algebra Restaurant.
import { collect, familyKey, familyText, fmt, fmtExpr, term, type Term } from '../../math/term';
import { isHomework } from '../homework';
import { chance, int, LETTERS, pick, sample, shuffle, sign } from '../random';
import type { CookQ, Rng, SpotQ, Tier } from '../types';

/** Letters that have a food picture in the restaurant (see ui/games/food.ts). */
export const FOOD_LETTERS = ['a', 'b', 'c', 'm', 'p', 't'] as const;

type Opt = { term: Term; order: string[] };
const opt = (c: number, v: Record<string, number>, reverse = false): Opt => {
  const t = term(c, v);
  const letters = Object.keys(t.v).sort();
  return { term: t, order: reverse ? [...letters].reverse() : letters };
};
const coefOf = (r: Rng, pNeg = 0.3) => (chance(r, 0.2) ? sign(r, pNeg) : sign(r, pNeg) * int(r, 2, 9));

export function spotLike(r: Rng, tier: Tier): SpotQ {
  let target: Opt;
  let likes: Opt[];
  let unlikes: Opt[];
  if (tier === 1) {
    const [a, b, c] = sample(r, LETTERS, 3);
    target = opt(int(r, 2, 9), { [a]: 1 });
    likes = Array.from({ length: int(r, 1, 2) }, () => opt(coefOf(r), { [a]: 1 }));
    unlikes = [opt(coefOf(r), { [b]: 1 }), opt(coefOf(r), { [c]: 1 }), opt(int(r, 2, 9), {}), opt(coefOf(r), { [a]: 1, [b]: 1 })];
  } else if (tier === 2) {
    const [a, b] = sample(r, LETTERS, 2);
    const e = int(r, 2, 3);
    target = opt(sign(r, 0.3) * int(r, 2, 9), { [a]: e });
    likes = Array.from({ length: int(r, 1, 3) }, () => opt(coefOf(r, 0.4), { [a]: e }));
    unlikes = [opt(coefOf(r), { [a]: 1 }), opt(coefOf(r), { [a]: e + 1 }), opt(coefOf(r), { [b]: e }), opt(int(r, 2, 9) * e, {})];
  } else {
    const [a, b] = sample(r, LETTERS, 2).sort();
    const ea = int(r, 1, 2);
    const eb = ea === 1 ? 2 : pick(r, [1, 2]);
    target = opt(sign(r, 0.3) * int(r, 2, 9), { [a]: ea, [b]: eb });
    likes = [opt(coefOf(r, 0.4), { [a]: ea, [b]: eb }, true), ...Array.from({ length: int(r, 0, 1) }, () => opt(coefOf(r, 0.4), { [a]: ea, [b]: eb }, chance(r, 0.5)))];
    unlikes = [opt(coefOf(r), { [a]: eb, [b]: ea }), opt(coefOf(r), { [a]: ea }), opt(coefOf(r), { [a]: ea, [b]: eb + 1 }), opt(coefOf(r), { [a]: 1, [b]: 1 })]
      .filter((o) => familyKey(o.term) !== familyKey(target.term));
  }
  // No two options that look the same.
  const seen = new Set<string>([fmt(target.term, target.order)]);
  const uniq = (xs: Opt[]) => xs.filter((o) => { const k = fmt(o.term, o.order); if (seen.has(k)) return false; seen.add(k); return true; });
  likes = uniq(likes);
  if (likes.length === 0) likes = [opt(target.term.c === 1 ? 3 : -target.term.c, target.term.v, tier === 3)];
  unlikes = uniq(unlikes);
  const options = shuffle(r, [...likes, ...sample(r, unlikes, Math.min(unlikes.length, 5 - likes.length))]);
  const tf = familyText(familyKey(target.term));
  return {
    kind: 'spot', concept: 'like', tier, target: target.term, targetOrder: target.order, options,
    key: `spot:${fmt(target.term)}:${options.map((o) => fmt(o.term, o.order)).sort().join(',')}`,
    hint: tier === 1 ? 'Look at the letters only.' : tier === 2 ? 'Almost! Look at the exponents.' : 'The order of letters does not matter, but every exponent must match.',
    why: `Like terms of ${fmt(target.term, target.order)} have the letter part ${tf}. The numbers in front can be anything.`,
    rule: 'Like terms have the same letters with the same exponents. Only the coefficients can be different. ab and ba are like terms.',
    demo: { v: 'compare', a: target.term, b: (unlikes[0] ?? likes[0]).term, orderA: target.order, orderB: (unlikes[0] ?? likes[0]).order },
  };
}

function cookFamilies(r: Rng, tier: Tier): Record<string, number>[] {
  if (tier === 1) {
    const [a, b] = sample(r, FOOD_LETTERS, 2);
    return [{ [a]: 1 }, { [b]: 1 }];
  }
  if (tier === 2) {
    const [a, b] = sample(r, LETTERS, 2);
    return shuffle(r, chance(r, 0.5) ? [{ [a]: 1 }, { [b]: 1 }] : [{ [a]: 2 }, { [a]: 1 }]);
  }
  const [a, b] = sample(r, LETTERS, 2).sort();
  return shuffle(r, pick(r, [
    [{ [a]: 2 }, { [a]: 1 }, {}],
    [{ [a]: 1, [b]: 1 }, { [a]: 1 }],
    [{ [a]: 2 }, { [b]: 1 }, { [a]: 1 }],
    [{ [a]: 1, [b]: 2 }, { [a]: 2, [b]: 1 }],
  ]));
}

export function cookOrder(r: Rng, tier: Tier): CookQ {
  for (let tries = 0; ; tries++) {
    const fams = cookFamilies(r, tier);
    const n = tier === 1 ? int(r, 3, 4) : tier === 2 ? int(r, 4, 5) : int(r, 4, 6);
    const terms: Opt[] = [];
    for (let i = 0; i < n; i++) {
      const f = fams[i < fams.length ? i : int(r, 0, fams.length - 1)];
      const c = tier === 1 ? int(r, 1, 5) : (chance(r, 0.15) ? 1 : int(r, 2, 9)) * sign(r, i === 0 ? 0.2 : 0.4);
      terms.push(opt(c, f, Object.keys(f).length > 1 && chance(r, 0.4)));
    }
    const ordered = shuffle(r, terms);
    if (ordered[0].term.c < 0 && tier < 3) ordered[0] = { ...ordered[0], term: term(-ordered[0].term.c, ordered[0].term.v) };
    const answer = collect(ordered.map((o) => o.term));
    const expr = fmtExpr(ordered.map((o) => o.term), ordered.map((o) => o.order));
    // Something must combine, the answer must not vanish, and nothing from the homework.
    const combines = answer.length < ordered.length;
    const tooBig = ordered.some((o) => Math.abs(o.term.c) > 9) || answer.some((t) => Math.abs(t.c) > 20);
    if (!combines || answer.length === 0 || tooBig || isHomework(expr) || (tier === 1 && answer.some((t) => t.c < 0))) {
      if (tries < 200) continue;
    }
    const mode = tier === 1 ? 'picture' : tier === 2 ? 'plates' : 'type';
    return {
      kind: 'cook', concept: 'collect', tier, terms: ordered, mode, answer, expr,
      key: `cook:${mode}:${expr}`,
      hint: tier === 1 ? 'Put the same food on the same plate, then count it.' : 'Group the like terms first. Then add their coefficients — the sign in front of a term belongs to it.',
      why: `${expr} = ${fmtExpr(answer)}. Like terms were added up; different ones stayed apart.`,
      rule: 'Collect like terms: add their coefficients and keep the letter part the same. Unlike terms stay separate — 3a + 2b cannot be one term.',
      demo: { v: 'collect', terms: ordered.map((o) => o.term) },
    };
  }
}
