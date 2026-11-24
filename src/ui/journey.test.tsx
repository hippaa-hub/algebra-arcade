// The whole learning journey, played through the real screens by a robot player: every lesson, all five
// games, wrong answers (to check the tutor: hint, demonstration, a similar question, re-teaching), level
// celebrations, saving and reloading, and the parent view.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { Question } from '../content/types';
import { familyKey, familyText, fmt, fmtExpr } from '../math/term';
import { load } from '../engine/save';

const q = () => (window as unknown as { __arcadeQ: Question }).__arcadeQ;
const tick = (ms = 1000) => act(() => { vi.advanceTimersByTime(ms); });
const btn = (name: string | RegExp, root: HTMLElement = document.body) => within(root).queryAllByRole('button', { name })[0] as HTMLButtonElement | undefined;
const click = (el: Element | null | undefined) => { if (!el) throw new Error('missing element'); act(() => { fireEvent.click(el); }); };
const clickText = (re: RegExp) => { const b = [...document.querySelectorAll('button')].find((x) => re.test(x.textContent ?? '')); click(b); };
const hasText = (re: RegExp) => [...document.querySelectorAll('button')].some((x) => re.test(x.textContent ?? ''));

/** Moves a stepper from whatever it shows now ("?" or a number) to the target. */
function stepTo(label: string, target: number) {
  const up = screen.getByRole('button', { name: `${label} up` });
  const down = screen.getByRole('button', { name: `${label} down` });
  const out = () => up.parentElement!.querySelector('output')!.textContent!.replace('−', '-');
  if (out() === '?') click(target > 0 ? up : down);
  for (let i = 0; i < 60 && Number(out()) !== target; i++) click(Number(out()) < target ? up : down);
}
function setTiles(root: Element, want: string[]) {
  for (const t of root.querySelectorAll('.tile')) {
    const on = t.classList.contains('on');
    if (on !== want.includes(t.textContent!)) click(t);
  }
}

const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** Screen text shows exponents as raised digits, so compare with superscripts turned into digits. */
const plain = (s: string) => [...s].map((c) => (SUP_DIGITS.includes(c) ? String(SUP_DIGITS.indexOf(c)) : c)).join('');
function typeExpr(text: string) {
  const pad = document.querySelector('.exprpad') as HTMLElement;
  click(btn('Clear', pad));
  for (const ch of text.replace(/\s+/g, '')) {
    const name = /[a-z]/.test(ch) ? ch : SUP_DIGITS.includes(ch) ? `power digit ${SUP_DIGITS.indexOf(ch)}` : ch === '+' ? 'plus' : ch === '−' ? 'minus' : ch;
    click(within(pad).getAllByRole('button', { name })[0]);
  }
}
function typeNumber(n: number) {
  const pad = document.querySelector('.numpad') as HTMLElement;
  for (let i = 0; i < 6; i++) click(within(pad).getByRole('button', { name: 'Delete' }));
  for (const d of String(Math.abs(n))) click(within(pad).getByRole('button', { name: d }));
  if (n < 0) click(within(pad).getByRole('button', { name: 'Change sign' }));
}
function tap(el: Element) {
  act(() => { fireEvent.pointerDown(el, { clientX: 10, clientY: 10 }); });
  act(() => { window.dispatchEvent(new Event('pointerup')); });
}

