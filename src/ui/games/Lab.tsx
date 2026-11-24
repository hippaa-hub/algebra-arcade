// World 3 — Sign Laboratory. Pour the ingredient flasks together, then label the potion:
// first its sign (blue + or red −), then its number, then its letters.
import { useState } from 'react';
import { checkTerm } from '../../content/check';
import type { MixQ } from '../../content/types';
import { fmt, term } from '../../math/term';
import { NumberPad, padNumber } from '../widgets';
import type { BoardProps } from './types';

export function MixBoard({ q, locked, onSubmit }: BoardProps<MixQ>) {
  const [sign, setSign] = useState<1 | -1 | null>(null);
  const [num, setNum] = useState('');
  const [letters, setLetters] = useState<string[]>([]);
  const [brewing, setBrewing] = useState(false);
  const all = [...new Set(q.factors.flatMap((f) => Object.keys(f.v)))].sort();
  const n = padNumber(num);
  const built = sign !== null && n !== null ? term(sign * n, Object.fromEntries(letters.map((l) => [l, 1]))) : null;
  const ready = built !== null && (all.length === 0 || letters.length > 0);

  const brew = () => {
    if (!built) return;
    setBrewing(true);
    setTimeout(() => { setBrewing(false); onSubmit(checkTerm(q, built)); }, 900);
  };

  return (
    <div className="board lab-board">
      <div className="bench">
        {q.factors.map((f, i) => (
          <div key={i} className="flask-wrap">
            {i > 0 && <span className="times">×</span>}
            <div className={`potion ${f.c < 0 ? 'neg' : 'pos'} ${brewing ? 'pour' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="potion-neck" />
              <div className="potion-body"><span>{fmt(f)}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className={`cauldron ${brewing ? 'bubbling' : ''} ${sign === 1 ? 'pos' : sign === -1 ? 'neg' : ''}`}>
        <div className="cauldron-label">{built ? fmt(built).replace(/^$/, '?') : '?'}</div>
      </div>
      <div className="panel label-maker">
        <div className="lm-step"><span className="lm-n">1</span> Sign
          <div className="sign-choices">
            <button type="button" className={`sign-bottle pos ${sign === 1 ? 'on' : ''}`} disabled={locked} onClick={() => setSign(1)}>+</button>
            <button type="button" className={`sign-bottle neg ${sign === -1 ? 'on' : ''}`} disabled={locked} onClick={() => setSign(-1)}>−</button>
          </div>
        </div>
        <div className="lm-step"><span className="lm-n">2</span> Number <span className="lm-num">{num || '?'}</span></div>
        <NumberPad value={num} onChange={setNum} allowMinus={false} disabled={locked} />
        {all.length > 0 && (
          <div className="lm-step"><span className="lm-n">3</span> Letters
            <div className="tiles">{all.map((l) => (
              <button key={l} type="button" className={`tile ${letters.includes(l) ? 'on' : ''}`} disabled={locked} onClick={() => setLetters(letters.includes(l) ? letters.filter((x) => x !== l) : [...letters, l])}>{l}</button>
            ))}</div>
          </div>
        )}
        <button className="btn primary wide" disabled={!ready || locked || brewing} onClick={brew}>Brew the potion ⚗️</button>
      </div>
    </div>
  );
}
