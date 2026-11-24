import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { allStages, levelOf, LEVELS } from './content/levels';
import type { LevelId } from './content/types';
import { currentStage } from './engine/adaptive';
import { freshSave, load, store, today, wipe, type Save } from './engine/save';
import { Home } from './ui/Home';
import { Lesson } from './ui/Lesson';
import { Play } from './ui/Play';
import { Collection, LevelDone, Parent, PracticeDone } from './ui/Screens';
import { setMuted } from './ui/sound';

type Screen =
  | { s: 'home' } | { s: 'lesson'; stage: string } | { s: 'play'; stage: string } | { s: 'practice' }
  | { s: 'levelDone'; level: LevelId } | { s: 'practiceDone'; right: number; total: number }
  | { s: 'collection' } | { s: 'parent' };

// The practice arcade needs a stage object; it mixes every concept itself.
const PRACTICE_STAGE = LEVELS[4].stages[2];

export default function App() {
  const [save, setSave] = useState<Save>(() => load());
  const saveRef = useRef(save);
  const [screen, setScreen] = useState<Screen>({ s: 'home' });
  const lastInput = useRef(Date.now());

  useEffect(() => { setMuted(save.muted); }, [save.muted]);

  const update = (fn: (s: Save) => void) => {
    const s: Save = structuredClone(saveRef.current);
    fn(s);
    s.lastPlayed = new Date().toISOString();
    saveRef.current = s;
    setSave(s);
    store(s);
  };

  // Time spent learning: counted in lessons and games, only while the app is visible and she touched it in the last minute.
  useEffect(() => {
    const touch = () => { lastInput.current = Date.now(); };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    const id = setInterval(() => {
      const learning = screen.s === 'lesson' || screen.s === 'play' || screen.s === 'practice';
      if (!learning || document.hidden || Date.now() - lastInput.current > 60_000) return;
      const lv = currentStage(saveRef.current)?.level.id ?? 5;
      update((s) => { s.timeSec += 5; s.timeByLevel[lv] = (s.timeByLevel[lv] ?? 0) + 5; s.days[today()] = (s.days[today()] ?? 0) + 5; });
    }, 5000);
    return () => { clearInterval(id); window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch); };
  }, [screen.s]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  // The stage on screen is fixed when it opens, so finishing it shows its celebration before moving on.
  const pinned = screen.s === 'lesson' || screen.s === 'play' ? allStages().find((x) => x.stage.id === screen.stage) : undefined;
  const home = () => setScreen({ s: 'home' });

  const playNext = () => {
    const c = currentStage(saveRef.current);
    if (!c) { setScreen({ s: 'practice' }); return; }
    setScreen({ s: saveRef.current.lessonsSeen.includes(c.stage.id) ? 'play' : 'lesson', stage: c.stage.id });
  };

  let body: ReactNode = null;
  switch (screen.s) {
    case 'home':
      body = <Home save={save} onPlay={playNext} onCollection={() => setScreen({ s: 'collection' })} onParent={() => setScreen({ s: 'parent' })}
        onToggleSound={() => update((s) => { s.muted = !s.muted; })} />;
      break;
    case 'lesson':
      if (!pinned) break;
      body = <Lesson key={pinned.stage.id} level={pinned.level} stage={pinned.stage} onExit={home}
        onDone={() => { update((s) => { if (!s.lessonsSeen.includes(pinned.stage.id)) s.lessonsSeen.push(pinned.stage.id); }); setScreen({ s: 'play', stage: pinned.stage.id }); }} />;
      break;
    case 'play':
      if (!pinned) break;
      body = <Play key={pinned.stage.id} level={pinned.level} stage={pinned.stage} save={save} update={update} onExit={home}
        onStageDone={(levelDone) => (levelDone ? setScreen({ s: 'levelDone', level: pinned.level.id }) : playNext())} />;
      break;
    case 'practice':
      body = <Play key="practice" level={LEVELS[4]} stage={PRACTICE_STAGE} save={save} update={update} onExit={home} onStageDone={home}
        practice={10} onPracticeDone={(right, total) => setScreen({ s: 'practiceDone', right, total })} />;
      break;
    case 'levelDone':
      body = <LevelDone level={levelOf(screen.level)} save={save} onNext={home} />;
      break;
    case 'practiceDone':
      body = <PracticeDone right={screen.right} total={screen.total} onHome={home} />;
      break;
    case 'collection':
      body = <Collection save={save} onBack={home} />;
      break;
    case 'parent':
      body = <Parent save={save} onBack={home} onReset={() => { wipe(); const s = freshSave(); saveRef.current = s; setSave(s); store(s); home(); }} />;
      break;
  }
  return <Safe onHome={home}>{body}</Safe>;
}

/** If anything breaks, show a friendly screen instead of a blank page. Progress is already saved. */
class Safe extends Component<{ children: ReactNode; onHome: () => void }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: unknown) { console.error(e); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="screen home">
        <div className="celebrate-card">
          <h2>Oops — a glitch in the arcade!</h2>
          <p>Your progress is safe.</p>
          <button className="btn play wide" onClick={() => { this.setState({ err: false }); this.props.onHome(); }}>Back to home</button>
        </div>
      </div>
    );
  }
}
