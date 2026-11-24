// Level 5 — The Power Tower: powers of brackets, what a power touches, areas, and the final boss,
// which mixes every skill from the five levels.
import { collect, fmt, fmtExpr, fmtFactor, letterPart, mulTerms, powTerm, sup, term, type Term } from '../../math/term';
import { isHomework } from '../homework';
import { chance, int, LETTERS, pick, sample, shuffle, sign } from '../random';
import type { ConceptId, Rng, Tier, TowerQ } from '../types';

const lettersOf = (...ts: Term[]) => [...new Set(ts.flatMap((t) => Object.keys(t.v)))].sort();
const sq = (n: number) => sup(n);

function towerExpr(concept: ConceptId, tier: Tier, prompt: string, expr: string, answer: Term[], extra: Partial<TowerQ>, text: { hint: string; why: string; rule: string; demo: TowerQ['demo'] }): TowerQ {
  return {
    kind: 'tower', concept, tier, format: 'expr', prompt, expr, answerExpr: fmtExpr(answer), letters: lettersOf(...answer),
    key: `tower:${concept}:${expr}`, ...text, ...extra,
  };
}

/** 'bracket': (3x)², (−2a³)², (2y)³. */
export function towerBracket(r: Rng, tier: Tier): TowerQ {
  for (let tries = 0; ; tries++) {
    const l = pick(r, LETTERS);
    let inner: Term;
    let n = 2;
    if (tier === 1) inner = term(int(r, 2, 9), { [l]: 1 });
    else if (tier === 2) inner = chance(r, 0.5) ? term(-int(r, 2, 9), { [l]: 1 }) : term(int(r, 2, 6), { [l]: int(r, 2, 4) });
    else if (chance(r, 0.5)) { inner = term(sign(r) * int(r, 2, 4), { [l]: int(r, 1, 2) }); n = 3; }
    else { const [a, b] = sample(r, LETTERS, 2).sort(); inner = term(sign(r) * int(r, 1, 5), { [a]: int(r, 1, 3), [b]: int(r, 1, 2) }); }
    const expr = `(${fmt(inner)})${sq(n)}`;
    if (isHomework(expr) && tries < 100) continue;
    const ans = powTerm(inner, n);
    const copies = Array(n).fill(fmtFactor(inner)).join(' × ');
    return towerExpr('bracket', tier, `Power up: ${expr}`, expr, [ans], {}, {
      hint: `The power ${n} means ${n} copies of the whole bracket: ${copies}.`,
      why: `${expr} = ${copies} = ${fmt(ans)}. The number is powered (${inner.c < 0 ? `(${inner.c})` : inner.c}${sq(n)} = ${ans.c}) and the exponents are added.`.replace(/-/g, '−'),
      rule: 'A power outside a bracket applies to EVERYTHING inside: (3x)² = 3x × 3x = 9x². Square the number and the letters.',
      demo: { v: 'copies', inner, n },
    });
  }
}

