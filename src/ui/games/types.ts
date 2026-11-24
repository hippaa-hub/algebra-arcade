import type { Verdict } from '../../content/check';
import type { Question } from '../../content/types';

export interface BoardProps<Q extends Question = Question> {
  q: Q;
  /** True while the tutor's feedback is open. */
  locked: boolean;
  /** Sends a checked answer to the tutor. */
  onSubmit: (v: Verdict) => void;
  /** For boards that judge a whole round themselves (sorting): how it went. */
  onOutcome?: (o: 'right' | 'second' | 'missed') => void;
  /** Right answers so far in this visit, for scene animations (fuel, tower floors). */
  rightCount: number;
  /** 0–1: how close the stage is to done (the boss's health bar uses it). */
  progress: number;
  planets: number;
}
