/**
 * skins.js — The player sprite builder (Route A: procedural, palette-driven).
 *
 * The sprite canvas is 16×28 but the PLAYER is 16×24: the top 4 rows are
 * headroom that only headgear ever draws into (a crown, a wizard hat). The
 * collision box stays 16×24 — a big hat must never make you easier to hit.
 * Draw with `drawPlayer()` below, which takes the body's top-left and applies
 * the headroom offset; never call Sprites.draw on a player key directly.
 *
 * A skin = outfit colors (palette.js) + an optional hat id (hats.js). Both are
 * data, so a new outfit is one catalog entry and needs no code here.
 *
 * On import this registers every catalog skin into Sprites.cache under the keys
 * the player reads: default → 'playerRight'/'playerLeft' (+ 'Tinted' for the
 * copper industrial rounds 3 & 4); others → 'playerRight_<id>' etc.
 */

import { Sprites, mkCanvas, flipH, tintSprite } from '../sprites.js';
import { byType } from './catalog.js';
import { buildPalette, BASE_PALETTE } from './palette.js';
import { drawHat } from './hats.js';
import { getCustom } from './store.js';

// Copper wash applied to the player in the industrial rounds (3 & 4).
export const INDUSTRIAL_TINT = '#cc7733';

export const BODY_W = 16;
export const BODY_H = 24;         // the player's actual size — and its hitbox
export const HAT_ROWS = 4;        // headroom above the head, hats only
export const SPRITE_H = BODY_H + HAT_ROWS;

export { BASE_PALETTE };

/**
 * Draw a player sprite. (bodyX, bodyY) is the top-left of the 16×24 BODY; the
 * hat headroom is drawn above it, outside the hitbox.
 */
export function drawPlayer(ctx, name, bodyX, bodyY, opts = {}) {
  const scale = opts.scale || 1;
  Sprites.draw(ctx, name, bodyX, bodyY - HAT_ROWS * scale, opts);
}

