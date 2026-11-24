// The tutor loop shared by all five games. It picks the next question at the right difficulty, shows a tip,
// and reacts to every answer like a patient tutor:
//   right → celebrate + say why;  first miss → specific hint, try again;
//   second miss → the rule, a moving demonstration and the answer, then a SIMILAR but different question.
// Two misses in a row on a concept → easier questions and a quick re-teach of the lesson.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Verdict } from '../content/check';
import { CONCEPTS, LEVELS } from '../content/levels';
import { generate } from '../content/questions';
import type { ConceptId, Level, Question, Stage, Tier } from '../content/types';
import { familyKey, familyText, fmt, fmtExpr } from '../math/term';
import { hintMode, nextConcept, record, stageDone, starsFor, type Outcome } from '../engine/adaptive';
import { award, BADGES, PLANETS, xpFor } from '../engine/rewards';
import type { Save } from '../engine/save';
import { ScanBoard, SortBoard } from './games/Aliens';
import { CookBoard, SpotBoard } from './games/Restaurant';
import { MixBoard } from './games/Lab';
import { FuelBoard } from './games/Rocket';
import { TowerBoard } from './games/Tower';
import type { BoardProps } from './games/types';
import { Lesson } from './Lesson';
import { play } from './sound';
import { VisualView } from './visuals/Visual';
import { Burst, Guide } from './widgets';

const CHEERS = ['Great discovery!', 'You’re getting it!', 'Brilliant!', 'Spot on!', 'Yes! Nailed it.', 'Super brain!'];
const ALMOST = ['Almost!', 'Let’s try another way.', 'So close!', 'Good try!'];
const pickOf = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];

/** The right answer, written out for the "let’s look at it together" panel. */
export function answerText(q: Question): string {
  switch (q.kind) {
    case 'scan': return `${fmt(q.term, q.order)}: coefficient ${String(q.term.c).replace('-', '−')}, ${q.order.map((l) => `${l} exponent ${q.term.v[l]}`).join(', ')}`;
    case 'sort': return q.families.map((f) => `${familyText(f)}: ${q.aliens.filter((a) => familyKey(a.term) === f).map((a) => fmt(a.term, a.order)).join(', ')}`).join('  ·  ');
    case 'spot': return q.options.filter((o) => familyKey(o.term) === familyKey(q.target)).map((o) => fmt(o.term, o.order)).join(', ');
    case 'cook': return `${q.expr} = ${fmtExpr(q.answer)}`;
    case 'mix': case 'fuel': return `${q.expr} = ${fmt(q.answer)}`;
    case 'tower':
      if (q.format === 'expr') return `${q.expr} = ${q.answerExpr}`;
      if (q.format === 'number') return String(q.answerNum).replace('-', '−');
      if (q.format === 'touch') return `The power touches: ${q.touched!.map((i) => q.pieces![i]).join(', ')}`;
      return q.correct!.map((i) => q.options![i]).join(',  ');
  }
}

function Board(props: BoardProps) {
  const { q } = props;
  switch (q.kind) {
    case 'scan': return <ScanBoard {...(props as BoardProps<typeof q>)} />;
    case 'sort': return <SortBoard {...(props as BoardProps<typeof q>)} />;
    case 'spot': return <SpotBoard {...(props as BoardProps<typeof q>)} />;
    case 'cook': return <CookBoard {...(props as BoardProps<typeof q>)} />;
    case 'mix': return <MixBoard {...(props as BoardProps<typeof q>)} />;
    case 'fuel': return <FuelBoard {...(props as BoardProps<typeof q>)} />;
    case 'tower': return <TowerBoard {...(props as BoardProps<typeof q>)} />;
  }
}

type Feedback =
  | { kind: 'right'; outcome: Outcome; xp: number; why: string; extra: string[] }
  | { kind: 'retry'; msg: string; hint: string }
  | { kind: 'shown'; q: Question; extra: string[] };

