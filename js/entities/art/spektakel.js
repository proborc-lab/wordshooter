/**
 * art/spektakel.js — Things that build up and then go off.
 *
 * The volcano rumbles for five frames before it erupts, the candle dies and
 * grows back, and the door has somebody living in it.
 */

// ── Vulkaantje ──────────────────────────────────────────────────────────────
const V_RUST = [
  '............',
  '............',
  '............',
  '....NNNN....',
  '...NNNNNN...',
  '..NNNNNNNN..',
  '.NNNNNNNNNN.',
  'NNNNNNNNNNNN',
  'gggggggggggg',
];
const V_ROOK = [
  '.....w......',
  '....w.......',
  '.....w......',
  '....NNNN....',
  '...NNNNNN...',
  '..NNNNNNNN..',
  '.NNNNNNNNNN.',
  'NNNNNNNNNNNN',
  'gggggggggggg',
];
const V_PRUTTEL = [
  '....O.O.....',
  '.....O......',
  '....OOOO....',
  '....OOOO....',
  '...NNNNNN...',
  '..NNNNNNNN..',
  '.NNNNNNNNNN.',
  'NNNNNNNNNNNN',
  'gggggggggggg',
];
const V_KNAL = [
  '..O..OO..O..',
  '.OOYOOOOYOO.',
  '..OYYYYYYO..',
  '...YYYYYY...',
  '...OOOOOO...',
  '..NNOOOONN..',
  '.NNNNOONNNN.',
  'NNNNNNNNNNNN',
  'gggggggggggg',
];
const V_AS = [
  '..D...D...D.',
  '....D...D...',
  '.D....D.....',
  '....NNNN....',
  '...NNNNNN...',
  '..NNNNNNNN..',
  '.NNNNNNNNNN.',
  'NNNNNNNNNNNN',
  'gggggggggggg',
];

// ── Kaarsje ─────────────────────────────────────────────────────────────────
const C_LANG = [
  '.....O......',
  '....OYO.....',
  '.....O......',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '...WWWWWW...',
];
const C_MIDDEL = [
  '............',
  '............',
  '.....O......',
  '....OYO.....',
  '.....O......',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '....WWWW....',
  '...WWWWWW...',
];
const C_KORT = [
  '............',
  '............',
  '............',
  '............',
  '.....O......',
  '....OYO.....',
  '.....O......',
  '....WWWW....',
  '....WWWW....',
  '...WWWWWW...',
];
const C_UIT = [
  '............',
  '.....w......',
  '....w.......',
  '.....w......',
  '............',
  '............',
  '............',
  '....WWWW....',
  '....WWWW....',
  '...WWWWWW...',
];

// ── Zwevende deur ───────────────────────────────────────────────────────────
const D_DICHT = [
  '............',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNYN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
];
const D_KIER = [
  '............',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
  '..KNNNNNYN..',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
  '..KNNNNNNN..',
];
const D_OOG = [
  '............',
  '..KKKNNNNN..',
  '..KKKNNNNN..',
  '..KWWKNNNN..',
  '..WKKWNNNN..',
  '..KWWKNNYN..',
  '..KKKNNNNN..',
  '..KKKNNNNN..',
  '..KKKNNNNN..',
  '..KKKNNNNN..',
];
const D_KLAP = [
  '.L........L.',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNYN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '..NNNNNNNN..',
  '.L.NNNNNN.L.',
];

// ── Cactus ──────────────────────────────────────────────────────────────────
const X_KAAL = [
  '............',
  '............',
  '....GGGG....',
  '..G.GGGG.G..',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '...GGGGGG...',
  '...GGGGGG...',
  '...GGGGGG...',
  '..NNNNNNNN..',
];
const X_KNOP = [
  '............',
  '.....M......',
  '....GGGG....',
  '..G.GGGG.G..',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '...GGGGGG...',
  '...GGGGGG...',
  '...GGGGGG...',
  '..NNNNNNNN..',
];
const X_BLOEM = [
  '....M..M....',
  '...MMMMMM...',
  '....MYYM....',
  '...MMMMMM...',
  '....GGGG....',
  '..G.GGGG.G..',
  '..GGGGGGGG..',
  '...GGGGGG...',
  '...GGGGGG...',
  '..NNNNNNNN..',
];
const X_VALT = [
  '..M......M..',
  '.....M......',
  '....GGGG....',
  '..G.GGGG.G..',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '...GGGGGG...',
  '...GGGGGG...',
  '...GGGGGG...',
  '..NNNNNNNN..',
];

export const SPEKTAKEL = {
  // Five frames of rumbling. The long wait is what makes the bang.
  vulkaan: [V_RUST, V_RUST, V_RUST, V_RUST, V_RUST,
            V_ROOK, V_ROOK, V_PRUTTEL, V_PRUTTEL,
            V_KNAL, V_KNAL, V_AS, V_AS],

  // Burns all the way down, goes out, and grows back. A candle rehearsing its
  // own death, forever.
  kaarsje: [C_LANG, C_LANG, C_MIDDEL, C_MIDDEL, C_KORT, C_KORT,
            C_UIT, C_UIT, C_UIT],

  // Somebody lives in there.
  deur: [D_DICHT, D_DICHT, D_DICHT, D_DICHT, D_DICHT,
         D_KIER, D_KIER, D_OOG, D_OOG, D_OOG, D_KIER, D_KLAP, D_DICHT],

  // Blooms, drops the flower, and tries again anyway.
  cactus: [X_KAAL, X_KAAL, X_KAAL, X_KAAL,
           X_KNOP, X_KNOP, X_BLOEM, X_BLOEM, X_BLOEM, X_VALT, X_VALT],
};
