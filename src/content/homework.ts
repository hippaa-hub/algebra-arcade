// Expressions from Adele's class homework sheets. She does those herself, so the app must never show them
// (the same list the Exam Prep maths pack keeps out). Every generated question is checked against this.
import { normalise } from '../math/algebra';

const HOMEWORK = [
  '3x × 4', '−2a × 5b', '−4m × (−3n)', '2p × 3p', '(−3x) × (2x²)', '(5a²b) × (−2ab)',
  'x⁴ × x³', '2a² × 5a⁴', '3m²n × (−2mn³)', '(−2p³) × (−3p²)', '2x²y³ × 4xy', '(3q)²', '3x² × 4x³',
  '5x + 2x − x', '7y − 3y + 2', '6a² + 2a − 3a²', '4m + 3n − 2m + n', '−5p + 2p + 7', '8x² − 3x + x² + 2x',
  '3x² + 5x²', '4ab + 7ba', '2x³ + 2x²', '3p²q + 6pq²',
];

const squash = (s: string) => normalise(s).replace(/[()]/g, '');

const BLOCKED = new Set(HOMEWORK.map(squash));

/** Also blocks the same product written the other way round (x³ × x⁴ for x⁴ × x³). */
export function isHomework(expr: string): boolean {
  const s = squash(expr);
  if (BLOCKED.has(s)) return true;
  const parts = s.split('*');
  if (parts.length === 2 && BLOCKED.has(`${parts[1]}*${parts[0]}`)) return true;
  return false;
}

export const HOMEWORK_LIST = HOMEWORK;
