import { describe, expect, it } from 'vitest';
import { LEVELS } from '../content/levels';
import { isMastered, nextConcept, record, starsFor } from './adaptive';
import { award, rankOf } from './rewards';
import { freshSave, revive } from './save';

describe('adaptive difficulty', () => {
  it('moves up a tier after right answers in a row, and down with a re-teach after two misses', () => {
    const s = freshSave();
    expect(record(s, 'signs', 1, 'right').tierUp).toBe(false);
    expect(record(s, 'signs', 1, 'right').tierUp).toBe(true);
    expect(s.concepts.signs.tier).toBe(2);
    expect(record(s, 'signs', 2, 'missed').reteach).toBe(false);
    const c = record(s, 'signs', 2, 'missed');
    expect(c.reteach).toBe(true);
    expect(c.tierDown).toBe(true);
    expect(s.concepts.signs.tier).toBe(1);
  });

  it('does not count hints or second tries as proof', () => {
    const s = freshSave();
    for (let i = 0; i < 20; i++) record(s, 'like', 1, i % 2 ? 'hinted' : 'second');
    expect(s.concepts.like.mastered).toBe(false);
    expect(s.concepts.like.tier).toBe(1);
  });

  it('needs right answers at the hardest tier and a good recent run', () => {
    const s = freshSave();
    for (let i = 0; i < 4; i++) record(s, 'collect', s.concepts.collect.tier, 'right');
    // tier went up, but nothing was right at tier 3 yet
    expect(s.concepts.collect.tier).toBe(3);
    expect(isMastered(s.concepts.collect, 'collect')).toBe(false);
    record(s, 'collect', 3, 'missed');
    record(s, 'collect', 3, 'missed');
    expect(s.concepts.collect.mastered).toBe(false);
    record(s, 'collect', 2, 'right');
    record(s, 'collect', 2, 'right');
    record(s, 'collect', 3, 'right');
    expect(s.concepts.collect.mastered).toBe(true);
  });

  it('a pure guesser (1 in 4 right) does not get through a stage in a normal session', () => {
    const s = freshSave();
    let n = 0;
    const stage = LEVELS[1].stages[1];
    for (; n < 60 && nextConcept(s, stage); n++) {
      const c = nextConcept(s, stage)!;
      record(s, c, s.concepts[c].tier, n % 4 === 0 ? 'right' : 'missed');
    }
    expect(s.concepts.collect.mastered).toBe(false);
  });

  it('takes turns between the concepts of a stage', () => {
    const s = freshSave();
    const stage = LEVELS[0].stages[0];
    const a = nextConcept(s, stage)!;
    expect(nextConcept(s, stage, a)).not.toBe(a);
  });
});

describe('rewards and saving', () => {
  it('gives stars from first-time accuracy', () => {
    expect(starsFor(20, 18)).toBe(3);
    expect(starsFor(20, 14)).toBe(2);
    expect(starsFor(20, 8)).toBe(1);
  });
  it('awards badges once', () => {
    const s = freshSave();
    record(s, 'parts', 1, 'right');
    expect(award(s).badges.map((b) => b.id)).toContain('first');
    expect(award(s).badges).toHaveLength(0);
  });
  it('ranks grow with XP', () => {
    expect(rankOf(0).rank).toBe(1);
    expect(rankOf(100).rank).toBe(2);
    expect(rankOf(1000).rank).toBeGreaterThan(4);
  });
  it('revives old or broken saves without crashing', () => {
    expect(revive(null).xp).toBe(0);
    expect(revive({ v: 1, xp: 50, concepts: { parts: { tier: 2 } } }).concepts.parts.tier).toBe(2);
    expect(revive({ v: 1, xp: 50 }).concepts.boss.tier).toBe(1);
    expect(revive('garbage').levels[3].done).toBe(false);
  });
});
