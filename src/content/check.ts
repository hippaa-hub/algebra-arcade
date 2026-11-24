// Checking answers and saying, kindly and specifically, what went wrong.
import { equivalent, isSimplified, multiplySlip, parse } from '../math/algebra';
import { familyKey, familyText, fmt, letterPart, type Term } from '../math/term';
import type { CookQ, FuelQ, MixQ, ScanQ, SpotQ, TowerQ } from './types';

export interface Verdict {
  ok: boolean;
  /** Right value but not finished (for typed answers): not counted as a mistake. */
  unfinished?: boolean;
  /** A short, specific nudge. */
  msg?: string;
}

export interface ScanInput { coef: number | null; letters: string[]; exps: Record<string, number> }

export function checkScan(q: ScanQ, a: ScanInput): Verdict {
  const want = Object.keys(q.term.v).sort();
  if (q.ask.coef && a.coef !== q.term.c) {
    if (a.coef === -q.term.c) return { ok: false, msg: 'Almost! Check the sign: a minus in front belongs to the coefficient.' };
    if (Math.abs(q.term.c) === 1) return { ok: false, msg: q.term.c === 1 ? 'No number written means an invisible 1.' : 'A minus sign alone means −1.' };
    return { ok: false, msg: 'The coefficient is the number written in front of the letters.' };
  }
  if (q.ask.letters) {
    const got = [...a.letters].sort();
    if (got.join() !== want.join()) return { ok: false, msg: got.length < want.length ? 'You missed a letter. Every letter in the term is a variable.' : 'Pick only the letters you can see on the alien.' };
  }
  if (q.ask.exps) {
    for (const l of want) {
      if (a.exps[l] !== q.term.v[l]) {
        return { ok: false, msg: q.term.v[l] === 1 ? `${l} has no small number, so its exponent is an invisible 1.` : `Look at the small raised number next to ${l}.` };
      }
    }
  }
  return { ok: true };
}

export function checkSpot(q: SpotQ, picked: number[]): Verdict {
  const tk = familyKey(q.target);
  const right = q.options.flatMap((o, i) => (familyKey(o.term) === tk ? [i] : []));
  const wrongPick = picked.find((i) => !right.includes(i));
  if (wrongPick !== undefined) {
    const o = q.options[wrongPick].term;
    const sameLetters = Object.keys(o.v).sort().join() === Object.keys(q.target.v).sort().join();
    return { ok: false, msg: sameLetters ? `Almost! Look at the exponents: ${fmt(o, q.options[wrongPick].order)} has ${familyText(familyKey(o))}, not ${familyText(tk)}.` : `${fmt(o, q.options[wrongPick].order)} has different letters, so it is a different ingredient.` };
  }
  const missed = right.find((i) => !picked.includes(i));
  if (missed !== undefined) {
    const o = q.options[missed];
    const reordered = o.order.join('') !== Object.keys(o.term.v).sort().join('');
    return { ok: false, msg: reordered ? `You missed one! ${letterPart(o.term.v, o.order)} is the same as ${letterPart(o.term.v)} — the order does not matter.` : 'There is another match. The number in front can be anything, even negative.' };
  }
  return { ok: true };
}

/** One plate in the restaurant: which ingredient (family) and the total she set. */
export function checkPlates(q: CookQ, totals: Record<string, number>): Verdict & { wrongPlate?: string } {
  for (const t of q.terms) {
    const k = familyKey(t.term);
    const want = q.terms.filter((x) => familyKey(x.term) === k).reduce((s, x) => s + x.term.c, 0);
    if (totals[k] !== want) {
      const parts = q.terms.filter((x) => familyKey(x.term) === k).map((x) => x.term.c);
      return {
        ok: false, wrongPlate: k,
        msg: `Check the ${familyText(k)} plate: ${parts.map((c, i) => (i === 0 ? String(c) : c < 0 ? `− ${-c}` : `+ ${c}`)).join(' ')}`.replace(/-/g, '−') + '.',
      };
    }
  }
  return { ok: true };
}

