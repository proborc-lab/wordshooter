/**
 * art/keuken.js — Household absurdities that perform a little loop.
 *
 * These are the first followers that ANIMATE rather than bob. The gag is the
 * timing, not the picture: a toaster is only funny if it sits there doing
 * nothing for two full seconds first.
 *
 * The hold costs nothing. Draw a frame once, then repeat it in the sequence —
 * `[STIL, STIL, STIL, STIL, STIL, STIL, PING, POP, POP, VAL]` is six frames of
 * dead silence and then a punchline, for the price of one drawing.
 */

// ── Broodrooster ────────────────────────────────────────────────────────────
const T_STIL = [
  '............',
  '............',
  '............',
  '..SSSSSSSS..',
  '..SKKKKKKS..',
  '.SSSSSSSSSS.',
  '.SSSSSSSSSS.',
  '.SSDSSSSrSS.',
  '.SSSSSSSSSS.',
  '.S.SSSSSS.S.',
];
const T_PING = [
  '.....L......',
  '...L...L....',
  '............',
  '..SSSSSSSS..',
  '..SKKKKKKS..',
  '.SSSSSSSSSS.',
  '.SSSSSSSSSS.',
  '.SSDSSSSRSS.',
  '.SSSSSSSSSS.',
  '.S.SSSSSS.S.',
];
const T_POP = [
  '............',
  '...NNNNNN...',
  '...NNNNNN...',
  '..SSSSSSSS..',
  '..SKKKKKKS..',
  '.SSSSSSSSSS.',
  '.SSSSSSSSSS.',
  '.SSDSSSSRSS.',
  '.SSSSSSSSSS.',
  '.S.SSSSSS.S.',
];
const T_VAL = [
  '............',
  '............',
  '...NNNNNN...',
  '..SNNNNNNS..',
  '..SKNNNNKS..',
  '.SSSSSSSSSS.',
  '.SSSSSSSSSS.',
  '.SSDSSSSrSS.',
  '.SSSSSSSSSS.',
  '.S.SSSSSS.S.',
];

// ── Frisdrankflesje ─────────────────────────────────────────────────────────
const F_STIL = [
  '.....KK.....',
  '.....KK.....',
  '....BBBB....',
  '...BBBBBB...',
  '...BBBBBB...',
  '...BWWWWB...',
  '...BWWWWB...',
  '...BBBBBB...',
  '...BBBBBB...',
  '...BBBBBB...',
  '....BBBB....',
];
const F_SCHUDL = [
  '....KK......',
  '....KK......',
  '...BBBB.....',
  '..BBBBBB....',
  '..BBBBBB....',
  '..BWWWWB....',
  '..BWWWWB....',
  '..BBBBBB....',
  '..BBBBBB....',
  '..BBBBBB....',
  '...BBBB.....',
];
const F_SCHUDR = [
  '......KK....',
  '......KK....',
  '.....BBBB...',
  '....BBBBBB..',
  '....BBBBBB..',
  '....BWWWWB..',
  '....BWWWWB..',
  '....BBBBBB..',
  '....BBBBBB..',
  '....BBBBBB..',
  '.....BBBB...',
];
const F_SPUIT = [
  '..C.C..C.C..',
  '...CCCCCC...',
  '....CCCC....',
  '....BBBB....',
  '...BBBBBB...',
  '...BBBBBB...',
  '...BWWWWB...',
  '...BWWWWB...',
  '...BBBBBB...',
  '...BBBBBB...',
  '....BBBB....',
];
const F_LEEG = [
  '............',
  '............',
  '.....KK.....',
  '....BBBB....',
  '...BBBBBB...',
  '...BWWWWB...',
  '...BWWWWB...',
  '...BBBBBB...',
  '...BBBBBB...',
  '....BBBB....',
];

// ── Koffiebeker ─────────────────────────────────────────────────────────────
const B_STIL = [
  '............',
  '............',
  '..WWWWWWWW..',
  '..WNNNNNNW..',
  '..WNNNNNNW..',
  '..WWWWWWWW..',
  '..WWWWWWWW..',
  '...WWWWWW...',
  '....WWWW....',
];
const B_TRILL = [
  '............',
  '............',
  '.WWWWWWWW...',
  '.WNNNNNNW...',
  '.WNNNNNNW...',
  '.WWWWWWWW...',
  '.WWWWWWWW...',
  '..WWWWWW....',
  '...WWWW.....',
];
const B_TRILR = [
  '............',
  '............',
  '...WWWWWWWW.',
  '...WNNNNNNW.',
  '...WNNNNNNW.',
  '...WWWWWWWW.',
  '...WWWWWWWW.',
  '....WWWWWW..',
  '.....WWWW...',
];
const B_STOOM = [
  '..w..w..w...',
  '...w.w.w....',
  '..WWWWWWWW..',
  '..WNNNNNNW..',
  '..WNNNNNNW..',
  '..WWWWWWWW..',
  '..WWWWWWWW..',
  '...WWWWWW...',
  '....WWWW....',
];

// ── Wc-rol ──────────────────────────────────────────────────────────────────
const R_VOL = [
  '............',
  '...WWWWWW...',
  '..WWWWWWWW..',
  '..WWWNNWWW..',
  '..WWWNNWWW..',
  '..WWWWWWWW..',
  '...WWWWWW...',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
];
const R_MINDER = [
  '............',
  '............',
  '...WWWWWW...',
  '..WWWNNWWW..',
  '..WWWNNWWW..',
  '...WWWWWW...',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
];
const R_WEINIG = [
  '............',
  '............',
  '............',
  '....WWWW....',
  '...WWNNWW...',
  '...WWNNWW...',
  '....WWWW....',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
  '.....WW.....',
];
const R_OP = [
  '............',
  '............',
  '............',
  '............',
  '.....NN.....',
  '.....NN.....',
  '.....NN.....',
  '............',
];

export const KEUKEN = {
  // Sits there. Sits there. Sits there. PING. It has no other purpose.
  broodrooster: [T_STIL, T_STIL, T_STIL, T_STIL, T_STIL, T_STIL,
                 T_PING, T_POP, T_POP, T_VAL],

  frisdrank: [F_STIL, F_STIL, F_STIL, F_STIL,
              F_SCHUDL, F_SCHUDR, F_SCHUDL, F_SCHUDR,
              F_SPUIT, F_SPUIT, F_LEEG, F_LEEG],

  // Too much caffeine.
  koffiebeker: [B_STIL, B_STIL, B_STIL,
                B_TRILL, B_TRILR, B_TRILL, B_TRILR, B_TRILL, B_TRILR,
                B_STOOM, B_STOOM, B_STIL],

  // Unrolls itself completely, then is inexplicably full again. Pointless.
  wcrol: [R_VOL, R_VOL, R_MINDER, R_MINDER, R_WEINIG, R_WEINIG, R_OP, R_OP, R_OP],
};