/** 'insideout': what does the power touch? 3x² vs (3x)², −x² vs (−x)². */
export function towerInsideOut(r: Rng, tier: Tier): TowerQ {
  const l = pick(r, LETTERS.filter((x) => x !== 'x'));
  const rule = 'A power touches only what it is attached to. In 3x² only x is squared. In (3x)² the bracket makes the 3 squared too. −x² = −(x²), but (−x)² is positive.';
  if (tier === 1) {
    const k = int(r, 2, 7);
    const forms = [
      { show: `${k}${l}²`, pieces: [String(k), l], touched: [1], brackets: false },
      { show: `(${k}${l})²`, pieces: [String(k), l], touched: [0, 1], brackets: true },
      { show: `−${l}²`, pieces: ['−', l], touched: [1], brackets: false },
      { show: `(−${l})²`, pieces: ['−', l], touched: [0, 1], brackets: true },
      { show: `(−${k}${l})²`, pieces: ['−', String(k), l], touched: [0, 1, 2], brackets: true },
      { show: `−${k}${l}²`, pieces: ['−', String(k), l], touched: [2], brackets: false },
    ];
    const f = pick(r, forms);
    return {
      kind: 'tower', concept: 'insideout', tier, format: 'touch', prompt: `Tap everything the power touches in ${f.show}`,
      pieces: f.pieces, touched: f.touched, power: '²', expr: f.show, letters: [],
      key: `tower:touch:${f.show}`,
      hint: f.brackets ? 'A bracket shares the power with everything inside it.' : 'Without a bracket the power only touches the letter right next to it.',
      why: f.brackets ? `In ${f.show} the bracket means the power touches everything inside: ${f.pieces.join(', ')}.` : `In ${f.show} there is no bracket, so the power touches only ${l}.`,
      rule, demo: { v: 'touch', text: f.show, squared: f.touched.map((i) => f.pieces[i]) },
    };
  }
  if (tier === 2) {
    const x = int(r, 2, 5);
    const k = int(r, 2, 4);
    const forms: [string, number][] = [
      [`−${l}²`, -(x * x)], [`(−${l})²`, x * x], [`${k}${l}²`, k * x * x], [`(${k}${l})²`, k * k * x * x], [`−${k}${l}²`, -k * x * x], [`(−${k}${l})²`, k * k * x * x],
    ];
    const [show, val] = pick(r, forms);
    return {
      kind: 'tower', concept: 'insideout', tier, format: 'number', prompt: `If ${l} = ${x}, what is ${show}?`, answerNum: val, expr: show, letters: [],
      key: `tower:value:${show}:${x}`,
      hint: 'Do the power first, but only on what it touches. Then the rest.',
      why: `${show} with ${l} = ${x}: ${show.startsWith('(') ? `the whole bracket is squared` : `only ${l} is squared, ${x}² = ${x * x}`}, so the answer is ${val}.`.replace(/-/g, '−'),
      rule, demo: { v: 'touch', text: show, squared: show.startsWith('(') ? ['everything inside'] : [l] },
    };
  }
  if (chance(r, 0.5)) {
    // Which of these equal k²x²?
    const k = int(r, 2, 6);
    const target = `${k * k}${l}²`;
    const opts = [
      { s: `(${k}${l})²`, ok: true }, { s: `(−${k}${l})²`, ok: true }, { s: `${k}${l} × ${k}${l}`, ok: true },
      { s: `${k}${l}²`, ok: false }, { s: `−${k}${l}²`, ok: false }, { s: `${2 * k}${l}`, ok: false }, { s: `(${k * k}${l})²`, ok: false },
    ];
    const chosen = shuffle(r, [...sample(r, opts.filter((o) => o.ok), int(r, 1, 3)), ...sample(r, opts.filter((o) => !o.ok), 3)]);
    return {
      kind: 'tower', concept: 'insideout', tier, format: 'pick', prompt: `Tap every one that equals ${target}`,
      options: chosen.map((o) => o.s), correct: chosen.flatMap((o, i) => (o.ok ? [i] : [])), letters: [],
      key: `tower:pick:${target}:${chosen.map((o) => o.s).sort().join(',')}`,
      hint: 'Work each one out. Is the number squared too, or only the letter?',
      why: `${target} needs the ${k} squared as well as ${l}: that happens with a bracket, (${k}${l})² = ${k}${l} × ${k}${l}. A minus inside the bracket is squared away.`,
      rule, demo: { v: 'copies', inner: term(k, { [l]: 1 }), n: 2 },
    };
  }
  const inner = term(sign(r) * int(r, 2, 5), { [l]: int(r, 1, 2) });
  const expr = `−(${fmt(inner)})²`;
  const ans = mulTerms(term(-1), powTerm(inner, 2));
  return towerExpr('insideout', tier, `Simplify ${expr}`, expr, [ans], {}, {
    hint: 'The minus outside the bracket is not squared. Square the bracket first.',
    why: `(${fmt(inner)})² = ${fmt(powTerm(inner, 2))}, then the minus in front makes it ${fmt(ans)}.`,
    rule, demo: { v: 'copies', inner, n: 2 },
  });
}

