// World 1 — Alien Term Collector. Scan an alien (read its parts), then sort aliens into their family ships.
import { useMemo, useState } from 'react';
import { checkScan } from '../../content/check';
import type { ScanQ, SortQ } from '../../content/types';
import { familyKey, familyText, fmt } from '../../math/term';
import { play } from '../sound';
import { useDragDrop } from '../drag';
import { Alien } from '../widgets';
import type { BoardProps } from './types';

/** A stepper that starts on "?" so the answer is never given away. */
export function QStepper({ value, onChange, label, min = -20, max = 20, disabled }: { value: number | null; onChange: (n: number) => void; label: string; min?: number; max?: number; disabled?: boolean }) {
  const step = (d: number) => onChange(value === null ? (d > 0 ? 1 : -1) : Math.min(max, Math.max(min, value + d)));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`${label} down`} disabled={disabled} onClick={() => step(-1)}>−</button>
      <output>{value === null ? '?' : String(value).replace('-', '−')}</output>
      <button type="button" aria-label={`${label} up`} disabled={disabled} onClick={() => step(1)}>+</button>
    </div>
  );
}

export function ScanBoard({ q, locked, onSubmit }: BoardProps<ScanQ>) {
  const termLetters = Object.keys(q.term.v).sort();
  const [coef, setCoef] = useState<number | null>(null);
  const [letters, setLetters] = useState<string[]>([]);
  const [exps, setExps] = useState<Record<string, number | null>>({});
  const [scanning, setScanning] = useState(false);
  const shownLetters = q.ask.letters ? letters : q.order;
  const ready = (!q.ask.coef || coef !== null) && (!q.ask.letters || letters.length > 0) && (!q.ask.exps || shownLetters.every((l) => exps[l] != null));

  const scan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const e: Record<string, number> = {};
      for (const l of shownLetters) e[l] = exps[l] ?? (q.ask.exps ? -1 : q.term.v[l]);
      onSubmit(checkScan(q, { coef, letters: q.ask.letters ? letters : termLetters, exps: e }));
    }, 650);
  };

  return (
    <div className="board scan-board">
      <div className="landing">
        <div className={`ufo-beam ${scanning ? 'on' : ''}`} />
        <Alien text={fmt(q.term, q.order)} colour={q.key.length} size={150} mood={scanning ? 'wow' : 'happy'} />
      </div>
      <div className="scanner panel">
        <div className="scanner-title">🔦 Alien scanner</div>
        {q.ask.coef && (
          <div className="scan-row"><span>Coefficient</span><QStepper label="Coefficient" value={coef} onChange={setCoef} disabled={locked} /></div>
        )}
        {q.ask.letters && (
          <div className="scan-row"><span>Variables</span>
            <div className="tiles">{q.letterChoices.map((l) => (
              <button key={l} type="button" className={`tile ${letters.includes(l) ? 'on' : ''}`} disabled={locked}
                onClick={() => setLetters(letters.includes(l) ? letters.filter((x) => x !== l) : [...letters, l])}>{l}</button>
            ))}</div>
          </div>
        )}
        {q.ask.exps && shownLetters.map((l) => (
          <div className="scan-row" key={l}><span>Exponent of <b>{l}</b></span><QStepper label={`Exponent of ${l}`} min={0} max={9} value={exps[l] ?? null} onChange={(n) => setExps({ ...exps, [l]: n })} disabled={locked} /></div>
        ))}
        {q.ask.exps && q.ask.letters && letters.length === 0 && <p className="soft">Pick the variables first, then their exponents.</p>}
        <button className="btn primary wide" disabled={!ready || locked || scanning} onClick={scan}>Scan!</button>
      </div>
    </div>
  );
}

export function SortBoard({ q, locked, onOutcome }: BoardProps<SortQ>) {
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [bubble, setBubble] = useState<{ ship: string; text: string } | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const ships = useMemo(() => q.families, [q.families]);

  const drop = (id: string, ship: string) => {
    if (locked) return;
    const i = Number(id);
    const alien = q.aliens[i];
    const fam = familyKey(alien.term);
    if (fam === ship) {
      play('right');
      const next = { ...placed, [i]: ship };
      setPlaced(next);
      setBubble(null);
      if (Object.keys(next).length === q.aliens.length) {
        setTimeout(() => onOutcome?.(mistakes === 0 ? 'right' : mistakes === 1 ? 'second' : 'missed'), 500);
      }
    } else {
      play('almost');
      setMistakes((m) => m + 1);
      setShake(i);
      setTimeout(() => setShake(null), 500);
      const shipLetters = familyText(ship).replace(/[⁰-⁹²³¹]/g, '');
      const alienLetters = familyText(fam).replace(/[⁰-⁹²³¹]/g, '');
      const text = [...shipLetters].sort().join() === [...alienLetters].sort().join()
        ? `Almost! Look at the exponents: ${fmt(alien.term, alien.order)} is in the ${familyText(fam)} family.`
        : `${fmt(alien.term, alien.order)} has different letters. Look only at the letters, not the number.`;
      setBubble({ ship, text });
    }
  };
  const { itemProps, zoneProps } = useDragDrop(drop, !locked);
  const left = q.aliens.map((a, i) => ({ a, i })).filter(({ i }) => placed[i] === undefined);

  return (
    <div className="board sort-board">
      <p className="board-ask">Drag each alien into its family’s spaceship.</p>
      <div className="alien-field">
        {left.map(({ a, i }) => (
          <div key={i} className={`draggable ${shake === i ? 'shake' : ''}`} {...itemProps(String(i))}>
            <Alien text={fmt(a.term, a.order)} colour={i} size={74} />
          </div>
        ))}
        {left.length === 0 && <div className="all-aboard">All aboard! 🚀</div>}
      </div>
      <div className="ships">
        {ships.map((s) => (
          <div key={s} className="ship" {...zoneProps(s)}>
            <div className="ship-dome">{q.aliens.map((a, i) => (placed[i] === s ? <span key={i} className="mini">{fmt(a.term, a.order)}</span> : null))}</div>
            <div className="ship-body">{familyText(s)}<small>family</small></div>
          </div>
        ))}
      </div>
      {bubble && <div className="hint-bubble pop-in">{bubble.text}</div>}
    </div>
  );
}