// Build the 4 animation frames (0=idle, 1=walk-a, 2=walk-b, 3=jump).
export function buildPlayerFrames(palette = BASE_PALETTE, hatId = null) {
  const P = palette;
  const Y = HAT_ROWS;   // every body pixel sits this far down the taller canvas

  // [leftLegX, leftLegY, leftLegH, rightLegX, rightLegY, rightLegH, bootY]
  const legData = [
    [3, 14, 5, 9, 14, 5, 19],   // idle
    [2, 13, 6, 10, 15, 4, 19],  // walk-a
    [4, 15, 4,  8, 13, 6, 19],  // walk-b
    [2, 15, 4, 10, 15, 4, 19],  // jump
  ];

  return legData.map(([lx, ly, lh, rx, ry, rh, by]) => {
    const c = mkCanvas(BODY_W, SPRITE_H);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Helmet — only when no headgear is equipped; a hat replaces it.
    if (!hatId) {
      ctx.fillStyle = P.helmetDark;
      ctx.fillRect(4, Y + 0, 8, 1);
      ctx.fillRect(2, Y + 1, 12, 1);
      ctx.fillRect(2, Y + 2, 12, 3);
      ctx.fillStyle = P.helmetMid;
      ctx.fillRect(3, Y + 2, 10, 1);
      ctx.fillRect(3, Y + 3, 10, 1);
      ctx.fillStyle = P.helmetShadow;
      ctx.fillRect(2, Y + 4, 12, 1);
    }

    // Face
    ctx.fillStyle = P.skin;
    ctx.fillRect(2, Y + 5, 12, 4);
    ctx.fillStyle = P.visor;
    ctx.fillRect(2, Y + 5, 12, 1);
    ctx.fillStyle = P.eye;
    ctx.fillRect(9, Y + 6, 2, 2);
    ctx.fillStyle = P.eyeGlint;
    ctx.fillRect(9, Y + 6, 1, 1);
    ctx.fillStyle = P.skinShadow;
    ctx.fillRect(6, Y + 7, 1, 1);
    ctx.fillRect(2, Y + 8, 12, 1);

    // Headgear goes ON TOP of the face, so a veil / visor / eye patch can cover
    // it. Grids that stop at row 8 (a cap, a crown) leave the face untouched.
    if (hatId) drawHat(ctx, hatId, P);

    // Neck
    ctx.fillStyle = P.jacketDark;
    ctx.fillRect(5, Y + 9, 6, 1);

    // Jacket
    ctx.fillStyle = P.jacketMid;
    ctx.fillRect(2, Y + 10, 12, 4);
    ctx.fillStyle = P.jacketHi;
    ctx.fillRect(4, Y + 10, 5, 3);
    ctx.fillStyle = P.jacketDark;
    ctx.fillRect(3, Y + 11, 2, 2);
    ctx.fillRect(11, Y + 11, 2, 2);

    // Gun
    ctx.fillStyle = P.gun;
    ctx.fillRect(13, Y + 11, 3, 2);
    ctx.fillStyle = P.gunDark;
    ctx.fillRect(14, Y + 12, 2, 1);
    ctx.fillStyle = P.gunGlint;
    ctx.fillRect(15, Y + 11, 1, 1);

    // Belt
    ctx.fillStyle = P.beltDark;
    ctx.fillRect(2, Y + 13, 12, 1);
    ctx.fillStyle = P.buckle;
    ctx.fillRect(6, Y + 13, 4, 1);

    // Legs
    ctx.fillStyle = P.legMid;
    ctx.fillRect(lx, Y + ly, 4, lh);
    ctx.fillRect(rx, Y + ry, 4, rh);
    ctx.fillStyle = P.legHi;
    ctx.fillRect(lx + 1, Y + ly, 2, Math.max(lh - 1, 1));
    ctx.fillRect(rx + 1, Y + ry, 2, Math.max(rh - 1, 1));

    // Boots
    ctx.fillStyle = P.bootDark;
    ctx.fillRect(lx - 1, Y + by, 6, 2);
    ctx.fillRect(rx - 1, Y + by, 6, 2);
    ctx.fillStyle = P.bootToe;
    ctx.fillRect(lx + 3, Y + by, 2, 2);
    ctx.fillRect(rx + 3, Y + by, 2, 2);

    return c;
  });
}

/** Sprite-cache key for a skin id (null / unknown → the base Ranger keys). */
export function skinKey(skinId, facingRight, tinted) {
  const facing = facingRight ? 'playerRight' : 'playerLeft';
  const keyed = skinId ? `${facing}_${skinId}` : facing;
  const base = Sprites.cache[keyed] ? keyed : facing;
  return base + (tinted ? 'Tinted' : '');
}

/** Put one skin's four sprite sets into the cache (facing × normal/tinted). */
function register(id, frames) {
  const isDefault = id === 'skin_default';
  const R = isDefault ? 'playerRight' : `playerRight_${id}`;
  const L = isDefault ? 'playerLeft'  : `playerLeft_${id}`;
  Sprites.cache[R] = frames;
  Sprites.cache[L] = frames.map(flipH);
  Sprites.cache[`${R}Tinted`] = frames.map(f => tintSprite(f, INDUSTRIAL_TINT));
  Sprites.cache[`${L}Tinted`] = frames.map(f => tintSprite(flipH(f), INDUSTRIAL_TINT));
}

// Register every catalog skin into Sprites.cache.
export function initSkins() {
  for (const skin of byType('skin')) {
    const p = skin.params || {};
    register(skin.id, buildPlayerFrames(buildPalette(p.colors, p.palette), p.hat || null));
  }
}

/**
 * Rebuild 'skin_custom' from a player's mixed design.
 *
 * Every other skin is baked once at import from the static catalog. This one
 * can't be: its colors live in the player's store, so it has to be rebuilt
 * whenever the player changes (or changes their design). Call it on player
 * select and after every edit in the mixer.
 */
export function rebuildCustom(player) {
  const c = getCustom(player) || {};
  register('skin_custom', buildPlayerFrames(buildPalette(c.colors), c.hat || null));
}

// Run at import so the cache is ready before any Player is drawn.
initSkins();
