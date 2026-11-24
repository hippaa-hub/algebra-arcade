// Celebrations, the collection room, and the parent view.
import { useEffect, useRef, useState } from 'react';
import { CONCEPTS, LEVELS } from '../content/levels';
import type { ConceptId, Level } from '../content/types';
import { needsPractice } from '../engine/adaptive';
import { BADGES, BONUS_FRIENDS, PLANETS } from '../engine/rewards';
import type { Save } from '../engine/save';
import { Burst, Guide, StarRow } from './widgets';

export function LevelDone({ level, save, onNext }: { level: Level; save: Save; onNext: () => void }) {
  const st = save.levels[level.id];
  const next = LEVELS.find((l) => l.id === level.id + 1);
  return (
    <div className={`screen celebrate theme-${level.theme}`}>
      <Burst n={60} />
      <div className="celebrate-card pop-in">
        <div className="trophy">{level.emoji}</div>
        <h1>{level.world}<br /><span>complete!</span></h1>
        <StarRow n={st.stars} big />
        <p className="soft">{st.firstTry} of {st.answers} right first time</p>
        <div className="friend-card pop-in"><span className="friend-emoji">{level.friend.emoji}</span><b>{level.friend.line}</b></div>
        <Guide mood="cheer" small>{next ? <>You unlocked a new world: <b>{next.world}</b>!</> : <>You beat the whole Algebra Arcade. Amazing work!</>}</Guide>
        <button className="btn play wide" onClick={onNext}>{next ? 'Onwards! ▶' : 'Home'}</button>
      </div>
    </div>
  );
}

export function PracticeDone({ right, total, onHome }: { right: number; total: number; onHome: () => void }) {
  return (
    <div className="screen celebrate theme-tower">
      <Burst />
      <div className="celebrate-card pop-in">
        <div className="trophy">🕹️</div>
        <h1>Practice round<br /><span>done!</span></h1>
        <p className="big-num">{right} / {total}</p>
        <p className="soft">right first time</p>
        <button className="btn play wide" onClick={onHome}>Home</button>
      </div>
    </div>
  );
}

export function Collection({ save, onBack }: { save: Save; onBack: () => void }) {
  const friends = [...LEVELS.map((l) => ({ ...l.friend, how: `Finish ${l.world}` })), ...BONUS_FRIENDS.map((f) => ({ ...f, how: `Reach ${f.xp} XP`, line: '' }))];
  return (
    <div className="screen collection">
      <header className="topbar"><button className="icon-btn" onClick={onBack} aria-label="Back">←</button><h2>My collection</h2><span /></header>
      <section>
        <h3>Crew</h3>
        <div className="grid">
          {friends.map((f) => {
            const has = save.friends.includes(f.id);
            return <div key={f.id} className={`collect-card ${has ? '' : 'locked'}`}><span className="c-emoji">{has ? f.emoji : '❔'}</span><b>{has ? f.name : '???'}</b><small>{f.how}</small></div>;
          })}
        </div>
      </section>
      <section>
        <h3>Badges</h3>
        <div className="grid">
          {BADGES.map((b) => {
            const has = save.badges.includes(b.id);
            return <div key={b.id} className={`collect-card ${has ? '' : 'locked'}`}><span className="c-emoji">{has ? b.emoji : '🔒'}</span><b>{b.name}</b><small>{b.how}</small></div>;
          })}
        </div>
      </section>
      <section>
        <h3>Planets</h3>
        <div className="grid">
          {PLANETS.map((p, i) => <div key={p.name} className={`collect-card ${i < save.planets ? '' : 'locked'}`}><span className="c-emoji">{i < save.planets ? p.emoji : '🔒'}</span><b>{p.name}</b><small>Exponent Rocket</small></div>)}
        </div>
      </section>
    </div>
  );
}