export interface PlayProps {
  level: Level;
  stage: Stage;
  save: Save;
  update: (fn: (s: Save) => void) => void;
  onExit: () => void;
  /** Called when the stage is mastered (levelDone = the whole world is finished). */
  onStageDone: (levelDone: boolean) => void;
  /** Practice mode after the journey: a mixed round of `practice` questions from every concept. */
  practice?: number;
  onPracticeDone?: (right: number, total: number) => void;
}

const levelOfConcept = (c: ConceptId) => LEVELS.find((l) => l.id === CONCEPTS[c].level)!;

export function Play({ level, stage, save, update, onExit, onStageDone, practice, onPracticeDone }: PlayProps) {
  const seen = useMemo(() => new Set(save.seen), []); // eslint-disable-line react-hooks/exhaustive-deps
  const lastConcept = useRef<ConceptId | undefined>(undefined);
  const practiceCount = useRef(0);
  const practiceRight = useRef(0);

  const makeQuestion = (concept?: ConceptId, tier?: Tier, confirm = false): { q: Question; confirm: boolean } | null => {
    let c: ConceptId | null | undefined = concept;
    if (!c) {
      if (practice) {
        const pool = Object.keys(CONCEPTS) as ConceptId[];
        const weak = pool.filter((id) => save.concepts[id].attempts > 0 && save.concepts[id].firstTry / save.concepts[id].attempts < 0.75);
        // Half the time, the concepts she finds hardest; otherwise anything.
        const from = weak.length && Math.random() < 0.5 ? weak : pool;
        c = from[Math.floor(Math.random() * from.length)];
      } else c = nextConcept(save, stage, lastConcept.current);
    }
    if (!c) return null;
    lastConcept.current = c;
    const t = tier ?? (practice ? Math.max(2, save.concepts[c].tier) as Tier : save.concepts[c].tier);
    const q = generate(c, t, Math.random, seen);
    seen.add(q.key);
    return { q, confirm };
  };

  const [cur, setCur] = useState(() => makeQuestion());
  const [attempt, setAttempt] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reteach, setReteach] = useState(false);
  const [rightCount, setRightCount] = useState(0);
  const [launch, setLaunch] = useState<string | null>(null);
  const [done, setDone] = useState<null | 'stage' | 'level'>(null);
  const [nextUp, setNextUp] = useState<{ concept: ConceptId; tier?: Tier; confirm: boolean } | null>(null);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  // If the stage was already done (e.g. opened again), finish straight away.
  useEffect(() => { if (!cur && !practice) onStageDone(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) return null;
  const { q } = cur;
  const qLevel = practice ? levelOfConcept(q.concept) : level;
  const tier = q.tier;
  const mode = hintMode(tier);
  // Lets the automatic journey test read the question it must answer (never in the published app).
  if (import.meta.env.MODE === 'test') (window as unknown as { __arcadeQ: Question }).__arcadeQ = q;

  const finishAnswer = (outcome: Outcome) => {
    const extra: string[] = [];
    let stageFinished = false;
    let levelFinished = false;
    let planetName: string | null = null;
    update((s) => {
      const change = record(s, q.concept, tier, outcome);
      const xp = xpFor(outcome, tier);
      s.xp += xp;
      s.answers++;
      s.seen = [...s.seen, q.key].slice(-400);
      const lv = s.levels[CONCEPTS[q.concept].level];
      lv.answers++;
      if (outcome === 'right') lv.firstTry++;
      if (outcome === 'hinted') lv.hints++;
      if (outcome === 'right' || outcome === 'hinted') { s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); } else s.streak = 0;
      if (cur.confirm && (outcome === 'right' || outcome === 'hinted')) { s.comebacks++; extra.push('💪 Comeback! You fixed it.'); }
      if (change.tierUp) extra.push('⬆️ Level up! Harder questions now.');
      if (change.tierDown) extra.push('Let’s make it a little easier for a moment.');
      if (change.mastered) extra.push(`🔓 You unlocked a new power: ${CONCEPTS[q.concept].can}!`);
      if (q.kind === 'fuel' && outcome !== 'missed' && (rightCount + 1) % 3 === 0 && s.planets < PLANETS.length) {
        planetName = PLANETS[s.planets].name;
        s.planets++;
        extra.push(`🪐 Rocket launched! New planet unlocked: ${planetName}`);
      }
      if (!practice && stageDone(s, stage) && !s.stagesDone.includes(stage.id)) {
        s.stagesDone.push(stage.id);
        stageFinished = true;
        const lvl = level.stages.every((st) => s.stagesDone.includes(st.id));
        if (lvl && !s.levels[level.id].done) {
          const L = s.levels[level.id];
          L.done = true;
          L.stars = starsFor(L.answers, L.firstTry);
          L.doneAt = new Date().toISOString();
          if (!s.friends.includes(level.friend.id)) s.friends.push(level.friend.id);
          levelFinished = true;
        }
      }
      const got = award(s);
      for (const b of got.badges) extra.push(`${b.emoji} Badge: ${b.name}`);
      for (const f of got.friends) extra.push(`${f.emoji} ${f.name} joined your crew!`);
      if (change.reteach && !stageFinished) setReteach(true);
      if (outcome === 'right' || outcome === 'hinted' || outcome === 'second') {
        setFeedback({ kind: 'right', outcome, xp, why: q.why, extra });
      } else {
        setFeedback({ kind: 'shown', q, extra });
      }
    });
    if (outcome !== 'missed') setRightCount((n) => n + 1);
    if (planetName) { setLaunch(planetName); setTimeout(() => setLaunch(null), 1600); }
    if (practice) { practiceCount.current++; if (outcome === 'right') practiceRight.current++; }
    play(outcome === 'missed' ? 'wrong' : levelFinished || stageFinished ? 'done' : 'right');
    if (stageFinished) setDone(levelFinished ? 'level' : 'stage');
    // A second try or a miss is always followed by a similar question on the same idea.
    setNextUp(outcome === 'second' || outcome === 'missed' ? { concept: q.concept, confirm: true } : null);
  };

  const onSubmit = (v: Verdict) => {
    if (feedback) return;
    if (v.unfinished) { setToast(v.msg ?? 'Not finished yet.'); play('almost'); return; }
    if (v.ok) { finishAnswer(attempt === 0 ? (usedHint ? 'hinted' : 'right') : 'second'); return; }
    if (attempt === 0) {
      play('almost');
      setAttempt(1);
      setFeedback({ kind: 'retry', msg: v.msg ?? 'Not quite.', hint: q.hint });
      return;
    }
    finishAnswer('missed');
  };

  const onOutcome = (o: 'right' | 'second' | 'missed') => finishAnswer(o === 'right' && usedHint ? 'hinted' : o);

  const next = () => {
    setFeedback(null);
    if (done) { onStageDone(done === 'level'); return; }
    if (practice && practiceCount.current >= practice) { onPracticeDone?.(practiceRight.current, practiceCount.current); return; }
    const nq = nextUp ? makeQuestion(nextUp.concept, nextUp.tier, nextUp.confirm) : makeQuestion();
    setNextUp(null);
    if (!nq) { onStageDone(false); return; }
    setCur(nq);
    setAttempt(0);
    setUsedHint(false);
    setShowHint(false);
  };

  if (reteach && !feedback) {
    return <Lesson level={qLevel} stage={qLevel.stages.find((s) => s.concepts.includes(q.concept)) ?? stage} recap onExit={onExit} onDone={() => { setReteach(false); next(); }} />;
  }

  // Progress towards finishing the stage.
  const conceptIds = practice ? [] : stage.concepts;
  const progressOf = (id: ConceptId) => {
    const c = save.concepts[id];
    if (c.mastered) return 1;
    return Math.min(0.95, (Math.min(c.firstTry, CONCEPTS[id].need) / CONCEPTS[id].need) * (c.tier3Right > 0 ? 1 : 0.85));
  };
  const progress = conceptIds.length ? conceptIds.reduce((s, id) => s + progressOf(id), 0) / conceptIds.length : practiceCount.current / (practice ?? 1);

  return (
    <div className={`screen play theme-${qLevel.theme}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">✕</button>
        <div className="progress-bar" aria-label={`Stage ${Math.round(progress * 100)}% done`}><i style={{ width: `${Math.max(4, progress * 100)}%` }} /></div>
        <span className="xp-pill">⚡ {save.xp}</span>
        {save.streak >= 3 && <span className="streak-pill">🔥 {save.streak}</span>}
      </header>
      <div className="play-head">
        <span className="world-tag">{qLevel.emoji} {practice ? 'Practice Arcade' : stage.title}</span>
        <span className={`tier t${tier}`} title="Difficulty">{'★'.repeat(tier)}{'☆'.repeat(3 - tier)}</span>
        {cur.confirm && <span className="confirm-tag">Similar one — show me you’ve got it!</span>}
      </div>

      {mode === 'shown' && attempt === 0 && <div className="tip">💡 {q.hint}</div>}
      {mode === 'button' && attempt === 0 && (
        showHint ? <div className="tip">💡 {q.hint}</div>
          : <button className="hint-btn" onClick={() => { setShowHint(true); setUsedHint(true); }}>💡 Hint</button>
      )}

      <Board key={q.key + (cur.confirm ? '#c' : '')} q={q} locked={!!feedback && feedback.kind !== 'retry'} onSubmit={onSubmit} onOutcome={onOutcome}
        rightCount={rightCount} progress={progress} planets={save.planets} />

      {launch && <div className="launch-overlay"><span className="rocket launch">🚀</span><b>{launch}</b></div>}
      {toast && <div className="toast pop-in">{toast}</div>}

      {feedback?.kind === 'retry' && (
        <div className="sheet retry pop-up" role="dialog" aria-label="Try again">
          <Guide mood="think" small />
          <div className="sheet-body">
            <h3>{pickOf(ALMOST)}</h3>
            <p>{feedback.msg}</p>
            {feedback.msg !== feedback.hint && <p className="soft">💡 {feedback.hint}</p>}
            <button className="btn primary wide" onClick={() => setFeedback(null)}>Try again</button>
          </div>
        </div>
      )}

      {feedback?.kind === 'right' && (
        <div className="sheet right pop-up" role="dialog" aria-label="Correct">
          <Burst />
          <Guide mood="cheer" small />
          <div className="sheet-body">
            <h3>{feedback.outcome === 'right' ? pickOf(CHEERS) : 'You got there!'} <span className="xp-gain">+{feedback.xp} XP</span></h3>
            <p>{feedback.why}</p>
            {feedback.extra.map((e) => <p key={e} className="extra pop-in">{e}</p>)}
            {done && <p className="extra big pop-in">{done === 'level' ? `🏆 ${level.world} complete!` : '🎉 Stage complete!'}</p>}
            <button className="btn primary wide" onClick={next}>{done ? 'Continue' : 'Next ▶'}</button>
          </div>
        </div>
      )}

      {feedback?.kind === 'shown' && (
        <div className="sheet shown pop-up" role="dialog" aria-label="Let’s look at it together">
          <div className="sheet-body">
            <h3>Let’s look at it together</h3>
            <div className="rule-box">💡 {feedback.q.rule}</div>
            <VisualView v={feedback.q.demo} />
            <p className="answer-line">Answer: <b>{answerText(feedback.q)}</b></p>
            <p>{feedback.q.why}</p>
            {feedback.extra.map((e) => <p key={e} className="extra">{e}</p>)}
            <button className="btn primary wide" onClick={next}>{done ? 'Continue' : 'Got it! Give me a similar one'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export { BADGES };
