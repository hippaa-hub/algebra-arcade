// Every generated question is checked here, independently of the code that made it: answers are re-worked by
// the string parser (algebra.ts) and by plugging in numbers; nothing from Adele's homework may appear.
import { describe, expect, it } from 'vitest';
import { equivalent, evaluate, isSimplified, normalise, parse } from '../math/algebra';
import { collect, familyKey, fmt, fmtExpr, mulTerms } from '../math/term';
import { checkPlates, checkScan, checkSpot, checkTerm, checkTower, checkTyped } from './check';
import { HOMEWORK_LIST, isHomework } from './homework';
import { CONCEPTS, LEVELS } from './levels';
import { GENERATORS } from './questions';
import { seeded } from './random';
import type { ConceptId, Question, Tier } from './types';

const ENVS = [
  // Every letter gets a different value, so two different terms can never look alike by chance.
  { a: 2, b: 3, c: 5, k: -2, m: 7, n: -4, p: 11, q: 13, t: 4, x: -3, y: 6, w: -5 },
  { a: -3, b: 5, c: -2, k: 7, m: -6, n: 3, p: -4, q: 2, t: -5, x: 9, y: -7, w: 4 },
  { a: 1.5, b: -2.5, c: 3.5, k: 0.5, m: 2.5, n: -1.5, p: 4.5, q: -3.5, t: 5.5, x: 0.25, y: 3.25, w: -0.75 },
];
const constRatio = (a: string, b: string) => {
  const r = ENVS.map((env) => evaluate(a, env)! / evaluate(b, env)!);
  return r.every((x) => Math.abs(x - r[0]) < 1e-9);
};
const sameValue = (a: string, b: string) => ENVS.every((env) => Math.abs(evaluate(a, env)! - evaluate(b, env)!) < 1e-9);

const RUNS = 250;
const all: [ConceptId, Tier][] = (Object.keys(GENERATORS) as ConceptId[]).flatMap((c) => ([1, 2, 3] as Tier[]).map((t) => [c, t] as [ConceptId, Tier]));

function each(concept: ConceptId, tier: Tier, fn: (q: Question) => void) {
  for (let s = 1; s <= RUNS; s++) fn(GENERATORS[concept](seeded(s * 7919 + tier), tier));
}

