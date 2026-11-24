// XP, badges and collectible friends. Rewards favour learning over rushing: getting it right after help
// still earns XP, and there is never a timer or a penalty.
import type { Tier } from '../content/types';
import type { Outcome } from './adaptive';
import type { Save } from './save';

export function xpFor(outcome: Outcome, tier: Tier): number {
  if (outcome === 'right') return 10 + (tier - 1) * 3;
  if (outcome === 'hinted') return 6;
  if (outcome === 'second') return 5;
  return 2; // she kept going and watched the explanation
}

export interface Badge { id: string; emoji: string; name: string; how: string; has: (s: Save) => boolean }

export const BADGES: Badge[] = [
  { id: 'first', emoji: '🌟', name: 'First Discovery', how: 'Get your first answer right', has: (s) => Object.values(s.concepts).some((c) => c.firstTry > 0) },
  { id: 'streak5', emoji: '🔥', name: 'On Fire', how: '5 right in a row', has: (s) => s.bestStreak >= 5 },
  { id: 'streak10', emoji: '☄️', name: 'Unstoppable', how: '10 right in a row', has: (s) => s.bestStreak >= 10 },
  { id: 'comeback', emoji: '💪', name: 'Comeback Kid', how: 'Get one right just after a mistake', has: (s) => s.comebacks >= 1 },
  { id: 'comeback5', emoji: '🧗', name: 'Never Give Up', how: '5 comebacks after mistakes', has: (s) => s.comebacks >= 5 },
  { id: 'l1', emoji: '👽', name: 'Alien Expert', how: 'Finish the Algebra Aliens', has: (s) => s.levels[1].done },
  { id: 'l2', emoji: '👩‍🍳', name: 'Head Chef', how: 'Finish the Algebra Restaurant', has: (s) => s.levels[2].done },
  { id: 'l3', emoji: '🧪', name: 'Sign Master', how: 'Finish the Sign Laboratory', has: (s) => s.levels[3].done },
  { id: 'l4', emoji: '🚀', name: 'Exponent Ace', how: 'Finish the Exponent Rocket', has: (s) => s.levels[4].done },
  { id: 'l5', emoji: '🏆', name: 'Tower Champion', how: 'Beat the Muddle Monster', has: (s) => s.levels[5].done },
  { id: 'stars3', emoji: '⭐', name: 'Superstar', how: 'Earn 3 stars in a world', has: (s) => Object.values(s.levels).some((l) => l.stars === 3) },
  { id: 'nohints', emoji: '🦉', name: 'Wise Owl', how: 'Finish a world without hints', has: (s) => Object.values(s.levels).some((l) => l.done && l.hints === 0) },
  { id: 'answers100', emoji: '💯', name: 'Hundred Club', how: 'Answer 100 questions', has: (s) => s.answers >= 100 },
  { id: 'xp1000', emoji: '💎', name: 'Diamond Brain', how: 'Collect 1000 XP', has: (s) => s.xp >= 1000 },
  { id: 'planets', emoji: '🪐', name: 'Space Explorer', how: 'Unlock 5 planets', has: (s) => s.planets >= 5 },
  { id: 'allstars', emoji: '👑', name: 'Algebra Royalty', how: '3 stars in every world', has: (s) => Object.values(s.levels).every((l) => l.stars === 3) },
];

/** Bonus friends that join at XP milestones (the five world friends join when a world is finished). */
export const BONUS_FRIENDS = [
  { id: 'bolt', name: 'Bolt the robot', emoji: '🤖', xp: 250 },
  { id: 'sparkle', name: 'Sparkle', emoji: '🦄', xp: 700 },
  { id: 'inky', name: 'Inky', emoji: '🐙', xp: 1300 },
  { id: 'comet', name: 'Comet the cat', emoji: '🐱', xp: 2000 },
];

export const PLANETS = [
  { name: 'Planet Squarea', emoji: '🪐' }, { name: 'Cubix', emoji: '🌕' }, { name: 'Exponia', emoji: '🌍' },
  { name: 'Powerton', emoji: '🌑' }, { name: 'Baseopolis', emoji: '🌞' }, { name: 'Indexia', emoji: '💫' }, { name: 'Star of Infinity', emoji: '⭐' },
];

/** Gives any newly earned badges and bonus friends. Returns what is new, to celebrate. */
export function award(s: Save): { badges: Badge[]; friends: typeof BONUS_FRIENDS } {
  const badges = BADGES.filter((b) => !s.badges.includes(b.id) && b.has(s));
  s.badges.push(...badges.map((b) => b.id));
  const friends = BONUS_FRIENDS.filter((f) => s.xp >= f.xp && !s.friends.includes(f.id));
  s.friends.push(...friends.map((f) => f.id));
  return { badges, friends };
}

/** Player level from XP (shown on Home): every level needs a little more. */
export function rankOf(xp: number): { rank: number; into: number; need: number } {
  let rank = 1;
  let need = 100;
  let left = xp;
  while (left >= need) { left -= need; rank++; need += 50; }
  return { rank, into: left, need };
}
