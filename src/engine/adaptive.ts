// The tutor's memory: how each answer changes the difficulty (tier) of a concept, and when a concept is mastered.
// A concept is mastered only with evidence: several different questions right first time, at least one at the
// hardest tier, and most of the latest ones right — so guessing cannot get her through.
import { CONCEPTS, LEVELS } from '../content/levels';
import type { ConceptId, Stage, Tier } from '../content/types';
import type { ConceptStat, Save } from './save';

/** How a question went. */
export type Outcome =
  | 'right'    // right first time, no hint
  | 'hinted'   // right first time after asking for a hint
  | 'second'   // wrong, then right on the second try
  | 'missed';  // wrong twice; she was shown how

export interface Change { tierUp: boolean; tierDown: boolean; mastered: boolean; reteach: boolean }

export function isMastered(c: ConceptStat, id: ConceptId): boolean {
  const info = CONCEPTS[id];
  const last = c.recent.slice(-3);
  return c.firstTry >= info.need && c.tier3Right >= 1 && last.filter(Boolean).length >= Math.min(2, last.length);
}

/** Records one answer for a concept. Returns what changed, so the game can react (level up, re-teach…). */
export function record(save: Save, id: ConceptId, tier: Tier, outcome: Outcome): Change {
  const c = save.concepts[id];
  const info = CONCEPTS[id];
  const change: Change = { tierUp: false, tierDown: false, mastered: false, reteach: false };
  c.attempts++;
  c.recent = [...c.recent, outcome === 'right'].slice(-8);
  if (outcome === 'right') {
    c.firstTry++;
    c.streak++;
    c.missStreak = 0;
    if (tier === 3) c.tier3Right++;
    // Only answers at her current tier move her up (a confirmation question at a lower tier does not).
    if (c.streak >= info.tierUp && c.tier < 3 && tier >= c.tier) {
      c.tier = (c.tier + 1) as Tier;
      c.streak = 0;
      change.tierUp = true;
    }
  } else if (outcome === 'hinted' || outcome === 'second') {
    c.helped++;
    c.streak = 0;
    c.missStreak = 0;
  } else {
    c.missed++;
    c.streak = 0;
    c.missStreak++;
    if (c.missStreak >= 2) {
      change.reteach = true;
      c.missStreak = 0;
      if (c.tier > 1) { c.tier = (c.tier - 1) as Tier; change.tierDown = true; }
    }
  }
  if (!c.mastered && isMastered(c, id)) {
    c.mastered = true;
    change.mastered = true;
  }
  return change;
}

/** How much help to show before she answers: tier 1 shows the tip, tier 2 offers a hint button, tier 3 none. */
export function hintMode(tier: Tier): 'shown' | 'button' | 'none' {
  return tier === 1 ? 'shown' : tier === 2 ? 'button' : 'none';
}

/** The next concept to practise in a stage: the unmastered one with the least evidence so far, taking turns. */
export function nextConcept(save: Save, stage: Stage, last?: ConceptId): ConceptId | null {
  const open = stage.concepts.filter((id) => !save.concepts[id].mastered);
  if (open.length === 0) return null;
  if (open.length === 1) return open[0];
  const others = open.filter((id) => id !== last);
  const pool = others.length ? others : open;
  return pool.reduce((best, id) => (save.concepts[id].firstTry < save.concepts[best].firstTry ? id : best), pool[0]);
}

export const stageDone = (save: Save, stage: Stage) => stage.concepts.every((id) => save.concepts[id].mastered);

/** Where the journey is: the first stage not finished. Null when everything is done. */
export function currentStage(save: Save) {
  for (const level of LEVELS) for (const stage of level.stages) if (!save.stagesDone.includes(stage.id)) return { level, stage };
  return null;
}

/** Stars for a level from how often she was right first time: 3 ≥ 85%, 2 ≥ 65%, otherwise 1. */
export function starsFor(answers: number, firstTry: number): number {
  if (answers === 0) return 1;
  const p = firstTry / answers;
  return p >= 0.85 ? 3 : p >= 0.65 ? 2 : 1;
}

/** Concepts with enough answers to judge and a first-try accuracy below 70%: the parent view lists them. */
export function needsPractice(save: Save): ConceptId[] {
  return (Object.keys(save.concepts) as ConceptId[]).filter((id) => {
    const c = save.concepts[id];
    return c.attempts >= 4 && c.firstTry / c.attempts < 0.7;
  });
}
