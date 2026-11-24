// Small building blocks shared by every world: the guide, number and maths keypads, steppers, the alien.
import { useEffect, useState } from 'react';
import cheer from '../assets/adele-cheer.webp';
import happy from '../assets/adele-happy.webp';
import think from '../assets/adele-think.webp';
import wave from '../assets/adele-wave.webp';

export type Mood = 'wave' | 'happy' | 'think' | 'cheer';
const FACES: Record<Mood, string> = { wave, happy, think, cheer };

/** Adele's own avatar as the guide, with a speech bubble. */
export function Guide({ mood = 'happy', children, small }: { mood?: Mood; children?: React.ReactNode; small?: boolean }) {
  return (
    <div className={`guide ${small ? 'small' : ''}`}>
      <img className={`guide-face mood-${mood}`} src={FACES[mood]} alt="" />
      {children && <div className="bubble">{children}</div>}
    </div>
  );
}

export function Stepper({ value, onChange, min = -99, max = 99, label, disabled }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; disabled?: boolean;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`${label} down`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite">{String(value).replace('-', '−')}</output>
      <button type="button" aria-label={`${label} up`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

/** A number pad with a ± key. `value` is the text typed so far. */
export function NumberPad({ value, onChange, allowMinus = true, disabled }: { value: string; onChange: (s: string) => void; allowMinus?: boolean; disabled?: boolean }) {
  const press = (k: string) => {
    if (disabled) return;
    if (k === '±') onChange(value.startsWith('−') ? value.slice(1) : `−${value}`);
    else if (k === '⌫') onChange(value.slice(0, -1));
    else if (value.replace('−', '').length < 4) onChange(value + k);
  };
  return (
    <div className="numpad">
      {['7', '8', '9', '4', '5', '6', '1', '2', '3', allowMinus ? '±' : '', '0', '⌫'].map((k, i) => (
        k ? <button key={k} type="button" className={k === '⌫' || k === '±' ? 'fn' : ''} aria-label={k === '⌫' ? 'Delete' : k === '±' ? 'Change sign' : k} onClick={() => press(k)} disabled={disabled}>{k}</button> : <span key={`blank-${i}`} />
      ))}
    </div>
  );
}

export const padNumber = (s: string): number | null => (s.replace('−', '') === '' ? null : Number(s.replace('−', '-')));

/** The maths keypad for typing whole expressions (from the Exam Prep app), with its own display. */
export function ExprPad({ value, onChange, letters, disabled }: { value: string; onChange: (s: string) => void; letters: string[]; disabled?: boolean }) {
  const add = (k: string) => { if (!disabled && value.length < 40) onChange(value + k); };
  const key = (k: string, label = k, cls = '', aria = label) => (
    <button key={`${k}-${label}`} type="button" className={`mkey ${cls}`} aria-label={aria} onClick={() => add(k)} disabled={disabled}>{label}</button>
  );
  return (
    <div className="exprpad">
      <div className="expr-display" aria-live="polite">{value ? value.replace(/-/g, '−').replace(/\+/g, ' + ').replace(/−/g, ' − ').replace(/^ − /, '−') : <span className="placeholder">type your answer</span>}<span className="caret" /></div>
      <div className="mrow">{letters.map((l) => key(l, l, 'letter'))}</div>
      <div className="mrow powers"><span className="row-label">power</span>
        {['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'].map((p, i) => key(p, p, 'power', `power digit ${i}`))}
      </div>
      <div className="mgrid">
        {key('7')}{key('8')}{key('9')}{key('+', '+', 'op', 'plus')}
        {key('4')}{key('5')}{key('6')}{key('−', '−', 'op', 'minus')}
        {key('1')}{key('2')}{key('3')}
        <button type="button" className="mkey fn" aria-label="Delete" onClick={() => !disabled && onChange(value.slice(0, -1))} disabled={disabled}>⌫</button>
        <button type="button" className="mkey fn" onClick={() => !disabled && onChange('')} disabled={disabled}>Clear</button>
        {key('0', '0', 'zero')}
      </div>
    </div>
  );
}

const ALIEN_COLOURS = ['#7cf29c', '#ff8bd1', '#ffd36b', '#7ec8ff', '#c49bff', '#ff9f6b', '#6bf0e0'];

/** An original cartoon alien that carries a term on its belly. */
export function Alien({ text, colour = 0, size = 96, mood = 'happy' }: { text: string; colour?: number; size?: number; mood?: 'happy' | 'wow' | 'sad' }) {
  const c = ALIEN_COLOURS[colour % ALIEN_COLOURS.length];
  return (
    <div className="alien" style={{ width: size }}>
      <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true">
        <line x1="35" y1="22" x2="28" y2="6" stroke={c} strokeWidth="4" strokeLinecap="round" />
        <line x1="65" y1="22" x2="72" y2="6" stroke={c} strokeWidth="4" strokeLinecap="round" />
        <circle cx="28" cy="6" r="5" fill="#fff6" stroke={c} strokeWidth="3" />
        <circle cx="72" cy="6" r="5" fill="#fff6" stroke={c} strokeWidth="3" />
        <ellipse cx="50" cy="66" rx="42" ry="42" fill={c} />
        <ellipse cx="50" cy="70" rx="30" ry="22" fill="#ffffffd0" />
        <ellipse cx="36" cy="38" rx="9" ry="10" fill="#fff" />
        <ellipse cx="64" cy="38" rx="9" ry="10" fill="#fff" />
        <circle cx={mood === 'sad' ? 36 : 38} cy={mood === 'sad' ? 41 : 39} r="4.5" fill="#23173f" />
        <circle cx={mood === 'sad' ? 64 : 66} cy={mood === 'sad' ? 41 : 39} r="4.5" fill="#23173f" />
        {mood === 'wow' ? <ellipse cx="50" cy="50" rx="4" ry="3" fill="#23173f" /> : null}
        <ellipse cx="16" cy="92" rx="9" ry="6" fill={c} />
        <ellipse cx="84" cy="92" rx="9" ry="6" fill={c} />
      </svg>
      <span className="alien-term">{text}</span>
    </div>
  );
}

/** A burst of confetti for celebrations; disappears by itself. */
export function Burst({ n = 26 }: { n?: number }) {
  const [bits] = useState(() => Array.from({ length: n }, (_, i) => ({
    i, x: Math.random() * 100, d: Math.random() * 0.4, r: Math.random() * 360, c: ['#ffd23f', '#ff5fa2', '#4fd1ff', '#7cf29c', '#b78bff'][i % 5],
  })));
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 1800); return () => clearTimeout(t); }, []);
  if (!on) return null;
  return (
    <div className="burst" aria-hidden="true">
      {bits.map((b) => <i key={b.i} style={{ left: `${b.x}%`, animationDelay: `${b.d}s`, background: b.c, transform: `rotate(${b.r}deg)` }} />)}
    </div>
  );
}

export function StarRow({ n, of = 3, big }: { n: number; of?: number; big?: boolean }) {
  return <span className={`stars ${big ? 'big' : ''}`} aria-label={`${n} of ${of} stars`}>{Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? 'on' : 'off'}>★</span>)}</span>;
}