/** 'area': rectangles with algebraic sides (and L-shapes made of two rectangles). */
export function towerArea(r: Rng, tier: Tier): TowerQ {
  const l = pick(r, ['x', 'y', 'a', 'm', 'w']);
  const rule = 'Area of a rectangle = length × width. Multiply the numbers and multiply the letters: 3x × 2x = 6x².';
  if (tier === 1) {
    const w = term(int(r, 2, 9), { [l]: 1 });
    const h = chance(r, 0.5) ? term(int(r, 2, 9)) : term(1, { [l]: 1 });
    const ans = mulTerms(w, h);
    const expr = `${fmtFactor(w)} × ${fmtFactor(h)}`;
    return towerExpr('area', tier, `A garden is ${fmt(w)} m long and ${fmt(h)} m wide. What is its area?`, expr, [ans], { rect: { w, h } }, {
      hint: 'Area = length × width.', why: `Area = ${expr} = ${fmt(ans)} m².`, rule, demo: { v: 'area', w, h },
    });
  }
  if (tier === 2) {
    if (chance(r, 0.35)) {
      const s = term(int(r, 2, 9), { [l]: 1 });
      const ans = powTerm(s, 2);
      return towerExpr('area', tier, `A square tile has side ${fmt(s)} cm. What is its area?`, `(${fmt(s)})²`, [ans], { rect: { w: s, h: s } }, {
        hint: 'A square: side × side, so the side is squared — number and letter.', why: `Area = (${fmt(s)})² = ${fmt(s)} × ${fmt(s)} = ${fmt(ans)} cm².`, rule, demo: { v: 'area', w: s, h: s },
      });
    }
    const w = term(int(r, 2, 8), { [l]: int(r, 1, 2) });
    const h = term(int(r, 2, 8), { [l]: 1 });
    const ans = mulTerms(w, h);
    const expr = `${fmt(w)} × ${fmt(h)}`;
    if (isHomework(expr)) return towerArea(r, tier);
    return towerExpr('area', tier, `A poster is ${fmt(w)} cm by ${fmt(h)} cm. What is its area?`, expr, [ans], { rect: { w, h } }, {
      hint: 'Multiply the numbers, then add the exponents of the letter.', why: `Area = ${expr} = ${fmt(ans)} cm².`, rule, demo: { v: 'area', w, h },
    });
  }
  // Two rooms side by side: two areas, then collect the like terms.
  const w1 = term(int(r, 2, 6), { [l]: 1 });
  const h1 = term(int(r, 2, 5), { [l]: 1 });
  const w2 = term(int(r, 1, 4), { [l]: 1 });
  const h2 = term(int(r, 2, 5), { [l]: 1 });
  const a1 = mulTerms(w1, h1);
  const a2 = mulTerms(w2, h2);
  const ans = collect([a1, a2]);
  const expr = `${fmt(w1)} × ${fmt(h1)} + ${fmt(w2)} × ${fmt(h2)}`;
  return towerExpr('area', tier, `A flat has two rooms: ${fmt(w1)} by ${fmt(h1)}, and ${fmt(w2)} by ${fmt(h2)}. What is the total floor area?`, expr, ans, { rect: { w: w1, h: h1, second: { w: w2, h: h2 } } }, {
    hint: 'Find each room’s area, then add them — they are like terms.',
    why: `Room 1: ${fmt(a1)}. Room 2: ${fmt(a2)}. Together ${fmt(a1)} + ${fmt(a2)} = ${fmtExpr(ans)}.`, rule, demo: { v: 'area', w: w1, h: h1 },
  });
}

// ---- The final boss: every skill --------------------------------------------

const BOSS_SKILLS: ConceptId[] = ['parts', 'hidden', 'like', 'collect', 'signs', 'letters', 'product', 'coefpow', 'multivar', 'bracket', 'insideout', 'area'];

export function towerBoss(r: Rng, tier: Tier): TowerQ {
  // Tier 3 is mostly multi-step questions; tiers 1–2 check one earlier skill at a time.
  if (tier === 3 && chance(r, 0.65)) return bossMultiStep(r);
  const from = pick(r, BOSS_SKILLS);
  const q = bossFrom(r, from, tier === 1 ? 2 : 3);
  return { ...q, concept: 'boss', tier, from, key: `boss:${q.key}` };
}