/** A typed expression compared with the right answer. */
export function checkTyped(question: string, answer: string, typed: string, concept?: string): Verdict {
  if (!typed.trim()) return { ok: false, unfinished: true, msg: 'Type your answer first.' };
  const p = parse(typed);
  if (!p) return { ok: false, unfinished: true, msg: 'I can’t read that yet. Check the brackets and signs.' };
  if (equivalent(typed, answer)) {
    if (isSimplified(typed)) return { ok: true };
    return { ok: false, unfinished: true, msg: 'That is equal, but not finished. Simplify it all the way: no ×, no brackets, like terms collected.' };
  }
  const slip = multiplySlip(question, answer, typed);
  if (slip) return { ok: false, msg: slip };
  const want = parse(answer)!;
  if (p.size < want.size) return { ok: false, msg: 'Careful: some of those were unlike terms. Different letters or exponents cannot be joined.' };
  if (p.size > want.size) return { ok: false, msg: 'Some like terms can still be joined together.' };
  // Same families but wrong numbers.
  const sameFamilies = [...want.keys()].every((k) => p.has(k));
  if (sameFamilies) {
    const sign = [...want].some(([k, c]) => p.get(k) === -c);
    return { ok: false, msg: sign ? 'Almost! Check the signs. A minus belongs to the term after it.' : 'The letters are right. Check the numbers again.' };
  }
  if (concept === 'collect') return { ok: false, msg: 'When you add like terms, the letters and exponents stay the same — only the numbers change.' };
  return { ok: false, msg: 'Not quite. Check the letters and their exponents, one letter at a time.' };
}

/** A term built in the Lab or the Rocket. */
export function checkTerm(q: MixQ | FuelQ, built: Term): Verdict {
  const want = q.answer;
  const exps = Object.keys(want.v).sort().join() === Object.keys(built.v).sort().join() && Object.keys(want.v).every((l) => want.v[l] === built.v[l]);
  if (built.c === want.c && exps) return { ok: true };
  if (q.kind === 'fuel' && q.mode !== 'merge') {
    if (built.c !== want.c) return { ok: false, msg: want.c === 1 ? 'There is no number in front this time.' : 'Check the number in front.' };
    return { ok: false, msg: 'Count the letters one more time.' };
  }
  if (built.c === -want.c && exps) return { ok: false, msg: 'Almost! Check the sign. Count the minus signs: even → +, odd → −.' };
  const slip = multiplySlip(q.expr, fmt(want), fmt(built));
  if (slip) return { ok: false, msg: slip };
  if (built.c !== want.c) return { ok: false, msg: exps ? 'The letters are right! Now check the number.' : 'Check the numbers first, then the letters.' };
  return { ok: false, msg: 'The number is right! Now look at the letters and their exponents.' };
}

export function checkTower(q: TowerQ, input: { text?: string; num?: number | null; picked?: number[] }): Verdict {
  if (q.format === 'expr') return checkTyped(q.expr!, q.answerExpr!, input.text ?? '', q.from ?? q.concept);
  if (q.format === 'number') {
    if (input.num === null || input.num === undefined || Number.isNaN(input.num)) return { ok: false, unfinished: true, msg: 'Type a number first.' };
    if (input.num === q.answerNum) return { ok: true };
    if (input.num === -q.answerNum!) return { ok: false, msg: 'Almost! Check the sign.' };
    return { ok: false, msg: q.concept === 'insideout' ? 'Do the power first — but only on what it touches.' : 'Not quite. Look again carefully.' };
  }
  const want = q.format === 'touch' ? q.touched! : q.correct!;
  const picked = input.picked ?? [];
  if (picked.length === 0) return { ok: false, unfinished: true, msg: 'Tap your choices first.' };
  const same = picked.length === want.length && want.every((i) => picked.includes(i));
  if (same) return { ok: true };
  if (q.format === 'touch') return { ok: false, msg: picked.length > want.length ? 'Too many! Without a bracket the power only touches the letter next to it.' : 'With a bracket, the power touches everything inside it.' };
  return { ok: false, msg: picked.some((i) => !want.includes(i)) ? 'One of those is not equal. Is the number squared too?' : 'There is another one that is equal.' };
}
