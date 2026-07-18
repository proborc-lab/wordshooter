/**
 * art/beestjes.js — Animals that perform a loop.
 *
 * Same trick as keuken.js: the silence is the joke. The crocodile does nothing
 * at all for six frames, and that is precisely why the snap lands.
 */

// ── Slapend katje ───────────────────────────────────────────────────────────
// Pointed ears and whiskers, or it reads as a pumpkin — which is exactly what
// the first version did.
const P_SLAAP = [
  '..........w.',
  '.OO......OO.',
  '.OOO....OOO.',
  '.OOOOOOOOOO.',
  'OOOOOOOOOOOO',
  'OOKKOOOOKKOO',
  'OOOOOWWOOOOO',
  'WOOOOOOOOOOW',
  '.OOOOOOOOOO.',
  '..OOOOOOOO..',
];
const P_SLAAPZ = [
  '.........ww.',
  '.OO......OO.',
  '.OOO....OOO.',
  '.OOOOOOOOOO.',
  'OOOOOOOOOOOO',
  'OOKKOOOOKKOO',
  'OOOOOWWOOOOO',
  'WOOOOOOOOOOW',
  '.OOOOOOOOOO.',
  '..OOOOOOOO..',
];
const P_WAKKER = [
  '............',
  '.OO......OO.',
  '.OOO....OOO.',
  '.OOOOOOOOOO.',
  'OOOOOOOOOOOO',
  'OOWKOOOOKWOO',
  'OOOOOWWOOOOO',
  'WOOOOOOOOOOW',
  '.OOOOOOOOOO.',
  '..OOOOOOOO..',
];
const P_KIJK = [
  '............',
  '.OO......OO.',
  '.OOO....OOO.',
  '.OOOOOOOOOO.',
  'OOOOOOOOOOOO',
  'OOKWOOOOKWOO',
  'OOOOOWWOOOOO',
  'WOOOOOOOOOOW',
  '.OOOOOOOOOO.',
  '..OOOOOOOO..',
];

// ── Krokodil ────────────────────────────────────────────────────────────────
const K_DICHT = [
  '............',
  '............',
  '..GGGGGGGG..',
  '.GGKGGGGGGGG',
  '.GGGGGGGGGGG',
  '.GWGWGWGWGWG',
  '.GGGGGGGGGGG',
  '..GGGGGGGGG.',
];
const K_KIER = [
  '............',
  '............',
  '..GGGGGGGG..',
  '.GGKGGGGGGGG',
  '.GGGGGGGGGGG',
  '.GWGWGWGWGWG',
  '............',
  '.GWGWGWGWGWG',
  '..GGGGGGGGG.',
];
const K_OPEN = [
  '..GGGGGGGG..',
  '.GGKGGGGGGGG',
  '.GGGGGGGGGGG',
  '.GWGWGWGWGWG',
  '.rrrrrrrrrrr',
  '.rrrrrrrrrrr',
  '.GWGWGWGWGWG',
  '.GGGGGGGGGGG',
  '..GGGGGGGGG.',
];
const K_KLAP = [
  '............',
  '.L........L.',
  '..GGGGGGGG..',
  '.GGKGGGGGGGG',
  '.GGGGGGGGGGG',
  '.GWGWGWGWGWG',
  '.GGGGGGGGGGG',
  '..GGGGGGGGG.',
  '.L........L.',
];

// ── Aapje met banaan ────────────────────────────────────────────────────────
// The banana has to be a fat yellow bar that visibly shrinks. At two pixels
// wide the whole gag was invisible.
const A_HEEL = [
  '............',
  '.NN....NN...',
  'NNNNNNNNN.YY',
  'NYYYYYYYN.YY',
  'NYKYYKYYN.YY',
  'NYYYYYYYN.YY',
  'NYYKKKYYN.YY',
  'NYYYYYYYN...',
  '.NNNNNNN....',
  '..N....N....',
];
const A_HAP = [
  '............',
  '.NN....NN...',
  'NNNNNNNNN...',
  'NYYYYYYYN.YY',
  'NYKYYKYYN.YY',
  'NYYYYYYYN.YY',
  'NYYKKKYYN.YY',
  'NYYYYYYYN...',
  '.NNNNNNN....',
  '..N....N....',
];
const A_BIJNA = [
  '............',
  '.NN....NN...',
  'NNNNNNNNN...',
  'NYYYYYYYN...',
  'NYKYYKYYN...',
  'NYYYYYYYN.YY',
  'NYYKKKYYN.YY',
  'NYYYYYYYN...',
  '.NNNNNNN....',
  '..N....N....',
];
const A_SCHIL = [
  '............',
  '.NN....NN...',
  'NNNNNNNNN...',
  'NYYYYYYYN...',
  'NYKYYKYYN...',
  'NYYYYYYYN...',
  'NYYKKKYYN.ww',
  'NYYYYYYYN.ww',
  '.NNNNNNN....',
  '..N....N....',
];

// ── Kip die een ei legt ─────────────────────────────────────────────────────
// The squat has to be BIG or the frames all look the same — which is what the
// first version did. Tall → squashed → very squashed → a fat white egg.
const E_STAAT = [
  '...RR.......',
  '..RRRR......',
  '..WWWWWW....',
  '..WWKWWWO...',
  '..WWWWWWO...',
  '.WWWWWWWW...',
  '.WWWWWWWW...',
  '.WWWWWWWW...',
  '..WWWWWW....',
  '...O.O.O....',
];
const E_HURKT = [
  '............',
  '............',
  '...RR.......',
  '..RRRR......',
  '..WWWWWW....',
  '..WWKWWWO...',
  '.WWWWWWWWO..',
  '.WWWWWWWW...',
  '..WWWWWW....',
  '...O.O.O....',
];
const E_PERST = [
  '............',
  '............',
  '..RRRR......',
  '.RRRRRR.....',
  '.WWWKWWWO...',
  'WWWWWWWWWO..',
  'WWWWWWWWWW..',
  'WWWWWWWWWW..',
  '.WWWWWWWW...',
  '..O..O..O...',
];
// The egg needs an outline: a white egg under a white chicken is invisible.
const E_EI = [
  '...RR.......',
  '..RRRR......',
  '..WWWWWW....',
  '..WWKWWWO...',
  '..WWWWWWO...',
  '.WWWWWWWW...',
  '.WWWWWWWW...',
  '.WWWWWWWW...',
  '..WWWWWW....',
  '...O.O.O....',
  '..KWWWWK....',
  '...KWWK.....',
];

export const BEESTJES = {
  // Sleeps. Sleeps. Wakes up in a panic. Looks around. Goes back to sleep.
  katje: [P_SLAAP, P_SLAAPZ, P_SLAAP, P_SLAAPZ, P_SLAAP, P_SLAAPZ,
          P_WAKKER, P_WAKKER, P_KIJK, P_KIJK, P_SLAAP],

  // Six frames of absolutely nothing. Then the jaw. That is the whole act.
  krokodil: [K_DICHT, K_DICHT, K_DICHT, K_DICHT, K_DICHT, K_DICHT,
             K_KIER, K_OPEN, K_OPEN, K_KLAP, K_DICHT],

  // Eats the banana down to the peel, and then the banana is back. Nobody asks.
  aapje_eet: [A_HEEL, A_HEEL, A_HAP, A_HAP, A_BIJNA, A_BIJNA, A_SCHIL, A_SCHIL],

  // Lays an egg and then pretends nothing happened.
  legkip: [E_STAAT, E_STAAT, E_STAAT, E_STAAT,
           E_HURKT, E_PERST, E_PERST, E_EI, E_EI, E_EI, E_STAAT],
};