function bossFrom(r: Rng, from: ConceptId, tier: Tier): TowerQ {
  const [a, b] = sample(r, LETTERS, 2).sort();
  if (from === 'parts' || from === 'hidden') {
    const t = from === 'hidden' ? term(sign(r), { [a]: int(r, 2, 5), [b]: 1 }) : term(sign(r) * int(r, 2, 12), { [a]: int(r, 2, 5), [b]: int(r, 1, 4) });
    const askCoef = chance(r, 0.5);
    const which = chance(r, 0.5) ? a : b;
    return {
      kind: 'tower', concept: from, tier, format: 'number', letters: [],
      prompt: askCoef ? `What is the coefficient of ${fmt(t)}?` : `What is the exponent of ${which} in ${fmt(t)}?`,
      answerNum: askCoef ? t.c : t.v[which], key: `num:${fmt(t)}:${askCoef ? 'c' : which}`,
      hint: askCoef ? 'The coefficient is the number in front, with its sign. Nothing written means 1.' : 'No exponent written means exponent 1.',
      why: askCoef ? `The number in front of ${fmt(t)} is ${t.c}.` : `${which} has exponent ${t.v[which]} in ${fmt(t)}.`,
      rule: 'Coefficient = number in front (with its sign). Exponent = small raised number. Invisible ones are 1.',
      demo: { v: 'anatomy', term: t, showHidden: true },
    };
  }
  if (from === 'like') {
    const s = spotForBoss(r);
    return s;
  }
  if (from === 'collect') {
    const terms = shuffle(r, [term(int(r, 2, 8), { [a]: 2 }), term(-int(r, 1, 5), { [a]: 2 }), term(int(r, 2, 7), { [a]: 1 }), term(sign(r) * int(r, 2, 6), { [b]: 1 }), term(-int(r, 1, 4), { [a]: 1 })]);
    if (terms[0].c < 0) terms[0] = term(-terms[0].c, terms[0].v);
    const expr = fmtExpr(terms);
    const ans = collect(terms);
    if (ans.length === 0 || isHomework(expr)) return bossFrom(r, from, tier);
    return towerExpr('collect', tier, `Simplify ${expr}`, expr, ans, {}, {
      hint: 'Group the like terms. Each sign belongs to the term after it.', why: `${expr} = ${fmtExpr(ans)}.`,
      rule: 'Add the coefficients of like terms; keep unlike terms apart.', demo: { v: 'collect', terms },
    });
  }
  if (from === 'area') return towerArea(r, tier);
  if (from === 'bracket') return towerBracket(r, tier);
  if (from === 'insideout') return towerInsideOut(r, 2);
  // Multiplying.
  let fs: Term[];
  if (from === 'signs') fs = [term(sign(r) * int(r, 2, 6)), term(-int(r, 2, 6), { [a]: 1 }), term(sign(r) * int(r, 1, 3))];
  else if (from === 'letters') fs = [term(sign(r) * int(r, 2, 6), { [a]: 1 }), term(sign(r) * int(r, 2, 6), { [b]: 1 })];
  else if (from === 'product') fs = [term(1, { [a]: int(r, 2, 6) }), term(1, { [a]: int(r, 1, 5) })];
  else if (from === 'coefpow') fs = [term(sign(r) * int(r, 2, 7), { [a]: int(r, 1, 4) }), term(sign(r) * int(r, 2, 6), { [a]: int(r, 2, 5) })];
  else fs = [term(sign(r) * int(r, 2, 5), { [a]: int(r, 1, 3), [b]: int(r, 1, 2) }), term(sign(r) * int(r, 1, 5), { [a]: int(r, 1, 2), [b]: int(r, 1, 3) })];
  const expr = fs.map((f) => fmtFactor(f)).join(' × ');
  if (isHomework(expr)) return bossFrom(r, from, tier);
  const ans = mulTerms(...fs);
  return towerExpr(from, tier, `Multiply ${expr}`, expr, [ans], {}, {
    hint: 'Signs first, then numbers, then add the exponents of each letter.',
    why: `${expr} = ${fmt(ans)}.`, rule: 'Multiply the coefficients (watch the signs), add the exponents of the same letter.', demo: { v: 'expand', factors: fs },
  });
}

function spotForBoss(r: Rng): TowerQ {
  const [a, b] = sample(r, LETTERS, 2).sort();
  const ea = int(r, 1, 3);
  const target = term(int(r, 2, 9), { [a]: ea, [b]: 1 });
  const like = [term(-int(r, 1, 7), { [a]: ea, [b]: 1 }), term(int(r, 2, 9), { [a]: ea, [b]: 1 })];
  const unlike = [term(int(r, 2, 9), { [a]: ea + 1, [b]: 1 }), term(int(r, 2, 9), { [a]: ea }), term(int(r, 2, 9), { [a]: 1, [b]: ea + 1 })];
  const opts = shuffle(r, [...like.map((t, i) => ({ s: i === 0 ? `${fmt(t).replace(/[a-z].*/, '')}${letterPart(t.v, [b, a])}` : fmt(t), ok: true })), ...unlike.map((t) => ({ s: fmt(t), ok: false }))]);
  return {
    kind: 'tower', concept: 'like', tier: 3, format: 'pick', prompt: `Tap every like term of ${fmt(target)}`, letters: [],
    options: opts.map((o) => o.s), correct: opts.flatMap((o, i) => (o.ok ? [i] : [])), key: `like:${fmt(target)}:${opts.map((o) => o.s).sort().join(',')}`,
    hint: 'Same letters, same exponents. The order of the letters does not matter.',
    why: `Like terms of ${fmt(target)} have the letter part ${letterPart(target.v)}.`, rule: 'Like terms: same letters with the same exponents.',
    demo: { v: 'compare', a: target, b: unlike[0] },
  };
}

