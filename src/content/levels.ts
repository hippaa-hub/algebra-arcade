// The learning journey: five worlds, each split into short stages. Every stage explains its rule (slides),
// shows one worked example, and only then plays the game for it. Text is written for a 12-year-old:
// short sentences, one idea each.
import { term } from '../math/term';
import type { ConceptId, ConceptInfo, Level, LevelId } from './types';

export const CONCEPTS: Record<ConceptId, ConceptInfo> = {
  parts: { id: 'parts', level: 1, name: 'Parts of a term', can: 'I can find the coefficient, variable and exponent', need: 4, tierUp: 2 },
  hidden: { id: 'hidden', level: 1, name: 'Invisible 1s', can: 'I know x means 1x¹ and −x means −1x', need: 4, tierUp: 2 },
  families: { id: 'families', level: 1, name: 'Term families', can: 'I can sort terms into families', need: 3, tierUp: 1 },
  like: { id: 'like', level: 2, name: 'Spotting like terms', can: 'I can spot like terms', need: 4, tierUp: 2 },
  collect: { id: 'collect', level: 2, name: 'Collecting like terms', can: 'I can collect like terms', need: 4, tierUp: 2 },
  signs: { id: 'signs', level: 3, name: 'Sign rules', can: 'I know the four sign rules', need: 5, tierUp: 2 },
  coef: { id: 'coef', level: 3, name: 'Number × term', can: 'I can multiply a term by a number', need: 4, tierUp: 2 },
  letters: { id: 'letters', level: 3, name: 'Different letters', can: 'I can multiply terms with different letters', need: 4, tierUp: 2 },
  repeat: { id: 'repeat', level: 4, name: 'What an exponent means', can: 'I know an exponent is repeated multiplication', need: 4, tierUp: 2 },
  product: { id: 'product', level: 4, name: 'Product rule', can: 'I add exponents when I multiply the same base', need: 4, tierUp: 2 },
  coefpow: { id: 'coefpow', level: 4, name: 'Numbers and powers', can: 'I multiply numbers and add exponents', need: 4, tierUp: 2 },
  multivar: { id: 'multivar', level: 4, name: 'Several letters', can: 'I can multiply terms with several letters', need: 4, tierUp: 2 },
  bracket: { id: 'bracket', level: 5, name: 'Power of a bracket', can: 'I can square a whole bracket', need: 4, tierUp: 2 },
  insideout: { id: 'insideout', level: 5, name: 'What the power touches', can: 'I know 3x² is not (3x)²', need: 4, tierUp: 2 },
  area: { id: 'area', level: 5, name: 'Areas with algebra', can: 'I can find areas with algebraic sides', need: 3, tierUp: 1 },
  boss: { id: 'boss', level: 5, name: 'Everything together', can: 'I can solve multi-step problems', need: 8, tierUp: 2 },
};