function fmtTime(sec: number) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Hold the button for two seconds: a small gate so the parent view never interrupts her game by accident. */
function HoldGate({ onOpen, onBack }: { onOpen: () => void; onBack: () => void }) {
  const [p, setP] = useState(0);
  const timer = useRef<number | null>(null);
  const start = () => { const t0 = Date.now(); timer.current = window.setInterval(() => { const x = (Date.now() - t0) / 2000; setP(x); if (x >= 1) { stop(); onOpen(); } }, 50); };
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setP(0); };
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="screen parent gate">
      <header className="topbar"><button className="icon-btn" onClick={onBack} aria-label="Back">←</button><h2>For grown-ups</h2><span /></header>
      <p>Press and hold the button for 2 seconds.</p>
      <button className="hold-btn" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
        <i style={{ width: `${Math.min(1, p) * 100}%` }} /><span>Hold to open</span>
      </button>
    </div>
  );
}

export function Parent({ save, onBack, onReset }: { save: Save; onBack: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!open) return <HoldGate onOpen={() => setOpen(true)} onBack={onBack} />;
  const weak = needsPractice(save);
  const mastered = (Object.keys(CONCEPTS) as ConceptId[]).filter((id) => save.concepts[id].mastered);
  const days = Object.entries(save.days).sort(([a], [b]) => b.localeCompare(a)).slice(0, 10);
  return (
    <div className="screen parent">
      <header className="topbar"><button className="icon-btn" onClick={onBack} aria-label="Back">←</button><h2>Progress report</h2><span /></header>
      <div className="stat-row">
        <div className="stat"><b>{LEVELS.filter((l) => save.levels[l.id].done).length}/5</b><small>worlds done</small></div>
        <div className="stat"><b>{mastered.length}/{Object.keys(CONCEPTS).length}</b><small>skills mastered</small></div>
        <div className="stat"><b>{save.answers}</b><small>questions</small></div>
        <div className="stat"><b>{fmtTime(save.timeSec)}</b><small>time learning</small></div>
      </div>

      <section className="card">
        <h3>Needs more practice</h3>
        {weak.length === 0 ? <p className="soft">Nothing stands out yet.</p>
          : <ul>{weak.map((id) => <li key={id}><b>{CONCEPTS[id].name}</b> — {Math.round((save.concepts[id].firstTry / save.concepts[id].attempts) * 100)}% right first time</li>)}</ul>}
        <p className="soft small">The game already gives easier questions and re-explains when she struggles; these are the topics to chat about.</p>
      </section>

      {LEVELS.map((l) => {
        const st = save.levels[l.id];
        const ids = l.stages.flatMap((s) => s.concepts);
        return (
          <section key={l.id} className="card">
            <h3>{l.emoji} {l.world} {st.done ? <StarRow n={st.stars} /> : <small className="soft">{ids.some((id) => save.concepts[id].attempts) ? 'in progress' : 'not started'}</small>}</h3>
            <p className="soft small">Time: {fmtTime(save.timeByLevel[l.id] ?? 0)} · hints used: {st.hints}</p>
            <table className="ptable">
              <thead><tr><th>Skill</th><th>Tries</th><th>Right 1st time</th><th>Level</th><th /></tr></thead>
              <tbody>{ids.map((id) => {
                const c = save.concepts[id];
                const acc = c.attempts ? Math.round((c.firstTry / c.attempts) * 100) : null;
                return (
                  <tr key={id}>
                    <td>{CONCEPTS[id].name}</td><td>{c.attempts}</td>
                    <td>{acc === null ? '—' : <span className={`acc ${acc >= 80 ? 'good' : acc >= 60 ? 'mid' : 'low'}`}>{acc}%</span>}</td>
                    <td>{'★'.repeat(c.tier)}</td><td>{c.mastered ? '✅' : weak.includes(id) ? '⚠️' : ''}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </section>
        );
      })}

      <section className="card">
        <h3>Days played</h3>
        {days.length === 0 ? <p className="soft">No time recorded yet.</p> : <ul>{days.map(([d, s]) => <li key={d}>{d}: {fmtTime(s)}</li>)}</ul>}
        <p className="soft small">Progress is saved only on this device and browser.</p>
      </section>

      <section className="card danger">
        {!confirm ? <button className="btn ghost" onClick={() => setConfirm(true)}>Start again from zero…</button> : (
          <><p>This deletes all progress, stars and badges on this device. It cannot be undone.</p>
            <div className="row-btns"><button className="btn ghost" onClick={() => setConfirm(false)}>Keep progress</button><button className="btn danger" onClick={onReset}>Delete everything</button></div></>
        )}
      </section>
    </div>
  );
}
