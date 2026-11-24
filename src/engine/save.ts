// Everything the game remembers, saved on this device only (localStorage). No account, nothing sent anywhere.
import { CONCEPTS } from '../content/levels';
import type { ConceptId, LevelId, Tier } from '../content/types';

export interface ConceptStat {
  attempts: number;   // questions answered (each question once)
  firstTry: number;   // right first time without a hint
  helped: number;     // right after a hint or a second try
  missed: number;     // wrong twice, then shown how
  tier: Tier;
  streak: number;     // right first time in a row
  missStreak: number; // missed in a row
  tier3Right: number;
  recent: boolean[];  // last answers, true = right first time
  mastered: boolean;
}

export interface LevelStat { done: boolean; stars: number; answers: number; firstTry: number; hints: number; doneAt?: string }

export interface Save {
  v: 1;
  xp: number;
  lessonsSeen: string[];
  stagesDone: string[];
  levels: Record<LevelId, LevelStat>;
  concepts: Record<ConceptId, ConceptStat>;
  badges: string[];
  friends: string[];
  planets: number;
  seen: string[];
  streak: number;
  bestStreak: number;
  comebacks: number;
  answers: number;
  timeSec: number;
  timeByLevel: Record<LevelId, number>;
  days: Record<string, number>;
  muted: boolean;
  startedAt: string;
  lastPlayed?: string;
}

const KEY = 'algebra-arcade-v1';

export const newConcept = (): ConceptStat => ({ attempts: 0, firstTry: 0, helped: 0, missed: 0, tier: 1, streak: 0, missStreak: 0, tier3Right: 0, recent: [], mastered: false });
const newLevel = (): LevelStat => ({ done: false, stars: 0, answers: 0, firstTry: 0, hints: 0 });

export function freshSave(): Save {
  return {
    v: 1, xp: 0, lessonsSeen: [], stagesDone: [],
    levels: { 1: newLevel(), 2: newLevel(), 3: newLevel(), 4: newLevel(), 5: newLevel() },
    concepts: Object.fromEntries(Object.keys(CONCEPTS).map((k) => [k, newConcept()])) as Record<ConceptId, ConceptStat>,
    badges: [], friends: [], planets: 0, seen: [], streak: 0, bestStreak: 0, comebacks: 0, answers: 0,
    timeSec: 0, timeByLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, days: {}, muted: false, startedAt: new Date().toISOString(),
  };
}

/** Reads a saved game; anything missing or broken is filled in from a fresh save, so an old save never crashes the app. */
export function revive(raw: unknown): Save {
  const base = freshSave();
  if (!raw || typeof raw !== 'object' || (raw as Save).v !== 1) return base;
  const s = raw as Partial<Save>;
  const out: Save = { ...base, ...s } as Save;
  out.levels = { ...base.levels };
  for (const id of [1, 2, 3, 4, 5] as LevelId[]) out.levels[id] = { ...base.levels[id], ...(s.levels?.[id] ?? {}) };
  out.concepts = { ...base.concepts };
  for (const id of Object.keys(base.concepts) as ConceptId[]) out.concepts[id] = { ...newConcept(), ...(s.concepts?.[id] ?? {}) };
  out.timeByLevel = { ...base.timeByLevel, ...(s.timeByLevel ?? {}) };
  for (const k of ['lessonsSeen', 'stagesDone', 'badges', 'friends', 'seen'] as const) if (!Array.isArray(out[k])) out[k] = [];
  return out;
}

export function load(): Save {
  try {
    const txt = localStorage.getItem(KEY);
    return txt ? revive(JSON.parse(txt)) : freshSave();
  } catch {
    return freshSave();
  }
}

export function store(s: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked (private mode): the game still works, it just will not remember.
  }
}

export function wipe(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to do */ }
}

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
