/**
 * art/stad.js — The big city.
 *
 * The traffic light is the cheapest good idea in the whole cast: identical grid,
 * two frames, the lit lamp moves from red to green. It costs nothing and it's
 * the only follower that actually *does* something.
 */

export const STAD = {
  verkeerslicht: [[
    '............',
    '...KKKKKK...',
    '..KKKKKKKK..',
    '..KKRRRRKK..',
    '..KKRRRRKK..',
    '..KKDDDDKK..',
    '..KKDDDDKK..',
    '..KKDDDDKK..',
    '..KKKKKKKK..',
    '....DDDD....',
    '....DDDD....',
  ], [
    '............',
    '...KKKKKK...',
    '..KKKKKKKK..',
    '..KKDDDDKK..',
    '..KKDDDDKK..',
    '..KKDDDDKK..',
    '..KKGGGGKK..',
    '..KKGGGGKK..',
    '..KKKKKKKK..',
    '....DDDD....',
    '....DDDD....',
  ]],

  pizzapunt: [[
    '............',
    '.....N......',
    '....NYN.....',
    '...NYYYN....',
    '...YRYYY....',
    '..YYYYRYY...',
    '..YRYYYYY...',
    '.YYYYYRYYY..',
    '.YYRYYYYYY..',
    'NNNNNNNNNNN.',
  ], [
    '............',
    '.....N......',
    '....NYN.....',
    '...NYYYN....',
    '...YYRYY....',
    '..YRYYYYY...',
    '..YYYYRYY...',
    '.YYRYYYYYY..',
    '.YYYYYRYYY..',
    'NNNNNNNNNNN.',
  ]],
};
