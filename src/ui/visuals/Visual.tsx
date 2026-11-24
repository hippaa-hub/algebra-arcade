// Pictures for lessons and for the tutor's demonstrations. Each one SHOWS the idea (the hidden 1s appearing,
// letters being counted, a number line turning round) rather than only telling it.
import { useEffect, useState } from 'react';
import type { Visual } from '../../content/types';
import { collect, familyKey, familyText, fmt, fmtExpr, fmtFactor, letterPart, mulTerms, powTerm, sup, type Term } from '../../math/term';

const LETTER_COLOURS = ['#ff5fa2', '#4fb3ff', '#ffb020', '#38d9a9', '#a07bff', '#ff7a45'];
const colourOf = (l: string) => LETTER_COLOURS[(l.charCodeAt(0) - 97) % LETTER_COLOURS.length];

/** Shows an animation step by step: 0, 1, 2… every `ms`. */
function useTick(max: number, ms = 900, key: unknown = null) {
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    const id = setInterval(() => setT((x) => (x >= max ? x : x + 1)), ms);
    return () => clearInterval(id);
  }, [max, ms, key]);
  return t;
}

export function VisualView({ v }: { v: Visual }) {
  switch (v.v) {
    case 'mystery': return <Mystery />;
    case 'anatomy': return <Anatomy t={v.term} showHidden={v.showHidden} />;
    case 'family': return <Family terms={v.terms} orders={v.orders} />;
    case 'compare': return <Compare a={v.a} b={v.b} orderA={v.orderA} orderB={v.orderB} />;
    case 'collect': return <Collect terms={v.terms} />;
    case 'fruit': return <Fruit groups={v.groups} result={v.result} />;
    case 'signline': return <SignLine a={v.a} b={v.b} />;
    case 'signtable': return <SignTable />;
    case 'expand': return <Expand factors={v.factors} />;
    case 'chain': return <Chain letter={v.letter} n={v.n} coef={v.coef} />;
    case 'copies': return <Copies inner={v.inner} n={v.n} />;
    case 'touch': return <Touch text={v.text} squared={v.squared} />;
    case 'area': return <Area w={v.w} h={v.h} />;
  }
}

function Mystery() {
  const t = useTick(3, 1100);
  const vals = ['?', '4', '9', '2'];
  return (
    <div className="vis mystery">
      <div className="box">🎁<span className="box-letter">x</span></div>
      <div className="mystery-val" key={t}>x = {vals[t]}</div>
      <p className="vis-note">x can stand for any number</p>
    </div>
  );
}

function Anatomy({ t, showHidden }: { t: Term; showHidden?: boolean }) {
  const tick = useTick(2, 1200, fmt(t));
  const letters = Object.keys(t.v).sort();
  const abs = Math.abs(t.c);
  const hiddenCoef = abs === 1;
  const reveal = showHidden && tick >= 1;
  return (
    <div className="vis anatomy">
      <div className="anat-term">
        <span className="part coef">
          {t.c < 0 && '−'}
          {hiddenCoef ? <span className={`ghost ${reveal ? 'show' : ''}`}>1</span> : abs}
          <small>coefficient</small>
        </span>
        {letters.map((l) => (
          <span key={l} className="part var" style={{ color: colourOf(l) }}>
            {l}
            <sup className={t.v[l] === 1 ? `ghost ${reveal ? 'show' : ''}` : 'exp'}>{t.v[l]}</sup>
            <small>variable</small>
          </span>
        ))}
      </div>
      <div className="anat-labels">
        <span>number in front: <b>{t.c}</b></span>
        {letters.map((l) => <span key={l}><b style={{ color: colourOf(l) }}>{l}</b> exponent <b>{t.v[l]}</b></span>)}
      </div>
    </div>
  );
}