/** Answers the current question; `wrong` makes a deliberate mistake where the game allows it. Returns false if it could not. */
function answer(question: Question, wrong: boolean): boolean {
  switch (question.kind) {
    case 'scan': {
      if (wrong && !question.ask.coef) return false;
      if (question.ask.coef) stepTo('Coefficient', question.term.c + (wrong ? 1 : 0));
      const letters = Object.keys(question.term.v);
      if (question.ask.letters) setTiles(document.querySelector('.scanner .tiles')!, letters);
      if (question.ask.exps) for (const l of letters) stepTo(`Exponent of ${l}`, question.term.v[l]);
      clickText(/Scan!/);
      tick();
      return true;
    }
    case 'sort': {
      if (wrong) return false;
      for (const a of question.aliens) {
        const el = [...document.querySelectorAll('.alien-field .draggable')].find((d) => d.querySelector('.alien-term')?.textContent === plain(fmt(a.term, a.order)))!;
        tap(el);
        click(document.querySelector(`.ship[data-zone="${familyKey(a.term)}"]`));
        tick(100);
      }
      tick();
      return true;
    }
    case 'spot': {
      if (wrong) return false;
      const jars = document.querySelectorAll('.jar');
      question.options.forEach((o, i) => { if (familyKey(o.term) === familyKey(question.target)) click(jars[i]); });
      clickText(/Serve/);
      return true;
    }
    case 'cook': {
      if (wrong) return false;
      if (question.mode === 'type') { typeExpr(fmtExpr(question.answer)); clickText(/Serve/); return true; }
      for (const t of question.terms) {
        const el = [...document.querySelectorAll('.order-cards .food-card')].find((d) => d.querySelector('b')?.textContent === plain(fmt(t.term, t.order)))!;
        tap(el);
        click(document.querySelector(`.plate[data-zone="${familyKey(t.term)}"]`));
      }
      for (const k of new Set(question.terms.map((t) => familyKey(t.term)))) {
        stepTo(`Total of ${familyText(k)}`, question.terms.filter((t) => familyKey(t.term) === k).reduce((s, t) => s + t.term.c, 0));
      }
      clickText(/Ring the bell/);
      return true;
    }
    case 'mix': {
      const a = question.answer;
      click(document.querySelector(`.sign-bottle.${a.c < 0 ? 'neg' : 'pos'}`));
      typeNumber(Math.abs(a.c) + (wrong ? 1 : 0));
      if (Object.keys(a.v).length) setTiles(document.querySelector('.label-maker .tiles')!, Object.keys(a.v));
      clickText(/Brew/);
      tick();
      return true;
    }
    case 'fuel': {
      if (wrong) return false;
      const a = question.answer;
      if (question.mode === 'expand') { for (let i = 0; i < Object.values(a.v)[0]; i++) clickText(/cell$/); }
      else {
        if (question.factors.some((f) => f.c !== 1)) typeNumber(a.c);
        for (const l of Object.keys(a.v)) stepTo(`Exponent of ${l}`, a.v[l]);
      }
      clickText(/Load fuel/);
      return true;
    }
    case 'tower': {
      if (question.format === 'expr') typeExpr(wrong ? '0' : question.answerExpr!);
      else if (question.format === 'number') { if (wrong) return false; typeNumber(question.answerNum!); }
      else if (question.format === 'touch') { if (wrong) return false; const ps = document.querySelectorAll('.piece'); question.touched!.forEach((i) => click(ps[i])); }
      else { if (wrong) return false; const ps = document.querySelectorAll('.pick'); question.correct!.forEach((i) => click(ps[i])); }
      clickText(/Climb!|Cast the spell/);
      return true;
    }
  }
}

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('the whole journey', () => {
  it('can be played from the first lesson to the end, with mistakes along the way', () => {
    render(<App />);
    const seen = { lessons: 0, retries: 0, shown: 0, similar: 0, reteach: 0, levels: 0, kinds: new Set<string>() };
    let n = 0;
    let lastScreen = '';
    for (let guard = 0; guard < 4000; guard++) {
      tick(50);
      const sc = document.querySelector('.screen')?.className ?? 'none';
      if ((globalThis as { DEBUG_JOURNEY?: boolean }).DEBUG_JOURNEY && sc !== lastScreen) { console.log('SCREEN', sc, load().stagesDone.join(',')); lastScreen = sc; }
      if (document.querySelector('.home')) {
        if (screen.queryByText(/Practice Arcade/, { selector: 'small' })) break;
        clickText(/PLAY/);
        continue;
      }
      if (document.querySelector('.celebrate')) { seen.levels++; clickText(/Onwards|Home/); continue; }
      if (document.querySelector('.lesson')) {
        if (document.querySelector('.lesson-kicker')?.textContent === 'Quick reminder') seen.reteach++;
        if (hasText(/^Next$|See an example/)) { clickText(/^Next$|See an example/); continue; }
        if (hasText(/Show step 1|Next step/)) { clickText(/Show step 1|Next step/); continue; }
        seen.lessons++;
        clickText(/^Play |Back to the game/);
        continue;
      }
      const sheet = document.querySelector('.sheet');
      if (sheet) {
        if (sheet.classList.contains('retry')) { seen.retries++; clickText(/Try again/); }
        else { if (sheet.classList.contains('shown')) seen.shown++; clickText(/Next ▶|Continue|Got it!/); }
        continue;
      }
      if (document.querySelector('.board')) {
        const question = q();
        seen.kinds.add(question.kind + (question.kind === 'tower' ? `:${question.format}` : question.kind === 'cook' || question.kind === 'fuel' ? `:${question.mode}` : ''));
        if (document.querySelector('.confirm-tag')) seen.similar++;
        n++;
        // A planned mistake pattern: some questions wrong once, some wrong twice.
        const wrongTimes = n % 9 === 0 ? 2 : n % 5 === 0 ? 1 : 0;
        let made = 0;
        for (let i = 0; i < wrongTimes; i++) {
          if (!answer(question, true)) break;
          made++;
          tick(300);
          const s = document.querySelector('.sheet');
          if (s?.classList.contains('retry')) { seen.retries++; clickText(/Try again/); tick(50); }
        }
        if (made < 2) answer(question, false);
        tick(300);
        continue;
      }
      throw new Error(`Stuck on an unknown screen: ${document.body.innerHTML.slice(0, 300)}`);
    }
    const save = load();
    expect(save.stagesDone.length).toBe(12);
    expect(Object.values(save.levels).every((l) => l.done)).toBe(true);
    expect(seen.levels).toBe(5);
    expect(seen.lessons).toBeGreaterThanOrEqual(12);
    expect(seen.retries).toBeGreaterThan(5);
    expect(seen.shown).toBeGreaterThan(2);
    expect(seen.similar).toBeGreaterThan(2);
    expect(save.friends).toEqual(expect.arrayContaining(['zib', 'chef', 'fizz', 'nova', 'muddle']));
    expect(save.badges.length).toBeGreaterThan(5);
    expect(save.planets).toBeGreaterThan(0);
    // Every game format was actually played.
    for (const k of ['scan', 'sort', 'spot', 'cook:picture', 'cook:plates', 'cook:type', 'mix', 'fuel:count', 'fuel:expand', 'fuel:merge', 'tower:expr', 'tower:touch', 'tower:number']) {
      expect([...seen.kinds], k).toContain(k);
    }
    console.log(`Journey: ${n} questions, ${seen.retries} retries, ${seen.shown} demonstrations, ${seen.similar} similar questions, ${seen.reteach} re-teaches; stars ${Object.values(save.levels).map((l) => l.stars).join(',')}`);
  }, 120_000);

  it('remembers progress after closing and reopening', () => {
    const { unmount } = render(<App />);
    clickText(/PLAY/);
    clickText(/^Next$/);
    unmount();
    render(<App />);
    expect(screen.getByText(/Meet the Algebra Aliens/, { selector: 'b' })).toBeInTheDocument();
  });

  it('opens the parent view only after holding the button, then shows the report', () => {
    render(<App />);
    clickText(/For grown-ups/);
    const hold = screen.getByRole('button', { name: /Hold to open/ });
    act(() => { fireEvent.pointerDown(hold); });
    tick(2200);
    expect(screen.getByText('Progress report')).toBeInTheDocument();
    expect(screen.getByText(/skills mastered/)).toBeInTheDocument();
    expect(screen.getByText(/Needs more practice/)).toBeInTheDocument();
  });
});
