# Algebra Arcade

A Grade 7 algebra game in five worlds, for Adele, who missed the lessons on terms, like terms, multiplying
terms, the product rule and powers of brackets. It teaches from scratch: every rule is shown (picture slides +
a worked example) before it is practised, and the game acts as a patient tutor.

Same stack as Adele's other apps: React + Vite PWA, no login, nothing sent anywhere, progress saved on the
device (localStorage). The algebra checker (`src/math/algebra.ts`) and Adele's avatar come from `adele-exam-prep`.

```bash
npm install
npm run dev      # http://localhost:5223 (preview config "algebra-arcade")
npm test         # ~12,000 generated questions re-checked + a robot that plays the whole journey
npm run build    # dist/ (static, can go on GitHub Pages)
```

## The five worlds

| World | Game | Mechanic | Concepts |
|---|---|---|---|
| 1 Meet the Algebra Aliens | Alien Term Collector | scan an alien with steppers/tiles; drag aliens into family ships | parts, hidden 1s, families |
| 2 The Like-Terms Kingdom | Algebra Restaurant | pick matching jars; drag order cards onto plates and count; rush-hour typing | like terms, collecting |
| 3 The Multiplication Lab | Sign Laboratory | pour flasks, choose blue + / red − bottle, number, letters | sign rules, number × term, different letters |
| 4 Exponent Rocket | Exponent Rocket | fuel cells show powers as letter chains; 3 right = launch to a new planet | exponent meaning, product rule, coefficients, several letters |
| 5 The Power Tower | Final Boss Challenge | climb floors; tap what a power touches; areas; boss fight mixing everything | power of a bracket, 3x² vs (3x)², area, multi-step |

## How the tutor works (`src/ui/Play.tsx`, `src/engine/adaptive.ts`)

- Right → celebration, why it is right, XP.
- First miss → a specific nudge (e.g. "You multiplied the powers…", "Check the p plate: 2 + 5"), try again.
- Second miss → the rule, a moving demonstration, the answer, then a **similar but different** question.
- Each concept has 3 tiers. Right answers in a row move up; two misses in a row move down and replay the lesson.
- Hints: shown at tier 1, on a button at tier 2, none at tier 3.
- A concept is mastered only with several right-first-time answers, one at tier 3, and a good recent run
  (hints and second tries don't count), so guessing cannot get through.

## Layout

- `src/content/` — the educational content, separate from mechanics: `levels.ts` (worlds, stages, slides,
  worked examples, concepts), `questions/level1-5.ts` (question generators), `check.ts` (marking + mistake
  diagnosis), `homework.ts` (class homework expressions that must never appear).
- `src/engine/` — save/load, adaptive difficulty, XP/badges/friends/planets.
- `src/ui/` — Home, Lesson, Play (tutor loop), `games/*` (one board per world), `visuals/` (demonstrations),
  Screens (celebration, collection, parent view).

## Adding a new topic

1. Add concept ids to `ConceptId` and `CONCEPTS` (`content/types.ts`, `content/levels.ts`).
2. Write a generator `(rng, tier) => Question` and register it in `content/questions/index.ts`
   (reuse an existing question kind so an existing board shows it, or add a board in `ui/games`).
3. Add a stage (slides + worked example) to a world in `LEVELS`, or a new world.
4. `npm test` checks every generated answer two independent ways.

Parent view: "For grown-ups" on Home, hold the button for 2 seconds.