function Family({ terms, orders }: { terms: Term[]; orders?: (string[] | undefined)[] }) {
  const groups = new Map<string, { t: Term; o?: string[] }[]>();
  terms.forEach((t, i) => { const k = familyKey(t); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push({ t, o: orders?.[i] }); });
  return (
    <div className="vis family">
      {[...groups].map(([k, ts]) => (
        <div key={k} className="fam-group">
          <div className="fam-head">{familyText(k)} family</div>
          <div className="fam-members">{ts.map((x, i) => (
            <span key={i} className="chip"><span className="dim">{fmt(x.t, x.o).replace(/[a-z].*$/, '') || ' '}</span><b>{letterPart(x.t.v, x.o)}</b></span>
          ))}</div>
        </div>
      ))}
    </div>
  );
}

function Compare({ a, b, orderA, orderB }: { a: Term; b: Term; orderA?: string[]; orderB?: string[] }) {
  const same = familyKey(a) === familyKey(b);
  const letters = [...new Set([...Object.keys(a.v), ...Object.keys(b.v)])].sort();
  return (
    <div className="vis compare">
      <div className="cmp-row"><span className="chip big">{fmt(a, orderA)}</span><span className={`cmp-verdict ${same ? 'yes' : 'no'}`}>{same ? 'like terms ✓' : 'unlike ✗'}</span><span className="chip big">{fmt(b, orderB)}</span></div>
      <table className="cmp-table"><tbody>
        {letters.map((l) => (
          <tr key={l}><td>{a.v[l] ? `${l}${a.v[l] > 1 ? sup(a.v[l]) : '¹'}` : '—'}</td><td className={a.v[l] === b.v[l] ? 'ok' : 'bad'}>{a.v[l] === b.v[l] ? '=' : '≠'}</td><td>{b.v[l] ? `${l}${b.v[l] > 1 ? sup(b.v[l]) : '¹'}` : '—'}</td></tr>
        ))}
      </tbody></table>
    </div>
  );
}

function Collect({ terms }: { terms: Term[] }) {
  const tick = useTick(2, 1100, terms.map((t) => fmt(t)).join());
  const fams = [...new Set(terms.map(familyKey))];
  const result = collect(terms);
  return (
    <div className="vis collect">
      <div className="col-line">{fmtExpr(terms)}</div>
      {tick >= 1 && (
        <div className="col-groups">
          {fams.map((k, i) => {
            const ts = terms.filter((t) => familyKey(t) === k);
            const sum = ts.reduce((s, t) => s + t.c, 0);
            return (
              <div key={k} className="col-group" style={{ borderColor: LETTER_COLOURS[i % 6] }}>
                <div className="col-fam" style={{ color: LETTER_COLOURS[i % 6] }}>{familyText(k)}</div>
                <div>{ts.map((t) => (t.c < 0 ? `(${t.c})` : String(t.c))).join(' + ').replace(/-/g, '−')} = <b>{String(sum).replace('-', '−')}</b></div>
              </div>
            );
          })}
        </div>
      )}
      {tick >= 2 && <div className="col-result">= {fmtExpr(result)}</div>}
    </div>
  );
}

function Fruit({ groups, result }: { groups: { emoji: string; n: number }[]; result?: string }) {
  return (
    <div className="vis fruit">
      <div className="fruit-row">
        {groups.map((g, i) => (
          <span key={i} className="fruit-group">
            {i > 0 && <b className="plus">+</b>}
            <span className="fruit-pile">{Array.from({ length: g.n }, (_, j) => <span key={j} style={{ animationDelay: `${j * 0.08}s` }}>{g.emoji}</span>)}</span>
          </span>
        ))}
      </div>
      {result && <div className="col-result">= {result}</div>}
    </div>
  );
}

