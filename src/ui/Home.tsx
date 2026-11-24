// Home: the guide, where she is in the journey, one big PLAY button, her stars and XP. Nothing to choose.
import { LEVELS } from '../content/levels';
import { currentStage } from '../engine/adaptive';
import { rankOf } from '../engine/rewards';
import type { Save } from '../engine/save';
import { Guide, StarRow } from './widgets';

export function Home({ save, onPlay, onCollection, onParent, onToggleSound }: {
  save: Save; onPlay: () => void; onCollection: () => void; onParent: () => void; onToggleSound: () => void;
}) {
  const cur = currentStage(save);
  const stars = Object.values(save.levels).reduce((s, l) => s + l.stars, 0);
  const { rank, into, need } = rankOf(save.xp);
  const fresh = save.answers === 0 && save.lessonsSeen.length === 0;
  const lessonNew = cur && !save.lessonsSeen.includes(cur.stage.id);

  const say = fresh
    ? <>Hi! I’m your guide. We’ll explore five worlds and learn algebra by playing. Ready?</>
    : !cur
      ? <>You finished every world! 🏆 Keep your powers sharp in the Practice Arcade.</>
      : lessonNew
        ? <>Next up: <b>{cur.stage.title}</b> in <b>{cur.level.world}</b>. I’ll show you the new rule first.</>
        : <>Welcome back! Let’s keep going with <b>{cur.stage.title}</b>.</>;

  return (
    <div className="screen home">
      <div className="sky" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 70}%`, animationDelay: `${(i % 7) * 0.4}s` }} />)}</div>
      <header className="home-top">
        <div className="rank">
          <span className="rank-n">Lv {rank}</span>
          <span className="rank-bar"><i style={{ width: `${(into / need) * 100}%` }} /></span>
          <small>⚡ {save.xp} XP</small>
        </div>
        <button className="pill-btn" onClick={onCollection} aria-label="My collection">⭐ {stars} · 🏆 {save.badges.length}</button>
      </header>

      <h1 className="logo">Algebra <span>Arcade</span></h1>

      <Guide mood={fresh ? 'wave' : 'happy'}>{say}</Guide>

      <button className="btn play huge" onClick={onPlay}>
        ▶ PLAY
        <small>{cur ? `${cur.level.emoji} ${cur.level.game}` : '🕹️ Practice Arcade'}</small>
      </button>

      <ol className="journey" aria-label="Your journey">
        {LEVELS.map((l, i) => {
          const st = save.levels[l.id];
          const isCur = cur?.level.id === l.id;
          const locked = !st.done && !isCur;
          const stagesDone = l.stages.filter((s) => save.stagesDone.includes(s.id)).length;
          return (
            <li key={l.id} className={`world-node theme-${l.theme} ${st.done ? 'done' : ''} ${isCur ? 'current' : ''} ${locked ? 'locked' : ''}`} style={{ marginLeft: `${[0, 20, 5, 22, 8][i]}%` }}>
              <span className="node-emoji">{locked ? '🔒' : l.emoji}</span>
              <span className="node-text">
                <b>{i + 1}. {l.world}</b>
                {st.done ? <StarRow n={st.stars} /> : isCur ? <small>{stagesDone}/{l.stages.length} stages · you are here</small> : <small>{l.game}</small>}
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="home-foot">
        <button className="text-btn" onClick={onToggleSound}>{save.muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
        <button className="text-btn" onClick={onParent}>For grown-ups</button>
      </footer>
    </div>
  );
}
