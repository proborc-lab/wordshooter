/**
 * art/index.js — Every follower grid, merged into one map.
 *
 * follower.js reads FOLLOWER_ART and knows nothing about themes. Adding a
 * follower = one grid in the right theme file. Adding a THEME = one file plus
 * one line here — and each theme file stays far below the 400-line limit, which
 * the old single follower-art.js was about to blow through.
 *
 * Keys must be unique across themes: they become the sprite-cache keys
 * (`follower_<key>`), and a duplicate would silently overwrite the other's art.
 * initFollowers() checks for that at startup.
 */

import { BASIS } from './basis.js';
import { DIEREN } from './dieren.js';
import { HIERNAMAALS } from './hiernamaals.js';
import { MAFFIA } from './maffia.js';
import { FILMS } from './films.js';
import { ZOMER } from './zomer.js';
import { FANTASIE } from './fantasie.js';
import { NERDS } from './nerds.js';
import { ONDERWATER } from './onderwater.js';
import { JUNGLE } from './jungle.js';
import { STAD } from './stad.js';
import { PLATTELAND } from './platteland.js';
import { SKI } from './ski.js';
import { PIRAMIDES } from './piramides.js';
import { RAAR } from './raar.js';
import { KEUKEN } from './keuken.js';
import { BEESTJES } from './beestjes.js';
import { SPEKTAKEL } from './spektakel.js';

export { PALETTE, SIZE } from './palette.js';

/** Theme → its grids. The order here is the order they were added, nothing more. */
export const THEMES = {
  basis: BASIS,
  dieren: DIEREN,
  hiernamaals: HIERNAMAALS,
  maffia: MAFFIA,
  films: FILMS,
  zomer: ZOMER,
  fantasie: FANTASIE,
  nerds: NERDS,
  onderwater: ONDERWATER,
  jungle: JUNGLE,
  stad: STAD,
  platteland: PLATTELAND,
  ski: SKI,
  piramides: PIRAMIDES,
  raar: RAAR,
  keuken: KEUKEN,
  beestjes: BEESTJES,
  spektakel: SPEKTAKEL,
};

export const FOLLOWER_ART = Object.assign({}, ...Object.values(THEMES));

/** Grids defined in more than one theme file — a silent art-clobbering bug. */
export function duplicateKeys() {
  const seen = new Set();
  const dupes = [];
  for (const grids of Object.values(THEMES)) {
    for (const key of Object.keys(grids)) {
      if (seen.has(key)) dupes.push(key);
      seen.add(key);
    }
  }
  return dupes;
}
