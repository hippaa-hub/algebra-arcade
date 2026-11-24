import type { ConceptId, Question, Rng, Tier } from '../types';
import { scanHidden, scanParts, sortFamilies } from './level1';
import { cookOrder, spotLike } from './level2';
import { mixCoef, mixLetters, mixSigns } from './level3';
import { fuelCoefPow, fuelMultivar, fuelProduct, fuelRepeat } from './level4';
import { towerArea, towerBoss, towerBracket, towerInsideOut } from './level5';

export const GENERATORS: Record<ConceptId, (r: Rng, tier: Tier) => Question> = {
  parts: scanParts,
  hidden: scanHidden,
  families: sortFamilies,
  like: spotLike,
  collect: cookOrder,
  signs: mixSigns,
  coef: mixCoef,
  letters: mixLetters,
  repeat: fuelRepeat,
  product: fuelProduct,
  coefpow: fuelCoefPow,
  multivar: fuelMultivar,
  bracket: towerBracket,
  insideout: towerInsideOut,
  area: towerArea,
  boss: towerBoss,
};

/** A new question for a concept, avoiding the keys she has seen recently when possible. */
export function generate(concept: ConceptId, tier: Tier, r: Rng, avoid: Set<string> = new Set()): Question {
  let q = GENERATORS[concept](r, tier);
  for (let i = 0; i < 30 && avoid.has(q.key); i++) q = GENERATORS[concept](r, tier);
  return q;
}
