/**
 * hats.js — Headgear as data.
 *
 * A hat is a pixel grid, not a function: up to 13 rows × 16 chars, drawn at the
 * top of the 16×28 player sprite. It covers the 4 headroom rows, the 5 rows the
 * Ranger helmet used to occupy (so a hat REPLACES the helmet), and — for the
 * ones that need it — the 4 face rows below that.
 *
 * Reaching the face is what makes a beekeeper's veil, an astronaut's visor, an
 * eye patch or an alien's head possible at all. The grid is painted AFTER the
 * face, so a '.' simply leaves the face showing: a plain cap or crown only fills
 * rows 0-8 and the face is untouched, exactly as before.
 *
 * Adding a hat = one entry here. No renderer changes, no chain anywhere.
 *
 * Chars → palette keys (see palette.js):
 *   .  transparent      S  hatShadow   D  hatDark   M  hatMid   H  hatHi
 *   t  trimDark         T  trimMid     G  trimHi    K  hatInk (veil / patch / eyes)
 *
 * The M/D/H/S shades come from the outfit's `colors.hat`; T/t/G from
 * `colors.trim`; K from `colors.ink`. So the same grid in a different color is a
 * different hat for free — no new art.
 *
 * Sprites are built facing right and flipped for left, so an asymmetric brim
 * (the cap, the cowboy hat) or an eye patch turns around with the player.
 */

export const HAT_W = 16;
export const HAT_H = 13;          // 4 headroom + 5 helmet + 4 face rows

const CHARS = {
  S: 'hatShadow', D: 'hatDark', M: 'hatMid', H: 'hatHi',
  t: 'trimDark', T: 'trimMid', G: 'trimHi',
  K: 'hatInk',
};

export const HATS = {
  pet: [
    '................',
    '................',
    '................',
    '....MMMMMMMM....',
    '..MMMMMMMMMMMM..',
    '..MHHHHHHHHHHM..',
    '..MMMMMMMMMMMMMM',
    '..DDDDDDDDDDDDDD',
    '..SSSSSSSSSSSS..',
  ],
  kroon: [
    '................',
    '...G..G..G..G...',
    '...T..T..T..T...',
    '...T..T..T..T...',
    '..TTTTTTTTTTTT..',
    '..TTTTTTTTTTTT..',
    '..TTGTTGTTGTTG..',
    '..TTTTTTTTTTTT..',
    '..tttttttttttt..',
  ],
  cowboy: [
    '................',
    '................',
    '....MMMMMMMM....',
    '...MMMMMMMMMM...',
    '...MHHHHHHHHM...',
    '...TTTTTTTTTT...',
    'MMMMMMMMMMMMMMMM',
    'DDDDDDDDDDDDDDDD',
    '..SSSSSSSSSSSS..',
  ],
  nar: [
    'G..............G',
    '.MM..........MM.',
    '..MM........MM..',
    '...MM......MM...',
    '..MMMMMMMMMMMM..',
    '..MHMHMHMHMHMH..',
    '..HMHMHMHMHMHM..',
    '..DDDDDDDDDDDD..',
    '..SSSSSSSSSSSS..',
  ],
  hoge_hoed: [
    '....DDDDDDDD....',
    '....MMMMMMMM....',
    '....MMMMMMMM....',
    '....TTTTTTTT....',
    '....MMMMMMMM....',
    '....MMMMMMMM....',
    '..MMMMMMMMMMMM..',
    '.DDDDDDDDDDDDDD.',
    '..SSSSSSSSSSSS..',
  ],
  tovenaar: [
    '.......DM.......',
    '......DMM.......',
    '......MMM.......',
    '.....MMMMG......',
    '.....MMMMM......',
    '....MMMMMMM.....',
    '...MMGMMMMMM....',
    '..MMMMMMMMMMMM..',
    '.DDDDDDDDDDDDDD.',
  ],

  // ── Headgear that reaches the face (rows 9-12) ────────────────────────────

  /** Beekeeper: wide white hat, mesh veil hanging over the whole face. */
  imker: [
    '................',
    '................',
    '....MMMMMMMM....',
    '...MMMMMMMMMM...',
    '...MHHHHHHHHM...',
    '.MMMMMMMMMMMMMM.',
    '.DDDDDDDDDDDDDD.',
    '..KKKKKKKKKKKK..',
    '..KHKKKHKKKHKK..',
    '..KKKKKKKKKKKK..',
    '..KKHKKKHKKKHK..',
    '..KKKKKKKKKKKK..',
    '..KKKKKKKKKKKK..',
  ],

  /** Astronaut: sealed helmet, the visor covers the face entirely. */
  ruimtehelm: [
    '................',
    '................',
    '....MMMMMMMM....',
    '..MMMMMMMMMMMM..',
    '..MHHHHHHHHHHM..',
    '..MHTTTTTTTTHM..',
    '..MHTTTTTTTTHM..',
    '..MHTTTTTTTTHM..',
    '..MHTTTTTTTTHM..',
    '..MHTTGGTTTTHM..',
    '..MHTTTTTTTTHM..',
    '..MHTTTTTTTTHM..',
    '..MMMMMMMMMMMM..',
  ],

  /** Alien: a whole head — bald dome, big black almond eyes. */
  alienkop: [
    '................',
    '................',
    '................',
    '................',
    '....MMMMMMMM....',
    '..MMMMMMMMMMMM..',
    '..MHHMMMMMMMMM..',
    '..MMMMMMMMMMMM..',
    '..MMMMMMMMMMMM..',
    '..MMKKMMMMKKMM..',
    '..MKKKMMMMKKKM..',
    '..MMKKMMMMKKMM..',
    '..MMMMMMMMMMMM..',
  ],

  /** Pirate: bandana with trailing knot, plus an eye patch over the right eye. */
  piraat: [
    '................',
    '................',
    '................',
    '................',
    '..MMMMMMMMMMMM..',
    '..MMMMMMMMMMMM..',
    '..MHHMMMMMMMMM..',
    '..MMMMMMMMMMMM..',
    '..DDDDDKKKDDDD..',
    '.MM.....KKK.....',
    '.M......KKK.....',
    '........KKK.....',
  ],

  /** Gardener: floppy straw hat with a band. */
  strohoed: [
    '................',
    '................',
    '....MMMMMMMM....',
    '...MMMMMMMMMM...',
    '...MHHHHHHHHM...',
    '...TTTTTTTTTT...',
    '.MMMMMMMMMMMMMM.',
    'MMMMMMMMMMMMMMMM',
    '.DDDDDDDDDDDDDD.',
  ],
};

/** Draw a hat grid at the top of the sprite canvas. Unknown id draws nothing. */
export function drawHat(ctx, id, P) {
  const grid = HATS[id];
  if (!grid) return;
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const key = CHARS[line[col]];
      if (!key) continue;
      ctx.fillStyle = P[key];
      ctx.fillRect(col, row, 1, 1);
    }
  }
}