/** Two steps: multiply (or power), then collect like terms. */
export function bossMultiStep(r: Rng): TowerQ {
  for (let tries = 0; ; tries++) {
    const l = pick(r, LETTERS);
    const [p, q] = sample(r, LETTERS.filter((x) => x !== l), 2).sort();
    const form = int(r, 0, 3);
    let expr: string;
    let ans: Term[];
    let why: string;
    if (form === 0) {
      const f1 = term(sign(r, 0.3) * int(r, 2, 5), { [l]: 1 });
      const f2 = term(int(r, 2, 5), { [l]: 1 });
      const extra = term(sign(r) * int(r, 1, 6), { [l]: 2 });
      const prod = mulTerms(f1, f2);
      ans = collect([prod, extra]);
      expr = `${fmtFactor(f1)} × ${fmt(f2)} ${extra.c < 0 ? '−' : '+'} ${fmt(term(Math.abs(extra.c), extra.v))}`;
      why = `Multiply first: ${fmtFactor(f1)} × ${fmt(f2)} = ${fmt(prod)}. Then collect: ${fmt(prod)} ${extra.c < 0 ? '−' : '+'} ${fmt(term(Math.abs(extra.c), extra.v))} = ${fmtExpr(ans)}.`;
    } else if (form === 1) {
      const inner = term(int(r, 2, 4), { [l]: 1 });
      const extra = term(-int(r, 1, 9), { [l]: 2 });
      const pw = powTerm(inner, 2);
      ans = collect([pw, extra]);
      expr = `(${fmt(inner)})² − ${fmt(term(-extra.c, extra.v))}`;
      why = `Power first: (${fmt(inner)})² = ${fmt(pw)}. Then ${fmt(pw)} − ${fmt(term(-extra.c, extra.v))} = ${fmtExpr(ans)}.`;
    } else if (form === 2) {
      const f1 = term(int(r, 2, 5), { [p]: 1 });
      const f2 = term(sign(r, 0.3) * int(r, 2, 4), { [q]: 1 });
      const extra = term(int(r, 1, 6), { [p]: 1, [q]: 1 });
      const prod = mulTerms(f1, f2);
      ans = collect([prod, extra]);
      expr = `${fmt(f1)} × ${fmtFactor(f2)} + ${chance(r, 0.5) ? fmt(extra) : fmt(extra, [q, p])}`;
      why = `Multiply: ${fmt(f1)} × ${fmtFactor(f2)} = ${fmt(prod)}. ${p}${q} and ${q}${p} are like terms, so ${fmtExpr(ans)}.`;
    } else {
      const f1 = term(int(r, 2, 4), { [l]: int(r, 2, 3) });
      const f2 = term(sign(r, 0.4) * int(r, 2, 4), { [l]: int(r, 1, 2) });
      const prod = mulTerms(f1, f2);
      const extra = term(int(r, 1, 8), prod.v);
      const other = term(sign(r) * int(r, 2, 7), { [l]: 1 });
      ans = collect([prod, extra, other]);
      expr = `${fmt(f1)} × ${fmtFactor(f2)} + ${fmt(extra)} ${other.c < 0 ? '−' : '+'} ${fmt(term(Math.abs(other.c), other.v))}`;
      why = `Multiply: ${fmt(prod)}. Collect the ${letterPart(prod.v)} terms: ${fmtExpr(collect([prod, extra]))}. The ${l} term stays apart: ${fmtExpr(ans)}.`;
    }
    if ((ans.length === 0 || isHomework(expr)) && tries < 50) continue;
    return towerExpr('boss', 3, `Two-step spell: ${expr}`, expr, ans, { from: 'boss' }, {
      hint: 'Two steps: do the multiplying or the power first, then collect the like terms.',
      why, rule: 'Order of work: powers and multiplying first, then add and subtract like terms.',
      demo: { v: 'collect', terms: ans },
    });
  }
}
