// World 2 — Algebra Restaurant. Bring the matching ingredients, then cook orders by collecting like terms.
import { useMemo, useState } from 'react';
import { checkPlates, checkSpot, checkTyped } from '../../content/check';
import type { CookQ, SpotQ } from '../../content/types';
import { familyKey, familyText, fmt, fmtExpr, term } from '../../math/term';
import { useDragDrop } from '../drag';
import { play } from '../sound';
import { ExprPad } from '../widgets';
import { QStepper } from './Aliens';
import type { BoardProps } from './types';
import { mx } from '../M';

export const FOOD: Record<string, { emoji: string; name: string }> = {
  a: { emoji: '🥑', name: 'avocado' }, b: { emoji: '🍌', name: 'banana' }, c: { emoji: '🥕', name: 'carrot' },
  m: { emoji: '🍄', name: 'mushroom' }, p: { emoji: '🍐', name: 'pear' }, t: { emoji: '🍅', name: 'tomato' },
};
const CUSTOMERS = ['🧔', '👵', '🧑‍🎤', '👨‍🚀', '🧛', '🤠', '👸', '🧙'];
const customerFor = (key: string) => CUSTOMERS[[...key].reduce((s, c) => s + c.charCodeAt(0), 0) % CUSTOMERS.length];

export function SpotBoard({ q, locked, onSubmit }: BoardProps<SpotQ>) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <div className="board spot-board">
      <div className="order-ticket">
        <span className="customer">{customerFor(q.key)}</span>
        <div><small>Order card</small><div className="ticket-term">{mx(fmt(q.target, q.targetOrder))}</div><small>Bring EVERY ingredient that matches!</small></div>
      </div>
      <div className="pantry">
        {q.options.map((o, i) => (
          <button key={i} type="button" className={`jar ${picked.includes(i) ? 'on' : ''}`} disabled={locked}
            onClick={() => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i])}>
            <span className="jar-lid" />
            <span className="jar-term">{mx(fmt(o.term, o.order))}</span>
            {picked.includes(i) && <span className="tick">✓</span>}
          </button>
        ))}
      </div>
      <button className="btn primary wide" disabled={locked || picked.length === 0} onClick={() => onSubmit(checkSpot(q, picked))}>Serve 🛎️</button>
    </div>
  );
}

export function CookBoard(props: BoardProps<CookQ>) {
  return props.q.mode === 'type' ? <CookTyped {...props} /> : <CookPlates {...props} />;
}

function CookTyped({ q, locked, onSubmit }: BoardProps<CookQ>) {
  const [typed, setTyped] = useState('');
  const letters = [...new Set(q.terms.flatMap((t) => Object.keys(t.term.v)))].sort();
  return (
    <div className="board cook-board">
      <div className="order-ticket rush">
        <span className="customer">{customerFor(q.key)}</span>
        <div><small>⚡ Rush hour! Simplify the order</small><div className="ticket-term">{mx(q.expr)}</div></div>
      </div>
      <ExprPad value={typed} onChange={setTyped} letters={letters} disabled={locked} />
      <button className="btn primary wide" disabled={locked || !typed} onClick={() => onSubmit(checkTyped(q.expr, fmtExpr(q.answer), typed, 'collect'))}>Serve 🛎️</button>
    </div>
  );
}

function CookPlates({ q, locked, onSubmit }: BoardProps<CookQ>) {
  const picture = q.mode === 'picture';
  const plates = useMemo(() => {
    const keys = [...new Set(q.terms.map((t) => familyKey(t.term)))];
    return keys.sort((a, b) => (q.key.length % 2 ? a.localeCompare(b) : b.localeCompare(a)));
  }, [q]);
  const [where, setWhere] = useState<Record<number, string>>({});
  const [totals, setTotals] = useState<Record<string, number | null>>({});
  const [bubble, setBubble] = useState<string | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const allPlaced = Object.keys(where).length === q.terms.length;

  const drop = (id: string, plate: string) => {
    const i = Number(id);
    if (familyKey(q.terms[i].term) === plate) { setWhere({ ...where, [i]: plate }); setBubble(null); play('right'); }
    else {
      play('almost');
      setShake(i); setTimeout(() => setShake(null), 500);
      const t = q.terms[i];
      setBubble(`${fmt(t.term, t.order)} is not ${picture ? FOOD[plate]?.name ?? familyText(plate) : familyText(plate)}. ${Object.keys(t.term.v).join() === plate.replace(/\^\d+/g, '') ? 'Look at the exponents!' : 'Different letters, different ingredient.'}`);
    }
  };
  const { itemProps, zoneProps } = useDragDrop(drop, !locked);
  const label = (k: string) => (picture ? `${FOOD[k]?.emoji ?? ''} ${k}` : familyText(k));
  const summary = plates.map((k) => (totals[k] == null ? null : term(totals[k]!, plates.length ? Object.fromEntries(k ? k.split('*').map((p) => { const [l, e] = p.split('^'); return [l, e ? Number(e) : 1]; }) : []) : {})));

  const serve = () => {
    const filled = Object.fromEntries(plates.map((k) => [k, totals[k] ?? NaN]));
    onSubmit(checkPlates(q, filled));
  };

  return (
    <div className="board cook-board">
      <div className="order-ticket">
        <span className="customer">{customerFor(q.key)}</span>
        <div><small>New order!</small><div className="ticket-term">{mx(q.expr)}</div><small>{allPlaced ? 'Now count each plate.' : 'Drag each part of the order onto its plate.'}</small></div>
      </div>
      <div className="order-cards">
        {q.terms.map((t, i) => (where[i] === undefined ? (
          <div key={i} className={`food-card draggable ${shake === i ? 'shake' : ''}`} {...itemProps(String(i))}>
            <b>{mx(fmt(t.term, t.order))}</b>
            {picture && <span className="food-pile">{Array.from({ length: t.term.c }, (_, j) => <span key={j}>{FOOD[Object.keys(t.term.v)[0]]?.emoji}</span>)}</span>}
          </div>
        ) : null))}
      </div>
      <div className="plates">
        {plates.map((k) => {
          const on = q.terms.map((t, i) => ({ t, i })).filter(({ i }) => where[i] === k);
          return (
            <div key={k} className="plate" {...zoneProps(k)}>
              <div className="plate-label">{mx(label(k))}</div>
              <div className="plate-dish">
                {on.map(({ t, i }) => (
                  <span key={i} className={`on-plate ${t.term.c < 0 ? 'neg' : ''}`}>
                    {picture ? Array.from({ length: t.term.c }, (_, j) => <span key={j}>{FOOD[Object.keys(t.term.v)[0]]?.emoji}</span>) : (t.term.c < 0 ? '−' : '+') + fmt({ c: Math.abs(t.term.c), v: t.term.v }, t.order)}
                  </span>
                ))}
              </div>
              {allPlaced && (
                <div className="plate-total"><small>Total</small><QStepper label={`Total of ${familyText(k)}`} value={totals[k] ?? null} onChange={(n) => setTotals({ ...totals, [k]: n })} disabled={locked} min={-40} max={40} /></div>
              )}
            </div>
          );
        })}
      </div>
      {bubble && <div className="hint-bubble pop-in">{mx(bubble)}</div>}
      {allPlaced && (
        <>
          <div className="final-order">Final order: <b>{summary.every(Boolean) ? fmtExpr(summary.filter((t) => t!.c !== 0) as never) : '…'}</b></div>
          <button className="btn primary wide" disabled={locked || summary.some((t) => !t)} onClick={serve}>Ring the bell 🛎️</button>
        </>
      )}
    </div>
  );
}
