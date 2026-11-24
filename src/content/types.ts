// The educational content, kept apart from the game mechanics: what each level teaches, the questions,
// and how each answer is explained. The games in src/ui/games only show these and collect her answers.
import type { Term } from '../math/term';

export type LevelId = 1 | 2 | 3 | 4 | 5;
export type Tier = 1 | 2 | 3;

export type ConceptId =
  | 'parts' | 'hidden' | 'families'          // Level 1
  | 'like' | 'collect'                        // Level 2
  | 'signs' | 'coef' | 'letters'              // Level 3
  | 'repeat' | 'product' | 'coefpow' | 'multivar' // Level 4
  | 'bracket' | 'insideout' | 'area' | 'boss'; // Level 5

export interface ConceptInfo {
  id: ConceptId;
  level: LevelId;
  name: string;          // for the parent view and badges
  can: string;           // "I can …" in Adele's words
  /** Right first-try answers needed, including at least one at tier 3. */
  need: number;
  /** Right answers in a row that move her up a tier. */
  tierUp: number;
}

/** What a picture in a lesson or a demonstration shows. Drawn by src/ui/visuals. */
export type Visual =
  | { v: 'anatomy'; term: Term; showHidden?: boolean }
  | { v: 'mystery' }
  | { v: 'family'; terms: Term[]; orders?: (string[] | undefined)[] }
  | { v: 'compare'; a: Term; b: Term; orderA?: string[]; orderB?: string[] }
  | { v: 'collect'; terms: Term[] }
  | { v: 'fruit'; groups: { emoji: string; n: number }[]; result?: string }
  | { v: 'signline'; a: number; b: number }
  | { v: 'signtable' }
  | { v: 'expand'; factors: Term[] }
  | { v: 'chain'; letter: string; n: number; coef?: number }
  | { v: 'copies'; inner: Term; n: number }
  | { v: 'touch'; text: string; squared: string[] }
  | { v: 'area'; w: Term; h: Term };

export interface Slide {
  title: string;
  /** One or two short sentences. */
  text: string;
  visual?: Visual;
  /** A one-line "remember" box. */
  rule?: string;
}

export interface WorkedStep { say: string; show: string }
export interface WorkedExample { title: string; question: string; steps: WorkedStep[]; answer: string }

export interface Stage {
  id: string;
  title: string;
  concepts: ConceptId[];
  slides: Slide[];
  example: WorkedExample;
  /** The game mode used for this stage. */
  mode: string;
}

export interface Level {
  id: LevelId;
  world: string;        // "Meet the Algebra Aliens"
  game: string;         // "Alien Term Collector"
  emoji: string;
  blurb: string;
  theme: 'space' | 'kitchen' | 'lab' | 'rocket' | 'tower';
  stages: Stage[];
  /** The friend she collects when the level is done. */
  friend: { id: string; name: string; emoji: string; line: string };
}

// ---- Questions ------------------------------------------------------------

interface QBase {
  /** Same key = same question; used so she does not see the same one again soon. */
  key: string;
  concept: ConceptId;
  tier: Tier;
  /** A small nudge, shown on request or after a first miss. */
  hint: string;
  /** Why the right answer is right, shown after she answers. */
  why: string;
  /** The rule in plain words, shown with the demonstration after a second miss. */
  rule: string;
  demo: Visual;
}

/** Level 1: scan an alien and read its coefficient, letters and exponents. */
export interface ScanQ extends QBase {
  kind: 'scan';
  term: Term;
  /** The letters in the order they are written on the alien. */
  order: string[];
  /** Which readings she must give. */
  ask: { coef: boolean; letters: boolean; exps: boolean };
  /** Letter tiles offered (the right ones and a couple of others). */
  letterChoices: string[];
}

/** Level 1: drag aliens into the spaceship of their family. */
export interface SortQ extends QBase {
  kind: 'sort';
  families: string[];   // family keys, one ship each
  aliens: { term: Term; order: string[] }[];
}

/** Level 2: pick every ingredient that matches the order card. */
export interface SpotQ extends QBase {
  kind: 'spot';
  target: Term;
  targetOrder: string[];
  options: { term: Term; order: string[] }[];
}

/** Level 2: an order to cook. */
export interface CookQ extends QBase {
  kind: 'cook';
  terms: { term: Term; order: string[] }[];
  /** 'picture': ingredients drawn as food; 'plates': letters on plates; 'type': type the finished order. */
  mode: 'picture' | 'plates' | 'type';
  answer: Term[];
  /** The expression as text, for checking typed answers. */
  expr: string;
}

/** Level 3: mix potions (multiply) and label the result. */
export interface MixQ extends QBase {
  kind: 'mix';
  factors: Term[];
  answer: Term;
  expr: string;
}

/** Level 4: rocket fuel. */
export interface FuelQ extends QBase {
  kind: 'fuel';
  /** 'count': write a chain like x·x·x as a power; 'expand': load cells for a power; 'merge': multiply. */
  mode: 'count' | 'expand' | 'merge';
  factors: Term[];
  answer: Term;
  /** Show the fuel cells (repeated letters) on the question. */
  cells: boolean;
  expr: string;
}

/** Level 5 and the boss: a tower floor. */
export interface TowerQ extends QBase {
  kind: 'tower';
  /** 'expr': type an expression; 'number': type a number; 'touch': tap what the power touches; 'pick': tap the right ones. */
  format: 'expr' | 'number' | 'touch' | 'pick';
  prompt: string;
  /** The expression to work out (for 'expr'), checked by value and simplest form. */
  expr?: string;
  answerExpr?: string;
  answerNum?: number;
  /** For 'touch': the pieces of the term, and which of them the power touches. */
  pieces?: string[];
  touched?: number[];
  power?: string;
  /** For 'pick': options and which are right. */
  options?: string[];
  correct?: number[];
  /** A rectangle to draw (area questions). */
  rect?: { w: Term; h: Term; second?: { w: Term; h: Term } };
  /** Which earlier skill this boss question checks. */
  from?: ConceptId;
  letters: string[];
}

export type Question = ScanQ | SortQ | SpotQ | CookQ | MixQ | FuelQ | TowerQ;

export type Rng = () => number;
