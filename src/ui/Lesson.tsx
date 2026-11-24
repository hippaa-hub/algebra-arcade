// A stage's lesson: a few short picture slides, then one worked example revealed step by step, then PLAY.
import { useState } from 'react';
import type { Level, Stage } from '../content/types';
import { VisualView } from './visuals/Visual';
import { Guide } from './widgets';

export function Lesson({ level, stage, onDone, onExit, recap }: { level: Level; stage: Stage; onDone: () => void; onExit: () => void; recap?: boolean }) {
  const slides = stage.slides;
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0);
  const onExample = i >= slides.length;
  const ex = stage.example;

  return (
    <div className={`screen lesson theme-${level.theme}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">✕</button>
        <div className="dots">{[...slides, null].map((_, j) => <i key={j} className={j === i ? 'on' : j < i ? 'done' : ''} />)}</div>
        <span className="world-tag">{level.emoji} {stage.title}</span>
      </header>

      {!onExample ? (
        <div className="lesson-card pop-in" key={i}>
          {i === 0 && <div className="lesson-kicker">{recap ? 'Quick reminder' : `New rule · ${level.world}`}</div>}
          <h2>{slides[i].title}</h2>
          {slides[i].visual && <VisualView v={slides[i].visual!} />}
          <p className="lesson-text">{slides[i].text}</p>
          {slides[i].rule && <div className="rule-box">💡 {slides[i].rule}</div>}
          <div className="lesson-nav">
            {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn primary" onClick={() => setI(i + 1)}>{i === slides.length - 1 ? 'See an example' : 'Next'}</button>
          </div>
        </div>
      ) : (
        <div className="lesson-card pop-in" key="ex">
          <div className="lesson-kicker">Watch me do one</div>
          <h2>{ex.title}</h2>
          <div className="worked-q">{ex.question}</div>
          <ol className="worked-steps">
            {ex.steps.slice(0, step).map((s, j) => (
              <li key={j} className="pop-in"><span>{s.say}</span><b>{s.show}</b></li>
            ))}
          </ol>
          {step >= ex.steps.length && <div className="worked-answer pop-in">✅ {ex.answer}</div>}
          <div className="lesson-nav">
            <button className="btn ghost" onClick={() => { setI(slides.length - 1); setStep(0); }}>Back</button>
            {step < ex.steps.length
              ? <button className="btn primary" onClick={() => setStep(step + 1)}>{step === 0 ? 'Show step 1' : 'Next step'}</button>
              : <button className="btn play" onClick={onDone}>{recap ? 'Back to the game' : `Play ${level.game}!`}</button>}
          </div>
          {step === 0 && <Guide mood="think" small>Try to work it out in your head first. Then tap to check each step.</Guide>}
        </div>
      )}
    </div>
  );
}