/** a × b on a number line: |a| jumps of size b, and a minus turns the direction round. */
function SignLine({ a, b }: { a: number; b: number }) {
  const n = Math.abs(a);
  const tick = useTick(n + 1, 650, `${a}x${b}`);
  const product = a * b;
  const dir = Math.sign(product);
  const step = Math.abs(b);
  const max = Math.max(12, Math.abs(product));
  const W = 320;
  const X = (v: number) => W / 2 + (v / max) * (W / 2 - 16);
  const turns = (a < 0 ? 1 : 0) + (b < 0 ? 1 : 0);
  return (
    <div className="vis signline">
      <svg viewBox={`0 0 ${W} 90`} width="100%">
        <line x1="8" y1="60" x2={W - 8} y2="60" stroke="#ffffff88" strokeWidth="3" />
        {[-max, 0, max].map((v) => <g key={v}><line x1={X(v)} y1="54" x2={X(v)} y2="66" stroke="#fff" strokeWidth="2" /><text x={X(v)} y="84" fill="#fff" fontSize="12" textAnchor="middle">{v}</text></g>)}
        {Array.from({ length: Math.min(tick, n) }, (_, i) => (
          <path key={i} d={`M ${X(dir * step * i)} 58 Q ${X(dir * step * (i + 0.5))} 20 ${X(dir * step * (i + 1))} 58`} fill="none" stroke={dir < 0 ? '#ff6b8b' : '#5fd4ff'} strokeWidth="3" />
        ))}
        <text x={X(dir * step * Math.min(tick, n))} y="16" fontSize="18" textAnchor="middle">{dir < 0 ? '🐸' : '🐸'}</text>
      </svg>
      <div className="vis-note">
        {a < 0 ? `(${a})`.replace('-', '−') : a} × {b < 0 ? `(${b})`.replace('-', '−') : b}: {n} jumps of {step}
        {turns === 0 ? ', facing forward' : turns === 1 ? ', turned around once → backwards' : ', turned around twice → forwards again'}
        {tick > n && <b> = {String(product).replace('-', '−')}</b>}
      </div>
    </div>
  );
}

function SignTable() {
  const rows: [string, string, string][] = [['+', '+', '+'], ['−', '+', '−'], ['+', '−', '−'], ['−', '−', '+']];
  return (
    <div className="vis signtable">
      {rows.map(([a, b, c], i) => (
        <div key={i} className="sign-row" style={{ animationDelay: `${i * 0.25}s` }}>
          <span className={`flask ${a === '+' ? 'pos' : 'neg'}`}>{a}</span>×<span className={`flask ${b === '+' ? 'pos' : 'neg'}`}>{b}</span>=<span className={`flask ${c === '+' ? 'pos' : 'neg'}`}>{c}</span>
        </div>
      ))}
    </div>
  );
}

/** Writes every factor as its number and a chain of letters, then counts each letter. */
export function Expand({ factors }: { factors: Term[] }) {
  const tick = useTick(3, 1000, factors.map((f) => fmt(f)).join('|'));
  const ans = mulTerms(...factors);
  const letters = Object.keys(ans.v).sort();
  return (
    <div className="vis expand">
      <div className="exp-line">{factors.map((f) => fmtFactor(f)).join(' × ')}</div>
      {tick >= 1 && (
        <div className="exp-chains">
          {factors.map((f, i) => (
            <span key={i} className="exp-factor">
              {i > 0 && <span className="times">×</span>}
              <span className="chain">
                {f.c !== 1 && <span className="cell num">{String(f.c).replace('-', '−')}</span>}
                {Object.keys(f.v).sort().flatMap((l) => Array.from({ length: f.v[l] }, (_, j) => <span key={l + j} className="cell" style={{ background: colourOf(l) }}>{l}</span>))}
              </span>
            </span>
          ))}
        </div>
      )}
      {tick >= 2 && (
        <div className="exp-count">
          {factors.some((f) => f.c !== 1) && <span>numbers: {factors.map((f) => (f.c < 0 ? `(${f.c})` : f.c)).join(' × ').replace(/-/g, '−')} = <b>{String(ans.c).replace('-', '−')}</b></span>}
          {letters.map((l) => (
            <span key={l} style={{ color: colourOf(l) }}>
              {factors.filter((f) => f.v[l]).length > 1
                ? <>{l}: {factors.filter((f) => f.v[l]).map((f) => f.v[l]).join(' + ')} = <b>{ans.v[l]}</b> {l}’s in a row</>
                : <>{l} comes along: <b>{l}{ans.v[l] > 1 ? sup(ans.v[l]) : ''}</b></>}
            </span>
          ))}
        </div>
      )}
      {tick >= 3 && <div className="col-result">= {fmt(ans)}</div>}
    </div>
  );
}