describe.each(all)('%s tier %s', (concept, tier) => {
  it('makes valid questions with checked answers', () => {
    each(concept, tier, (q) => {
      const where = `${q.key}`;
      expect(q.concept === concept || concept === 'boss', where).toBe(true);
      for (const txt of [q.hint, q.why, q.rule]) {
        expect(txt.length, where).toBeGreaterThan(5);
        expect(txt, where).not.toMatch(/undefined|NaN|\[object/);
      }
      switch (q.kind) {
        case 'scan': {
          expect(checkScan(q, { coef: q.term.c, letters: Object.keys(q.term.v), exps: q.term.v }).ok, where).toBe(true);
          for (const l of Object.keys(q.term.v)) expect(q.letterChoices, where).toContain(l);
          expect(q.ask.coef || q.ask.letters || q.ask.exps, where).toBe(true);
          break;
        }
        case 'sort': {
          for (const a of q.aliens) expect(q.families, where).toContain(familyKey(a.term));
          for (const f of q.families) expect(q.aliens.filter((a) => familyKey(a.term) === f).length, `${where} family ${f}`).toBeGreaterThanOrEqual(1);
          expect(new Set(q.aliens.map((a) => fmt(a.term, a.order))).size, where).toBe(q.aliens.length);
          break;
        }
        case 'spot': {
          const right = q.options.flatMap((o, i) => (familyKey(o.term) === familyKey(q.target) ? [i] : []));
          expect(right.length, where).toBeGreaterThanOrEqual(1);
          expect(right.length, where).toBeLessThan(q.options.length);
          expect(checkSpot(q, right).ok, where).toBe(true);
          // Checked again with the parser: like terms divide to a plain number.
          for (const [i, o] of q.options.entries()) {
            expect(constRatio(fmt(o.term, o.order), fmt(q.target)), `${where} option ${i}`).toBe(right.includes(i));
          }
          break;
        }
        case 'cook': {
          expect(equivalent(q.expr, fmtExpr(q.answer)), where).toBe(true);
          expect(sameValue(q.expr, fmtExpr(q.answer)), where).toBe(true);
          expect(isSimplified(fmtExpr(q.answer)), where).toBe(true);
          expect(q.answer.length, where).toBeLessThan(q.terms.length);
          expect(checkTyped(q.expr, fmtExpr(q.answer), fmtExpr(q.answer)).ok, where).toBe(true);
          const totals = Object.fromEntries(collect(q.terms.map((t) => t.term)).map((t) => [familyKey(t), t.c]));
          for (const t of q.terms) totals[familyKey(t.term)] ??= 0;
          expect(checkPlates(q, totals).ok, where).toBe(true);
          expect(isHomework(q.expr), where).toBe(false);
          if (q.mode === 'picture') expect(q.terms.every((t) => t.term.c > 0), where).toBe(true);
          break;
        }
        case 'mix':
        case 'fuel': {
          expect(parse(q.expr), where).not.toBeNull();
          expect(equivalent(q.expr, fmt(q.answer)), `${where}: ${q.expr} = ${fmt(q.answer)}`).toBe(true);
          expect(sameValue(q.expr, fmt(q.answer)), where).toBe(true);
          expect(isSimplified(fmt(q.answer)), where).toBe(true);
          expect(checkTerm(q, q.answer).ok, where).toBe(true);
          if (q.kind === 'mix' || q.mode === 'merge') expect(fmt(mulTerms(...q.factors)), where).toBe(fmt(q.answer));
          expect(isHomework(q.expr), where).toBe(false);
          break;
        }
        case 'tower': {
          if (q.format === 'expr') {
            expect(parse(q.expr!), where).not.toBeNull();
            expect(equivalent(q.expr!, q.answerExpr!), `${where}: ${q.expr} = ${q.answerExpr}`).toBe(true);
            expect(sameValue(q.expr!, q.answerExpr!), where).toBe(true);
            expect(isSimplified(q.answerExpr!), where).toBe(true);
            expect(checkTower(q, { text: q.answerExpr }).ok, where).toBe(true);
            expect(isHomework(q.expr!), where).toBe(false);
          } else if (q.format === 'number') {
            const m = q.prompt.match(/^If ([a-z]) = (\d+), what is (.+)\?$/);
            if (m) expect(evaluate(m[3], { [m[1]]: Number(m[2]) }), where).toBe(q.answerNum);
            else {
              // "What is the coefficient of …?" / "What is the exponent of b in …?"
              const t = q.prompt.match(/(?:of|in) (\S+)\?$/)![1];
              const p = parse(t)!;
              expect(p.size, where).toBe(1);
              const [[key, c]] = [...p];
              if (q.prompt.includes('coefficient')) expect(c, where).toBe(q.answerNum);
              else {
                const l = q.prompt.match(/exponent of ([a-z])/)![1];
                const e = key.split('*').find((s) => s.startsWith(l))!;
                expect(e.includes('^') ? Number(e.split('^')[1]) : 1, where).toBe(q.answerNum);
              }
            }
            expect(checkTower(q, { num: q.answerNum }).ok, where).toBe(true);
          } else if (q.format === 'pick') {
            const target = q.prompt.match(/(?:equals|like term of) (\S+)$/)![1];
            const like = q.prompt.includes('like term');
            q.options!.forEach((o, i) => {
              const good = like
                ? constRatio(o, target)
                : equivalent(o, target);
              expect(good, `${where}: option ${o}`).toBe(q.correct!.includes(i));
            });
            expect(q.correct!.length, where).toBeGreaterThanOrEqual(1);
            expect(checkTower(q, { picked: q.correct }).ok, where).toBe(true);
          } else {
            // touch: a bracket means everything is touched; otherwise only the last piece (the letter).
            const bracket = q.expr!.startsWith('(');
            expect(q.touched, where).toEqual(bracket ? q.pieces!.map((_, i) => i) : [q.pieces!.length - 1]);
            expect(checkTower(q, { picked: q.touched }).ok, where).toBe(true);
          }
          break;
        }
      }
    });
  });

  it('has plenty of different questions', () => {
    const keys = new Set<string>();
    each(concept, tier, (q) => keys.add(q.key));
    // Small families (like "what does the power touch") have fewer forms; the rest have many.
    const min = (concept === 'insideout' || concept === 'hidden' || concept === 'repeat') && tier < 3 ? 20 : 60;
    expect(keys.size).toBeGreaterThanOrEqual(min);
  });
});

describe('homework guard', () => {
  it('blocks every homework expression, both ways round', () => {
    for (const h of HOMEWORK_LIST) expect(isHomework(h), h).toBe(true);
    expect(isHomework('x³ × x⁴')).toBe(true);
    expect(isHomework('x³ × x⁵')).toBe(false);
  });
  it('keeps homework out of lessons and examples', () => {
    const text = normalise(JSON.stringify(LEVELS.map((l) => l.stages.map((s) => [s.example, s.slides.map((x) => x.text)]))));
    for (const h of HOMEWORK_LIST.filter((x) => x.includes('×') || x.includes('+'))) {
      expect(text.includes(normalise(h)), h).toBe(false);
    }
  });
});

describe('lessons', () => {
  it('teach every concept before it is tested, in order', () => {
    const seen = new Set<string>();
    for (const l of LEVELS) for (const s of l.stages) {
      expect(s.slides.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.example.steps.length, s.id).toBeGreaterThanOrEqual(2);
      for (const c of s.concepts) { expect(CONCEPTS[c].level, `${s.id} ${c}`).toBe(l.id); seen.add(c); }
    }
    expect([...seen].sort()).toEqual(Object.keys(CONCEPTS).sort());
  });
  it('worked examples have correct answers', () => {
    const checks: [string, string][] = [
      ['5k + 3n − 2k + 4n − n', '3k + 6n'], ['(−2) × 5 × (−3)', '30'], ['(−5n) × (−2w)', '10nw'], ['n × n × n × n × n', 'n⁵'],
      ['(−3w⁴) × 2w', '−6w⁵'], ['2k³t × (−4kt²)', '−8k⁴t³'], ['(−2m³)²', '4m⁶'], ['6n × 6n', '36n²'], ['3y × 4y − 5y²', '7y²'],
      ['4t² × 2t⁵', '8t⁷'], ['3m²n × 5mn⁴', '15m³n⁵'], ['(4y)²', '16y²'], ['(−5t)²', '25t²'], ['5w × 2w', '10w²'], ['7c − 2c', '5c'], ['2c − 5c', '−3c'], ['3x² + 4x²', '7x²'],
    ];
    for (const [q, a] of checks) expect(equivalent(q, a), `${q} = ${a}`).toBe(true);
    const answers = LEVELS.flatMap((l) => l.stages.map((s) => s.example.answer));
    for (const [, a] of checks.slice(0, 9)) expect(answers.some((x) => x.includes(a)), a).toBe(true);
  });
});
