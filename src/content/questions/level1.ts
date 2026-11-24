// Level 1 — Meet the Algebra Aliens: reading a term (coefficient, letters, exponents) and alien families.
import { familyKey, familyText, fmt, term, type Term } from '../../math/term';
import { chance, int, LETTERS, pick, sample, shuffle, sign } from '../random';
import type { Rng, ScanQ, SortQ, Tier } from '../types';

const reading = (t: Term, order: string[]) => {
  const bits = [`the number in front is ${t.c}${Math.abs(t.c) === 1 ? ' (the 1 is invisible)' : ''}`];
  bits.push(order.length === 1 ? `the letter is ${order[0]}` : `the letters are ${order.join(' and ')}`);
  bits.push(order.map((l) => `${l} has exponent ${t.v[l]}${t.v[l] === 1 ? ' (invisible)' : ''}`).join(', '));
  return `${fmt(t, order)}: ${bits.join('; ')}.`;
};

function choicesFor(r: Rng, letters: string[]): string[] {
  const others = sample(r, LETTERS.filter((l) => !letters.includes(l)), Math.max(2, 4 - letters.length));
  return shuffle(r, [...letters, ...others]);
}

/** 'parts': numbers you can see. */
export function scanParts(r: Rng, tier: Tier): ScanQ {
  const letters = tier === 3 ? sample(r, LETTERS, 2) : [pick(r, LETTERS)];
  const v: Record<string, number> = {};
  for (const l of letters) v[l] = tier === 3 ? int(r, 1, 4) : int(r, 2, 6);
  if (tier === 3 && letters.every((l) => v[l] === 1)) v[letters[0]] = int(r, 2, 4);
  const t = term(sign(r, tier === 1 ? 0.3 : 0.45) * int(r, 2, 12), v);
  const order = tier === 3 && chance(r, 0.3) ? [...letters].reverse() : [...letters].sort();
  const one = pick(r, ['coef', 'letters', 'exps'] as const);
  const ask = tier === 1 ? { coef: one === 'coef', letters: one === 'letters', exps: one === 'exps' } : { coef: true, letters: true, exps: true };
  return {
    kind: 'scan', concept: 'parts', tier, term: t, order, ask, letterChoices: choicesFor(r, letters),
    key: `scan:${fmt(t, order)}:${JSON.stringify(ask)}`,
    hint: ask.coef && t.c < 0 ? 'The coefficient keeps its sign: a minus in front belongs to the number.'
      : ask.exps ? 'The exponent is the small raised number next to a letter.'
        : 'The coefficient is the number in front. The variables are the letters.',
    why: reading(t, order),
    rule: 'A term has three parts: the coefficient (number in front, with its sign), the variables (letters) and the exponents (small raised numbers).',
    demo: { v: 'anatomy', term: t },
  };
}

/** 'hidden': the invisible 1s — x is 1x¹, and −x is −1x. */
export function scanHidden(r: Rng, tier: Tier): ScanQ {
  const letters = tier === 3 ? sample(r, LETTERS, 2) : [pick(r, LETTERS)];
  const v: Record<string, number> = {};
  for (const l of letters) v[l] = tier === 1 ? 1 : int(r, 1, 4);
  const c = tier === 1 ? sign(r, 0.4) : chance(r, 0.6) ? -1 : 1;
  const t = term(c, v);
  const order = tier === 3 && chance(r, 0.3) ? [...letters].reverse() : [...letters].sort();
  const one = pick(r, ['coef', 'exps'] as const);
  const ask = tier === 1 ? { coef: one === 'coef', letters: false, exps: one === 'exps' } : { coef: true, letters: true, exps: true };
  return {
    kind: 'scan', concept: 'hidden', tier, term: t, order, ask, letterChoices: choicesFor(r, letters),
    key: `scan:${fmt(t, order)}:${JSON.stringify(ask)}`,
    hint: c < 0 ? 'A minus sign on its own in front means −1.' : 'No number in front? There is an invisible 1. No exponent? It is an invisible 1 too.',
    why: reading(t, order),
    rule: 'When nothing is written, there is an invisible 1: x means 1x¹. A minus alone means −1: −x means −1x.',
    demo: { v: 'anatomy', term: t, showHidden: true },
  };
}

/** 'families': drag each alien into the ship of its family (same letters, same exponents). */
export function sortFamilies(r: Rng, tier: Tier): SortQ {
  let fams: Record<string, number>[];
  if (tier === 1) {
    const [a, b] = sample(r, LETTERS, 2);
    fams = [{ [a]: 1 }, { [b]: 1 }];
  } else if (tier === 2) {
    const [a, b] = sample(r, LETTERS, 2);
    fams = shuffle(r, [{ [a]: 1 }, { [a]: 2 }, { [b]: pick(r, [1, 2]) }]);
  } else {
    const [a, b] = sample(r, LETTERS, 2).sort();
    fams = shuffle(r, [{ [a]: 1, [b]: 1 }, { [a]: 2, [b]: 1 }, { [a]: 1, [b]: 2 }]);
  }
  const count = tier === 1 ? 6 : tier === 2 ? 7 : 8;
  const aliens: { term: Term; order: string[] }[] = [];
  const seen = new Set<string>();
  let guard = 0;
  // Every family gets at least two aliens.
  while (aliens.length < count && guard++ < 200) {
    const f = fams[aliens.length < fams.length * 2 ? aliens.length % fams.length : int(r, 0, fams.length - 1)];
    const c = chance(r, tier === 1 ? 0.2 : 0.3) ? sign(r) : sign(r, 0.35) * int(r, 2, 9);
    const t = term(c, f);
    const letters = Object.keys(f).sort();
    const order = letters.length > 1 && chance(r, 0.45) ? [...letters].reverse() : letters;
    const id = fmt(t, order);
    if (seen.has(id)) continue;
    seen.add(id);
    aliens.push({ term: t, order });
  }
  const families = fams.map((f) => familyKey(term(1, f)));
  return {
    kind: 'sort', concept: 'families', tier, families, aliens: shuffle(r, aliens),
    key: `sort:${aliens.map((a) => fmt(a.term, a.order)).sort().join(',')}`,
    hint: tier === 1 ? 'Look only at the letter. Ignore the number in front.'
      : tier === 2 ? 'Look at the letter AND its exponent: x and x² are different families.'
        : 'ab and ba are the same family: the order of letters does not matter. Check each exponent.',
    why: `Each alien goes with the ship that has exactly the same letters and exponents (${families.map(familyText).join(', ')}). The number in front never decides the family.`,
    rule: 'Same family = the same letters with the same exponents. The coefficient can be anything. The order of letters does not matter.',
    demo: { v: 'family', terms: aliens.map((a) => a.term), orders: aliens.map((a) => a.order) },
  };
}
