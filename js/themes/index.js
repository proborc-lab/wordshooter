/**
 * themes/index.js — The worlds, and which world a word list plays in.
 *
 * level.js used to branch on `theme === 'industrial'` in FIFTEEN places. Now a
 * world is one file, and level.js branches on none of them. Most of a theme is
 * data (colours); only `backdrop` is code, because a Frisian sky and a London
 * fog cannot be expressed as a palette.
 *
 * ── Which world does a list get? ────────────────────────────────────────────
 * Tying worlds to the SUBJECT of a list sounds lovely and covers almost nothing:
 * of the 89 lists only 6 are 'Theme' lists. The 23 homework lists ("128 — Week
 * 7") have no subject at all — and those are the ones he actually uses every
 * week. Inventing a beach for a list about feelings would be worse than useless.
 *
 * What every list DOES have is a language. So the language is the backstop:
 * you're learning French, you're standing in Paris. That covers all 89, and it
 * means something. A list may still override it (`world` in the manifest) where
 * the subject genuinely suggests a place — that's a bonus, never a requirement.
 */

import { Sprites, makePlatformTile } from '../sprites.js';
import { BOS } from './bos.js';
import { FABRIEK } from './fabriek.js';
import { ENGELAND } from './engeland.js';
import { FRANKRIJK } from './frankrijk.js';
import { DUITSLAND } from './duitsland.js';
import { FRIESLAND } from './friesland.js';

export const THEMES = {
  bos: BOS,
  fabriek: FABRIEK,
  engeland: ENGELAND,
  frankrijk: FRANKRIJK,
  duitsland: DUITSLAND,
  friesland: FRIESLAND,
};

/**
 * Bake a brick tile in each world's own colour.
 *
 * The tile sprite used to be a fixed green, drawn OVER the theme's platform
 * colour — so London got brick terraces with grass ledges. Every world that
 * declares `tileBase` now gets its own tile; the factory keeps its hand-made
 * metal plate.
 */
for (const [id, t] of Object.entries(THEMES)) {
  if (!t.tileBase) continue;
  const key = `platformTile_${id}`;
  Sprites.cache[key] = makePlatformTile(t.tileBase);
  t.tileSprite = key;
}

/** The world of the language being learned. Keys match the manifest's lang2. */
const WORLD_BY_LANGUAGE = {
  English: 'engeland',
  French: 'frankrijk',
  Deutsch: 'duitsland',
  German: 'duitsland',
  Frysk: 'friesland',
  Frisian: 'friesland',
};

/** Unknown id falls back to the forest rather than crashing mid-game. */
export function themeDef(id) {
  return THEMES[id] || THEMES.bos;
}

/**
 * Which world a list plays in (rounds 1 & 2 — rounds 3 & 4 are always the
 * factory; the direction reverses and the world turning hard IS the signal).
 *
 *   1. the list's own `world`, if the manifest declares one
 *   2. otherwise the world of the language being learned
 *   3. otherwise the forest
 */
export function worldFor(listMeta) {
  if (!listMeta) return 'bos';
  if (listMeta.world && THEMES[listMeta.world]) return listMeta.world;
  return WORLD_BY_LANGUAGE[listMeta.lang2] || 'bos';
}