function Chain({ letter, n, coef = 1 }: { letter: string; n: number; coef?: number }) {
  const tick = useTick(n + 1, 450, `${letter}${n}`);
  return (
    <div className="vis chainv">
      <div className="chain big">
        {coef !== 1 && <span className="cell num">{coef}</span>}
        {Array.from({ length: Math.min(tick, n) }, (_, i) => <span key={i} className="cell pop" style={{ background: colourOf(letter) }}>{letter}</span>)}
      </div>
      <div className="vis-note">{coef !== 1 ? `${coef} × ` : ''}{Array(n).fill(letter).join(' × ')} {tick > n && <b>= {coef !== 1 ? coef : ''}{letter}{sup(n)}</b>}</div>
    </div>
  );
}

function Copies({ inner, n }: { inner: Term; n: number }) {
  const tick = useTick(1, 1200, fmt(inner) + n);
  return (
    <div className="vis copies">
      <div className="exp-line">({fmt(inner)}){sup(n)} = {Array(n).fill(fmtFactor(inner)).join(' × ')}</div>
      {tick >= 1 && <Expand factors={Array(n).fill(inner)} />}
      {tick < 1 && <div className="vis-note">{n} copies of everything in the bracket</div>}
      <span className="sr-only">= {fmt(powTerm(inner, n))}</span>
    </div>
  );
}

function Touch({ text, squared }: { text: string; squared: string[] }) {
  const bracket = text.startsWith('(');
  return (
    <div className="vis touch">
      <div className="touch-term">
        {[...text.replace(/[²³]$/, '')].map((ch, i) => {
          const hit = bracket ? ch !== '(' && ch !== ')' : i === text.replace(/[²³]$/, '').length - 1;
          return <span key={i} className={hit ? 'hit' : ''}>{ch}</span>;
        })}
        <sup className="pow">{text.slice(-1)}</sup>
      </div>
      <div className="vis-note">The power touches: <b>{bracket ? 'everything inside the bracket' : squared.join(', ')}</b></div>
    </div>
  );
}

export function Area({ w, h, second }: { w: Term; h: Term; second?: { w: Term; h: Term } }) {
  return (
    <div className="vis area">
      <div className="rooms">
        <div className="room" style={{ flexGrow: Math.max(1, Math.abs(w.c)), aspectRatio: `${Math.max(1, Math.abs(w.c))} / ${Math.max(1, Math.abs(h.c))}` }}>
          <span className="side top">{fmt(w)}</span><span className="side left">{fmt(h)}</span><span className="room-in">{fmt(mulTerms(w, h))}</span>
        </div>
        {second && (
          <div className="room two" style={{ flexGrow: Math.max(1, Math.abs(second.w.c)), aspectRatio: `${Math.max(1, Math.abs(second.w.c))} / ${Math.max(1, Math.abs(second.h.c))}` }}>
            <span className="side top">{fmt(second.w)}</span><span className="side left">{fmt(second.h)}</span><span className="room-in">?</span>
          </div>
        )}
      </div>
      <div className="vis-note">area = length × width = {fmt(w)} × {fmt(h)} = <b>{fmt(mulTerms(w, h))}</b></div>
    </div>
  );
}

/** A rectangle with labelled sides but no answer inside (for questions). */
export function AreaQuestion({ w, h, second }: { w: Term; h: Term; second?: { w: Term; h: Term } }) {
  const room = (a: Term, b: Term, cls = '') => (
    <div className={`room ${cls}`} style={{ flexGrow: Math.max(1, Math.abs(a.c)), aspectRatio: `${Math.max(1, Math.abs(a.c))} / ${Math.max(1, Math.abs(b.c))}` }}>
      <span className="side top">{fmt(a)}</span><span className="side left">{fmt(b)}</span><span className="room-in">?</span>
    </div>
  );
  return <div className="vis area"><div className="rooms">{room(w, h)}{second && room(second.w, second.h, 'two')}</div></div>;
}
