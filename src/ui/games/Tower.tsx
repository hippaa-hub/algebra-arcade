// World 5 — The Power Tower and the final boss. Each right answer climbs a floor; in the boss fight each one
// is a spell that knocks a heart off the Muddle Monster.
import { useState } from 'react';
import { checkTower } from '../../content/check';
import type { TowerQ } from '../../content/types';
import { normalise } from '../../math/algebra';
import { AreaQuestion } from '../visuals/Visual';
import { ExprPad, NumberPad, padNumber } from '../widgets';
import type { BoardProps } from './types';
import { mx } from '../M';

export function Monster({ progress, hits }: { progress: number; hits: number }) {
  const hearts = 8;
  const left = Math.max(0, Math.round(hearts * (1 - progress)));
  return (
    <div className="boss">
      <div key={hits} className={`monster ${hits > 0 ? 'hit' : ''}`}>
        <svg viewBox="0 0 120 110" width="120" height="110" aria-hidden="true">
          <path d="M20 100 Q10 40 60 20 Q110 40 100 100 Z" fill="#8b5cf6" />
          <path d="M30 28 L22 6 L42 22 Z M90 28 L98 6 L78 22 Z" fill="#fbbf24" />
          <circle cx="45" cy="55" r="12" fill="#fff" /><circle cx="78" cy="55" r="12" fill="#fff" />
          <circle cx="48" cy="57" r="5" fill="#1e1b4b" /><circle cx="75" cy="57" r="5" fill="#1e1b4b" />
          <path d="M42 80 Q60 92 80 80" stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round" />
          <text x="60" y="98" textAnchor="middle" fontSize="10" fill="#fde68a" fontWeight="700">x²?·y³?</text>
        </svg>
      </div>
      <div className="hearts" aria-label={`Monster has ${left} hearts left`}>{Array.from({ length: hearts }, (_, i) => <span key={i} className={i < left ? 'on' : ''}>♥</span>)}</div>
    </div>
  );
}

export function TowerScene({ rightCount, boss, progress }: { rightCount: number; boss: boolean; progress: number }) {
  if (boss) return <Monster progress={progress} hits={rightCount} />;
  const floors = 6;
  const at = rightCount % floors;
  return (
    <div className="tower-scene" aria-label={`Floor ${at + 1}`}>
      {Array.from({ length: floors }, (_, i) => floors - 1 - i).map((f) => (
        <div key={f} className={`floor ${f === at ? 'here' : f < at ? 'done' : ''}`}>{f === at ? '🧗‍♀️' : f < at ? '⭐' : '🪟'}</div>
      ))}
    </div>
  );
}

export function TowerBoard({ q, locked, onSubmit, rightCount, progress }: BoardProps<TowerQ>) {
  const [text, setText] = useState('');
  const [num, setNum] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const boss = q.concept === 'boss';
  const letters = [...new Set([...q.letters, ...(normalise(q.expr ?? '').match(/[a-z]/g) ?? [])])].sort();
  const toggle = (i: number) => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i]);

  const submit = () => onSubmit(checkTower(q, { text, num: padNumber(num), picked }));
  const ready = q.format === 'expr' ? !!text : q.format === 'number' ? padNumber(num) !== null : picked.length > 0;

  return (
    <div className={`board tower-board ${boss ? 'boss-mode' : ''}`}>
      <TowerScene rightCount={rightCount} boss={boss} progress={progress} />
      <div className="panel spell">
        <p className="spell-prompt">{mx(q.prompt)}</p>
        {q.rect && <AreaQuestion w={q.rect.w} h={q.rect.h} second={q.rect.second} />}
        {q.format === 'expr' && <ExprPad value={text} onChange={setText} letters={letters} disabled={locked} />}
        {q.format === 'number' && (
          <>
            <div className="lm-num big">{num || '?'}</div>
            <NumberPad value={num} onChange={setNum} disabled={locked} />
          </>
        )}
        {q.format === 'touch' && (
          <div className="touch-pick">
            <div className="touch-show">
              {q.expr!.startsWith('(') && <span className="br">(</span>}
              {q.pieces!.map((p, i) => (
                <button key={i} type="button" className={`piece ${picked.includes(i) ? 'on' : ''}`} disabled={locked} onClick={() => toggle(i)}>{mx(p)}</button>
              ))}
              {q.expr!.startsWith('(') && <span className="br">)</span>}
              {mx(q.power)}
            </div>
            <small className="soft">Tap each piece the power ² touches</small>
          </div>
        )}
        {q.format === 'pick' && (
          <div className="pick-grid">
            {q.options!.map((o, i) => (
              <button key={i} type="button" className={`pick ${picked.includes(i) ? 'on' : ''}`} disabled={locked} onClick={() => toggle(i)}>{mx(o)}</button>
            ))}
          </div>
        )}
        <button className="btn primary wide" disabled={!ready || locked} onClick={submit}>{boss ? 'Cast the spell ✨' : 'Climb! 🧗‍♀️'}</button>
      </div>
    </div>
  );
}
