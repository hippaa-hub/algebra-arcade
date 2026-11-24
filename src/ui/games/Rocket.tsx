// World 4 — Exponent Rocket. Each right answer is a fuel cell; three cells launch the rocket to a new planet.
// The fuel tanks show powers as chains of letters, so adding exponents is something she can SEE.
import { useState } from 'react';
import { checkTerm } from '../../content/check';
import type { FuelQ } from '../../content/types';
import { fmt, fmtFactor, term } from '../../math/term';
import { PLANETS } from '../../engine/rewards';
import { NumberPad, padNumber } from '../widgets';
import { QStepper } from './Aliens';
import type { BoardProps } from './types';
import { mx } from '../M';

const CELL_COLOURS: Record<string, string> = {};
const colour = (l: string) => (CELL_COLOURS[l] ??= ['#ff5fa2', '#4fb3ff', '#ffb020', '#38d9a9', '#a07bff', '#ff7a45'][(l.charCodeAt(0) - 97) % 6]);

function Cells({ t }: { t: { c: number; v: Record<string, number> } }) {
  return (
    <span className="chain">
      {t.c !== 1 && <span className="cell num">{String(t.c).replace('-', '−')}</span>}
      {Object.keys(t.v).sort().flatMap((l) => Array.from({ length: t.v[l] }, (_, j) => <span key={l + j} className="cell" style={{ background: colour(l) }}>{l}</span>))}
    </span>
  );
}

export function FuelScene({ rightCount, planets, launching }: { rightCount: number; planets: number; launching: boolean }) {
  const fuel = rightCount % 3;
  return (
    <div className="space-scene">
      <div className="planet-path">
        {PLANETS.map((p, i) => (
          <span key={p.name} className={`planet ${i < planets ? 'open' : i === planets ? 'next' : ''}`} title={p.name}>{i < planets || i === planets ? p.emoji : '🔒'}</span>
        ))}
      </div>
      <div className={`rocket ${launching ? 'launch' : ''}`}>🚀</div>
      <div className="fuel-gauge" aria-label={`Fuel ${fuel} of 3`}>{[0, 1, 2].map((i) => <i key={i} className={i < fuel || launching ? 'full' : ''} />)}</div>
    </div>
  );
}

export function FuelBoard({ q, locked, onSubmit, rightCount, planets }: BoardProps<FuelQ>) {
  const letters = [...new Set(q.factors.flatMap((f) => Object.keys(f.v)))].sort();
  const [num, setNum] = useState('');
  const [exps, setExps] = useState<Record<string, number | null>>({});
  const [count, setCount] = useState(0);
  const needsCoef = q.mode !== 'expand' && q.factors.some((f) => f.c !== 1);

  const submit = () => {
    if (q.mode === 'expand') { onSubmit(checkTerm(q, term(1, { [letters[0]]: count }))); return; }
    const c = needsCoef ? (padNumber(num) ?? 1) : 1;
    onSubmit(checkTerm(q, term(c, Object.fromEntries(letters.map((l) => [l, exps[l] ?? 0])))));
  };
  const ready = q.mode === 'expand' ? count > 0 : letters.every((l) => exps[l] != null);

  return (
    <div className="board rocket-board">
      <FuelScene rightCount={rightCount} planets={planets} launching={false} />
      <div className="panel fuel-panel">
        {q.mode === 'count' && (
          <>
            <p className="board-ask">Write this fuel chain as a power</p>
            <div className="tank"><Cells t={q.answer} /></div>
            <div className="small-expr">{mx(q.expr)}</div>
          </>
        )}
        {q.mode === 'expand' && (
          <>
            <p className="board-ask">Load the right number of <b>{letters[0]}</b> cells for <b className="big-term">{mx(fmt(q.answer))}</b></p>
            <div className="tank">{count === 0 ? <span className="soft">empty tank</span> : <Cells t={term(1, { [letters[0]]: count })} />}</div>
            <div className="row-btns">
              <button className="btn ghost" disabled={locked || count === 0} onClick={() => setCount(count - 1)}>− remove</button>
              <button className="btn primary" disabled={locked || count >= 12} onClick={() => setCount(count + 1)}>+ {letters[0]} cell</button>
            </div>
          </>
        )}
        {q.mode === 'merge' && (
          <>
            <p className="board-ask">Merge the fuel tanks</p>
            <div className="tanks">
              {q.factors.map((f, i) => (
                <span key={i} className="tank-wrap">{i > 0 && <span className="times">×</span>}<span className="tank">{q.cells ? <Cells t={f} /> : <b>{mx(fmtFactor(f))}</b>}</span></span>
              ))}
            </div>
            {q.cells && <div className="small-expr">{mx(q.expr)}</div>}
          </>
        )}
        {q.mode !== 'expand' && (
          <div className="builder">
            {needsCoef && (
              <div className="build-coef">
                <small>Number in front</small>
                <div className="lm-num">{num || '1?'}</div>
                <NumberPad value={num} onChange={setNum} disabled={locked} />
              </div>
            )}
            <div className="build-exps">
              {letters.map((l) => (
                <div key={l} className="exp-row"><span className="big-letter" style={{ color: colour(l) }}>{l}<sup className="ex">{exps[l] == null ? '?' : exps[l]}</sup></span>
                  <QStepper label={`Exponent of ${l}`} value={exps[l] ?? null} onChange={(n) => setExps({ ...exps, [l]: n })} min={1} max={20} disabled={locked} /></div>
              ))}
            </div>
          </div>
        )}
        <button className="btn primary wide" disabled={!ready || locked} onClick={submit}>Load fuel 🚀</button>
      </div>
    </div>
  );
}
