// A single algebraic term, such as −3x²y: a coefficient (the number) and its letters with their exponents.
// The games build and compare terms with these helpers; the independent string parser in algebra.ts is used by
// the tests to double-check every answer.

export interface Term {
  /** The coefficient: the number in front. */
  c: number;
  /** Each letter and its exponent, for example { x: 2, y: 1 }. */
  v: Record<string, number>;
}

const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

export const sup = (n: number): string => String(n).split('').map((d) => SUP[d] ?? d).join('');

export function term(c: number, v: Record<string, number> = {}): Term {
  const clean: Record<string, number> = {};
  for (const k of Object.keys(v).sort()) if (v[k] !== 0) clean[k] = v[k];
  return { c, v: clean };
}

/** The letter part of a term, as a key: "x^2*y". Two terms are like terms when their keys are equal. "" = a plain number. */
export function familyKey(t: Term): string {
  return Object.keys(t.v).sort().map((k) => (t.v[k] === 1 ? k : `${k}^${t.v[k]}`)).join('*');
}

/** The letter part written nicely: "x²y". */
export function letterPart(t: Term | Record<string, number>, order?: string[]): string {
  const v = 'v' in t && typeof (t as Term).c === 'number' ? (t as Term).v : (t as Record<string, number>);
  const keys = order ?? Object.keys(v).sort();
  return keys.map((k) => (v[k] === 1 ? k : `${k}${sup(v[k])}`)).join('');
}

export function familyText(key: string): string {
  if (!key) return 'number';
  return key.split('*').map((p) => { const [l, e] = p.split('^'); return e ? l + sup(Number(e)) : l; }).join('');
}

/** A term written as in a textbook: 1 and −1 are not written in front of letters. `order` keeps letters as given (ba). */
export function fmt(t: Term, order?: string[]): string {
  const letters = letterPart(t.v, order);
  const abs = Math.abs(t.c);
  const num = letters && abs === 1 ? '' : String(abs);
  return `${t.c < 0 ? '−' : ''}${num}${letters}`;
}

/** A term in brackets when it is negative, for writing products: (−3x). */
export function fmtFactor(t: Term, order?: string[]): string {
  const s = fmt(t, order);
  return t.c < 0 ? `(${s})` : s;
}

/** A list of terms written as one expression: 3x − 2y + x². */
export function fmtExpr(terms: Term[], orders?: (string[] | undefined)[]): string {
  if (terms.length === 0) return '0';
  return terms.map((t, i) => {
    const s = fmt({ c: Math.abs(t.c), v: t.v }, orders?.[i]);
    if (i === 0) return t.c < 0 ? `−${s}` : s;
    return t.c < 0 ? ` − ${s}` : ` + ${s}`;
  }).join('');
}

export const sameTerm = (a: Term, b: Term) => a.c === b.c && familyKey(a) === familyKey(b);

export function mulTerms(...ts: Term[]): Term {
  let c = 1;
  const v: Record<string, number> = {};
  for (const t of ts) {
    c *= t.c;
    for (const [k, e] of Object.entries(t.v)) v[k] = (v[k] ?? 0) + e;
  }
  return term(c, v);
}

export function powTerm(t: Term, n: number): Term {
  return mulTerms(...Array.from({ length: n }, () => t));
}

/** Collects like terms, keeping families in the order they first appear. Zero totals are dropped. */
export function collect(ts: Term[]): Term[] {
  const order: string[] = [];
  const sums = new Map<string, Term>();
  for (const t of ts) {
    const k = familyKey(t);
    if (!sums.has(k)) { order.push(k); sums.set(k, term(0, t.v)); }
    sums.get(k)!.c += t.c;
  }
  return order.map((k) => sums.get(k)!).filter((t) => t.c !== 0);
}

/** Same terms in any order. */
export function sameTerms(a: Term[], b: Term[]): boolean {
  if (a.length !== b.length) return false;
  const key = (t: Term) => `${t.c}|${familyKey(t)}`;
  const sa = a.map(key).sort();
  const sb = b.map(key).sort();
  return sa.every((s, i) => s === sb[i]);
}

/** Total of the exponents: x²y³ → 5. */
export const degree = (t: Term) => Object.values(t.v).reduce((s, e) => s + e, 0);