export const LEVELS: Level[] = [
  {
    id: 1, world: 'Meet the Algebra Aliens', game: 'Alien Term Collector', emoji: '👽', theme: 'space',
    blurb: 'Aliens are landing! Each one wears an algebra term. Learn to read them.',
    friend: { id: 'zib', name: 'Zib', emoji: '👽', line: 'Zib the alien joins your crew!' },
    stages: [
      {
        id: '1a', title: 'Read an alien', mode: 'scan', concepts: ['parts', 'hidden'],
        slides: [
          { title: 'A letter is a mystery number', text: 'A variable is a letter that stands for a number we do not know yet. Think of it as a mystery box.', visual: { v: 'mystery' } },
          { title: 'Three parts of a term', text: 'In 5x³ the number 5 is the coefficient. x is the variable. The small raised 3 is the exponent.', visual: { v: 'anatomy', term: term(5, { x: 3 }) }, rule: 'coefficient · variable · exponent' },
          { title: 'The sign belongs to the number', text: 'In −4y² the coefficient is −4, not 4. The minus sign sticks to the number.', visual: { v: 'anatomy', term: term(-4, { y: 2 }) } },
          { title: 'Invisible 1s', text: 'No number in front? It is 1. No exponent? It is 1. So m means 1m¹.', visual: { v: 'anatomy', term: term(1, { m: 1 }), showHidden: true }, rule: 'm = 1m¹' },
          { title: '1 and −1 are different', text: 'k means 1k. But −k means −1k. The minus alone is a coefficient of −1.', visual: { v: 'anatomy', term: term(-1, { k: 2 }), showHidden: true }, rule: '−k = −1k' },
        ],
        example: {
          title: 'Scan this alien', question: '−a²b',
          steps: [
            { say: 'Look in front of the letters. There is only a minus sign.', show: 'coefficient = −1' },
            { say: 'The letters are the variables.', show: 'variables = a and b' },
            { say: 'a has a small 2. b has nothing, so its exponent is an invisible 1.', show: 'a → 2,  b → 1' },
          ],
          answer: '−a²b = −1 · a² · b¹',
        },
      },
      {
        id: '1b', title: 'Alien families', mode: 'sort', concepts: ['families'],
        slides: [
          { title: 'Families have the same letters', text: 'Aliens are in the same family when their letters AND exponents match. The number in front does not matter.', visual: { v: 'family', terms: [term(3, { x: 2 }), term(-7, { x: 2 }), term(1, { x: 2 })] }, rule: 'Same letters + same exponents = same family' },
          { title: 'Exponents must match', text: 'x and x² are NOT the same family. x² has a different exponent.', visual: { v: 'compare', a: term(4, { x: 1 }), b: term(4, { x: 2 }) } },
          { title: 'Order does not matter', text: 'ab and ba are the same family. a × b is the same as b × a.', visual: { v: 'compare', a: term(2, { a: 1, b: 1 }), b: term(6, { a: 1, b: 1 }), orderB: ['b', 'a'] } },
        ],
        example: {
          title: 'Which ship?', question: '9pq — ships: pq, p, q²',
          steps: [
            { say: 'Ignore the 9. Look only at the letters.', show: 'pq' },
            { say: 'p has exponent 1, q has exponent 1.', show: 'p¹ q¹' },
            { say: 'That matches the pq ship exactly.', show: '→ pq ship' },
          ],
          answer: '9pq goes in the pq ship',
        },
      },
    ],
  },
  {
    id: 2, world: 'The Like-Terms Kingdom', game: 'Algebra Restaurant', emoji: '🍽️', theme: 'kitchen',
    blurb: 'You are the manager of the busiest restaurant in the Kingdom. Cook the orders!',
    friend: { id: 'chef', name: 'Chef Pepper', emoji: '👩‍🍳', line: 'Chef Pepper joins your crew!' },
    stages: [
      {
        id: '2a', title: 'Matching ingredients', mode: 'spot', concepts: ['like'],
        slides: [
          { title: 'Like terms', text: 'Like terms have exactly the same letter part. 3a and 8a are like terms. They are the same ingredient.', visual: { v: 'fruit', groups: [{ emoji: '🥑', n: 3 }, { emoji: '🥑', n: 8 }] }, rule: 'Same letters + same exponents' },
          { title: 'Different letters? Different food', text: '3a and 3b are unlike terms. Avocados are not bananas!', visual: { v: 'fruit', groups: [{ emoji: '🥑', n: 3 }, { emoji: '🍌', n: 3 }] } },
          { title: 'Exponents must match too', text: 'y² and y are unlike terms. y² is a different ingredient from y.', visual: { v: 'compare', a: term(2, { y: 2 }), b: term(2, { y: 1 }) } },
          { title: 'Order does not matter', text: 'mn and nm are like terms, because m × n = n × m.', visual: { v: 'compare', a: term(5, { m: 1, n: 1 }), b: term(-2, { m: 1, n: 1 }), orderB: ['n', 'm'] } },
        ],
        example: {
          title: 'Find the matches', question: 'Which are like 6t²?  2t,  −t²,  6t³,  9t²',
          steps: [
            { say: 'The letter part of 6t² is t².', show: 't²' },
            { say: '2t has t, and 6t³ has t³. Different exponents.', show: '2t ✗   6t³ ✗' },
            { say: '−t² and 9t² both have t². The numbers do not matter.', show: '−t² ✓   9t² ✓' },
          ],
          answer: '−t² and 9t²',
        },
      },
      {
        id: '2b', title: 'Cook the order', mode: 'cook', concepts: ['collect'],
        slides: [
          { title: 'Add the same food', text: '2 avocados + 3 avocados = 5 avocados. In algebra: 2a + 3a = 5a.', visual: { v: 'fruit', groups: [{ emoji: '🥑', n: 2 }, { emoji: '🥑', n: 3 }], result: '5a' }, rule: 'Add the coefficients, keep the letters' },
          { title: 'Keep different food apart', text: '4a + 2b cannot be made shorter. It is not 6 of anything!', visual: { v: 'fruit', groups: [{ emoji: '🥑', n: 4 }, { emoji: '🍌', n: 2 }], result: '4a + 2b' } },
          { title: 'Take away', text: 'A minus sign belongs to the term after it. 7c − 2c = 5c. And 2c − 5c = −3c.', visual: { v: 'collect', terms: [term(7, { c: 1 }), term(-2, { c: 1 })] } },
          { title: 'The letter part never changes', text: 'When you add, the exponent stays: 3x² + 4x² = 7x². It does NOT become x⁴.', visual: { v: 'collect', terms: [term(3, { x: 2 }), term(4, { x: 2 })] }, rule: '3x² + 4x² = 7x²' },
        ],
        example: {
          title: 'Cook this order', question: '5k + 3n − 2k + 4n − n',
          steps: [
            { say: 'Find the k terms: +5k and −2k.', show: '5k − 2k = 3k' },
            { say: 'Find the n terms: +3n, +4n and −n (that is −1n).', show: '3n + 4n − n = 6n' },
            { say: 'k and n are different. Keep them apart.', show: '3k + 6n' },
          ],
          answer: '3k + 6n',
        },
      },
    ],
  },
  {
    id: 3, world: 'The Multiplication Lab', game: 'Sign Laboratory', emoji: '🧪', theme: 'lab',
    blurb: 'Mix potions! Blue ingredients are positive, red ones are negative.',
    friend: { id: 'fizz', name: 'Professor Fizz', emoji: '🧑‍🔬', line: 'Professor Fizz joins your crew!' },
    stages: [
      {
        id: '3a', title: 'Sign potions', mode: 'mix', concepts: ['signs'],
        slides: [
          { title: 'Positive × positive', text: '3 × 4 = 12. Two blue potions make a blue potion.', visual: { v: 'signline', a: 3, b: 4 } },
          { title: 'Negative × positive', text: '(−3) × 4 means three steps of 4 — but backwards. You land on −12.', visual: { v: 'signline', a: -3, b: 4 }, rule: 'one minus → negative' },
          { title: 'Negative × negative', text: 'A minus turns you around. Two minuses turn you around twice — you face forward again! (−3) × (−4) = +12.', visual: { v: 'signline', a: -3, b: -4 }, rule: 'two minuses → positive' },
          { title: 'Count the minus signs', text: 'Even number of minus signs → +. Odd number → −.', visual: { v: 'signtable' }, rule: 'even → +   odd → −' },
        ],
        example: {
          title: 'Brew it', question: '(−2) × 5 × (−3)',
          steps: [
            { say: 'Count the minus signs: there are 2.', show: '2 minuses → even → +' },
            { say: 'Multiply the numbers: 2 × 5 × 3.', show: '30' },
            { say: 'Put the sign and the number together.', show: '+30' },
          ],
          answer: '30',
        },
      },
      {
        id: '3b', title: 'Letter potions', mode: 'mix', concepts: ['coef', 'letters'],
        slides: [
          { title: 'A number times a term', text: '4 × 3y means 4 lots of 3y. Multiply the numbers: 4 × 3 = 12. So 12y.', visual: { v: 'expand', factors: [term(4), term(3, { y: 1 })] }, rule: 'multiply the numbers, keep the letter' },
          { title: 'Different letters sit together', text: 'k × t = kt. We just write them side by side, in alphabetical order.', visual: { v: 'expand', factors: [term(1, { k: 1 }), term(1, { t: 1 })] } },
          { title: 'Three jobs', text: 'For −2c × 4d: sign first (one minus → −), then numbers (2 × 4 = 8), then letters (cd).', visual: { v: 'expand', factors: [term(-2, { c: 1 }), term(4, { d: 1 })] }, rule: 'sign · number · letters' },
        ],
        example: {
          title: 'Brew it', question: '(−5n) × (−2w)',
          steps: [
            { say: 'Sign: two minus signs → +.', show: '+' },
            { say: 'Numbers: 5 × 2 = 10.', show: '10' },
            { say: 'Letters side by side, alphabetical.', show: 'nw' },
          ],
          answer: '10nw',
        },
      },
    ],
  },
  {
    id: 4, world: 'Exponent Rocket', game: 'Exponent Rocket', emoji: '🚀', theme: 'rocket',
    blurb: 'Fly between planets. Every right answer is rocket fuel!',
    friend: { id: 'nova', name: 'Captain Nova', emoji: '🧑‍🚀', line: 'Captain Nova joins your crew!' },
    stages: [
      {
        id: '4a', title: 'Fuel cells', mode: 'fuel', concepts: ['repeat'],
        slides: [
          { title: 'An exponent is a counter', text: 'y⁴ means y × y × y × y. The 4 counts how many y’s are multiplied.', visual: { v: 'chain', letter: 'y', n: 4 }, rule: 'y⁴ = y × y × y × y' },
          { title: 'Not times 4!', text: 'y⁴ is NOT 4y. 4y is y + y + y + y. Powers are about multiplying.', visual: { v: 'chain', letter: 'y', n: 4 } },
          { title: 'Numbers in front', text: '5 × p × p × p = 5p³. The 5 is the coefficient; the three p’s make p³.', visual: { v: 'chain', letter: 'p', n: 3, coef: 5 } },
        ],
        example: {
          title: 'Count the cells', question: 'n × n × n × n × n',
          steps: [
            { say: 'Count the n’s.', show: '5 of them' },
            { say: 'The count becomes the exponent.', show: 'n⁵' },
          ],
          answer: 'n⁵',
        },
      },
      {
        id: '4b', title: 'Merge the tanks', mode: 'fuel', concepts: ['product', 'coefpow'],
        slides: [
          { title: 'Join two chains', text: 'a² × a³ = (a × a) × (a × a × a). That is 5 a’s in a row.', visual: { v: 'expand', factors: [term(1, { a: 2 }), term(1, { a: 3 })] } },
          { title: 'So we ADD the exponents', text: 'Counting all the letters is the same as adding the exponents: 2 + 3 = 5. So a² × a³ = a⁵.', visual: { v: 'expand', factors: [term(1, { a: 2 }), term(1, { a: 3 })] }, rule: 'same base: add the exponents' },
          { title: 'Numbers are multiplied separately', text: '4t² × 2t⁵: numbers 4 × 2 = 8. Letters t² × t⁵ = t⁷. Answer 8t⁷.', visual: { v: 'expand', factors: [term(4, { t: 2 }), term(2, { t: 5 })] }, rule: 'numbers ×, exponents +' },
          { title: 'Watch out', text: 'Do not multiply the exponents: a² × a³ is a⁵, not a⁶. Count them!', rule: 'a² × a³ = a⁵' },
        ],
        example: {
          title: 'Fuel up', question: '(−3w⁴) × 2w',
          steps: [
            { say: 'Numbers: (−3) × 2 = −6.', show: '−6' },
            { say: 'w has no exponent written: it is w¹.', show: 'w⁴ × w¹' },
            { say: 'Add the exponents: 4 + 1 = 5.', show: 'w⁵' },
          ],
          answer: '−6w⁵',
        },
      },
      {
        id: '4c', title: 'Multi-fuel', mode: 'fuel', concepts: ['multivar'],
        slides: [
          { title: 'Different bases do not merge', text: 'c³ × d² = c³d². There is nothing to add: c and d are different letters.', visual: { v: 'expand', factors: [term(1, { c: 3 }), term(1, { d: 2 })] }, rule: 'only the same letter merges' },
          { title: 'One letter at a time', text: '3m²n × 5mn⁴: numbers 15. m: 2 + 1 = 3. n: 1 + 4 = 5. Answer 15m³n⁵.', visual: { v: 'expand', factors: [term(3, { m: 2, n: 1 }), term(5, { m: 1, n: 4 })] } },
        ],
        example: {
          title: 'Fuel up', question: '2k³t × (−4kt²)',
          steps: [
            { say: 'Numbers: 2 × (−4) = −8.', show: '−8' },
            { say: 'k: 3 + 1 = 4.', show: 'k⁴' },
            { say: 't: 1 + 2 = 3.', show: 't³' },
          ],
          answer: '−8k⁴t³',
        },
      },
    ],
  },
  {
    id: 5, world: 'The Power Tower', game: 'Final Boss Challenge', emoji: '🏰', theme: 'tower',
    blurb: 'Climb the tower floor by floor. The Muddle Monster waits at the top!',
    friend: { id: 'muddle', name: 'Muddle (tamed!)', emoji: '🐲', line: 'You tamed the Muddle Monster! It joins your crew.' },
    stages: [
      {
        id: '5a', title: 'Power brackets', mode: 'tower', concepts: ['bracket', 'insideout'],
        slides: [
          { title: 'Squaring a bracket', text: '(4y)² means 4y × 4y. That gives 16y².', visual: { v: 'copies', inner: term(4, { y: 1 }), n: 2 }, rule: '(4y)² = 4y × 4y = 16y²' },
          { title: 'Everything inside', text: 'The power outside a bracket hits everything inside: the number AND the letters.', visual: { v: 'copies', inner: term(2, { k: 3 }), n: 2 } },
          { title: 'Minus inside the bracket', text: '(−5t)² = (−5t) × (−5t) = +25t². Two minuses make plus.', visual: { v: 'copies', inner: term(-5, { t: 1 }), n: 2 } },
          { title: 'Outside or attached?', text: 'In 4y² only y is squared. In (4y)² both 4 and y are squared. Brackets change everything!', visual: { v: 'touch', text: '4y²', squared: ['y'] }, rule: '4y² ≠ (4y)²' },
          { title: 'Minus: inside or out?', text: '−n² means −(n × n), so it is negative. (−n)² is (−n) × (−n), so it is positive.', visual: { v: 'touch', text: '(−n)²', squared: ['−', 'n'] } },
        ],
        example: {
          title: 'Power up', question: '(−2m³)²',
          steps: [
            { say: 'Two copies of the bracket.', show: '(−2m³) × (−2m³)' },
            { say: 'Numbers: (−2) × (−2) = +4.', show: '4' },
            { say: 'Letters: m³ × m³ — add the exponents, 3 + 3 = 6.', show: 'm⁶' },
          ],
          answer: '4m⁶',
        },
      },
      {
        id: '5b', title: 'Area rooms', mode: 'tower', concepts: ['area'],
        slides: [
          { title: 'Area with letters', text: 'A rectangle 5w long and 2w wide has area 5w × 2w = 10w².', visual: { v: 'area', w: term(5, { w: 1 }), h: term(2, { w: 1 }) }, rule: 'area = length × width' },
          { title: 'Two rooms', text: 'Find each area, then add. The answers are like terms, so they join.', visual: { v: 'area', w: term(3, { y: 1 }), h: term(2, { y: 1 }) } },
        ],
        example: {
          title: 'Measure it', question: 'A square patio has side 6n. Area?',
          steps: [
            { say: 'Square: side × side.', show: '6n × 6n' },
            { say: 'Numbers 6 × 6 = 36, letters n × n = n².', show: '36n²' },
          ],
          answer: '36n²',
        },
      },
      {
        id: '5c', title: 'The Muddle Monster', mode: 'boss', concepts: ['boss'],
        slides: [
          { title: 'Everything you know', text: 'The monster mixes up every rule. Read each question slowly. Which rule is it asking for?', rule: 'parts · like terms · signs · exponents · brackets' },
          { title: 'Order of work', text: 'Do powers and multiplying first. Then add or subtract like terms.', visual: { v: 'collect', terms: [term(6, { p: 2 }), term(-2, { p: 2 })] }, rule: 'multiply first, collect last' },
        ],
        example: {
          title: 'Two-step spell', question: '3y × 4y − 5y²',
          steps: [
            { say: 'Multiply first: 3y × 4y.', show: '12y²' },
            { say: 'Now collect: 12y² − 5y². They are like terms.', show: '7y²' },
          ],
          answer: '7y²',
        },
      },
    ],
  },
];

export const levelOf = (id: LevelId) => LEVELS.find((l) => l.id === id)!;
export const allStages = () => LEVELS.flatMap((l) => l.stages.map((s) => ({ level: l, stage: s })));
