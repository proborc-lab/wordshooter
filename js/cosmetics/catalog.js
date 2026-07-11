/**
 * catalog.js — Single source of truth for every cosmetic item.
 *
 * ▸ Adding a new cosmetic = add ONE entry to COSMETICS below. No code changes
 *   anywhere else. This is the extensibility contract (see CLAUDE.md: config
 *   objects, not variant chains).
 *
 * Per type, the item's `params` drives its own subsystem:
 *   hitEffect → the emitter in ../effects.js (visual style + numbers)
 *   skin      → sprite palette/parts in ./skins.js         (wired later)
 *   follower  → the follower entity in ../entities/follower.js (wired later)
 *
 * Unlock routes:
 *   cost: <number>                     → buyable in the coin shop
 *   unlockWhen: 'undeniableVictory'    → granted by the effect ladder, one per
 *                                        Onbetwistbare Overwinning (in list order)
 *   builtin: true                      → always owned, never shown in the shop
 *   hidden: true                       → owned/used internally, not user-facing
 *
 * ── hitEffect params — TWO kinds ─────────────────────────────────────────────
 * kind: 'particles' (default) → a burst sprayed from the box centre; the box
 *   just vanishes. Schema below. Rendered by effects.js.
 * kind: 'boxAnim' → the BOX ITSELF animates (freezes, inflates, folds). It
 *   replaces the green flash. Rendered by boxfx.js. Schema:
 *     duration  : seconds the animation runs
 *     transform : { scale|scaleX|scaleY: [from,to], rotate: <max rad>,
 *                   dy: [from,to] px drift, shake: <px>, fadeFrom: 0..1 }
 *     tint      : { color, alpha: [from,to] } — a wash over the box
 *     burst     : particle params (schema below) + `at`: 0..1, fired once
 *     paint     : optional key in boxfx.js PAINTS ('puzzle'|'chomp'|'ufo') for
 *                 a look no transform can express
 *
 * ── particle params schema ───────────────────────────────────────────────────
 *   style   : render primitive key in effects.js STYLES ('square'|'spark'|'circle')
 *   count   : number of particles
 *   speed   : [min, max] initial speed (px/s)
 *   angle   : [min, max] emission angle in degrees — 0=right, -90=up, 90=down,
 *             [-180,180]=radial
 *   gravity : px/s² (negative = rises, e.g. fire)
 *   drag    : optional velocity damping per second (0 = none)
 *   size    : [min, max] particle size (px)
 *   life    : [min, max] lifetime (s)
 *   colors  : array of hex colors (picked at random per particle)
 *   spin    : optional max spin (rad/s, ±)
 */

import { OUTFITS } from './outfits.js';
import { FOLLOWERS } from './followers.js';

export const COSMETICS = [
  // ── HIT EFFECTS ─────────────────────────────────────────────────────────────
  // Built-in fallbacks (always available, not in the shop):
  {
    id: 'default', type: 'hitEffect', name: 'Standaard', builtin: true,
    params: {
      style: 'square', count: 12, speed: [80, 300], angle: [-180, 180],
      gravity: 400, size: [2, 7], life: [0.2, 0.6], colors: ['#44ff44'],
    },
  },
  {
    id: 'reject', type: 'hitEffect', name: 'Mis', builtin: true, hidden: true,
    params: {
      style: 'square', count: 10, speed: [60, 220], angle: [-180, 180],
      gravity: 420, size: [2, 6], life: [0.15, 0.4], colors: ['#ff4444'],
    },
  },

  // Unlockable via Onbetwistbare Overwinning — the ladder order IS this order:
  {
    id: 'fx_fire', type: 'hitEffect', name: 'Vuur', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      style: 'square', count: 22, speed: [50, 170], angle: [-125, -55],
      gravity: -260, drag: 1.6, size: [3, 7], life: [0.3, 0.7],
      colors: ['#ff3300', '#ff7a00', '#ffc400', '#ffe680'],
    },
  },
  {
    id: 'fx_melt', type: 'hitEffect', name: 'Smelten', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      style: 'circle', count: 16, speed: [15, 65], angle: [55, 125],
      gravity: 540, size: [3, 8], life: [0.5, 1.0],
      colors: ['#7ec850', '#4a8a2a', '#a6e86a', '#3f7a24'],
    },
  },
  {
    id: 'fx_explode', type: 'hitEffect', name: 'Exploderen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      style: 'square', count: 28, speed: [160, 460], angle: [-180, 180],
      gravity: 180, drag: 0.8, size: [2, 8], life: [0.25, 0.6],
      colors: ['#ffffff', '#ffd23f', '#ff8800', '#aa3300', '#888888'],
    },
  },
  {
    id: 'fx_zap', type: 'hitEffect', name: 'Zappen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      style: 'spark', count: 18, speed: [220, 520], angle: [-180, 180],
      gravity: 0, size: [2, 5], life: [0.1, 0.28],
      colors: ['#aef2ff', '#4fd0ff', '#ffffff', '#66ccff'],
    },
  },

  // Box-anims — the box itself is the effect. Ladder continues in this order.
  {
    id: 'fx_freeze', type: 'hitEffect', name: 'Bevriezen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.85,
      transform: { scale: [1, 1.05], fadeFrom: 0.8 },
      tint: { color: '#8fd8ff', alpha: [0, 0.9] },
      burst: {
        at: 0.8, style: 'square', count: 20, speed: [90, 280], angle: [-180, 180],
        gravity: 480, size: [2, 7], life: [0.3, 0.7],
        colors: ['#ffffff', '#dff4ff', '#8fd8ff', '#4aa8d8'],
      },
    },
  },
  {
    id: 'fx_stone', type: 'hitEffect', name: 'Verstenen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.9,
      transform: { shake: 2, fadeFrom: 0.82 },
      tint: { color: '#8a8a82', alpha: [0, 0.95] },
      burst: {
        at: 0.82, style: 'square', count: 22, speed: [40, 190], angle: [-180, 180],
        gravity: 620, size: [3, 8], life: [0.4, 0.9],
        colors: ['#b0b0a8', '#8a8a82', '#5f5f58', '#3d3d38'],
      },
    },
  },
  {
    id: 'fx_balloon', type: 'hitEffect', name: 'Ballooning', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 1.0,
      transform: { scale: [1, 1.9], dy: [0, -120], rotate: 0.3, fadeFrom: 0.6 },
      tint: { color: '#f070b0', alpha: [0, 0.45] },
      burst: {
        at: 0.94, style: 'square', count: 14, speed: [120, 320], angle: [-180, 180],
        gravity: 300, size: [2, 5], life: [0.2, 0.45],
        colors: ['#f070b0', '#ffb0d8', '#ffffff'],
      },
    },
  },
  {
    id: 'fx_ufo', type: 'hitEffect', name: 'UFO', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 1.1, paint: 'ufo',
      beamColor: '#7fe8f0', beamHeight: 130,
      transform: { scale: [1, 0.35], dy: [0, -95], rotate: 0.5, fadeFrom: 0.72 },
      burst: {
        at: 0.96, style: 'spark', count: 12, speed: [150, 380], angle: [-180, 180],
        gravity: 0, size: [2, 4], life: [0.1, 0.25],
        colors: ['#aef2ff', '#7fe8f0', '#ffffff'],
      },
    },
  },
  {
    id: 'fx_shrink', type: 'hitEffect', name: 'Krimpen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.55,
      transform: { scale: [1, 0], rotate: 0.9, fadeFrom: 0.85 },
      burst: {
        at: 0.9, style: 'circle', count: 10, speed: [60, 200], angle: [-180, 180],
        gravity: 260, size: [2, 5], life: [0.2, 0.4],
        colors: ['#c0e090', '#88cc55'],
      },
    },
  },
  {
    id: 'fx_shake', type: 'hitEffect', name: 'Trillen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.65,
      transform: { shake: 10, scale: [1, 0.85], fadeFrom: 0.6 },
      burst: {
        at: 0.75, style: 'square', count: 18, speed: [70, 240], angle: [-180, 180],
        gravity: 520, size: [2, 6], life: [0.25, 0.55],
        colors: ['#c0e090', '#5a7a3a', '#2d3a1a'],
      },
    },
  },
  {
    id: 'fx_puzzle', type: 'hitEffect', name: 'Puzzelstukjes', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.85, paint: 'puzzle', spread: 55,
      transform: { rotate: 0.2 },
    },
  },
  {
    id: 'fx_chomp', type: 'hitEffect', name: 'Happen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.75, paint: 'chomp', bites: 5,
      transform: { fadeFrom: 0.9 },
      burst: {
        at: 0.92, style: 'square', count: 12, speed: [60, 200], angle: [-180, 180],
        gravity: 480, size: [2, 6], life: [0.2, 0.5],
        colors: ['#ffd23f', '#c0e090'],
      },
    },
  },
  {
    id: 'fx_fold', type: 'hitEffect', name: 'Opvouwen', cost: null,
    unlockWhen: 'undeniableVictory',
    params: {
      kind: 'boxAnim', duration: 0.6,
      transform: { scaleY: [1, 0], scaleX: [1, 1.15], fadeFrom: 0.75 },
      burst: {
        at: 0.85, style: 'square', count: 10, speed: [80, 240], angle: [-30, -150],
        gravity: 420, size: [2, 5], life: [0.2, 0.45],
        colors: ['#c0e090', '#5a7a3a'],
      },
    },
  },

  // ── SKINS (coin shop) — the wardrobe lives in outfits.js ──────────────────
  ...OUTFITS,

  // ── FOLLOWERS (coin shop) — the roster lives in followers.js ──────────────
  ...FOLLOWERS,
];

// ── Lookups ──────────────────────────────────────────────────────────────────

const _byId = new Map(COSMETICS.map(c => [c.id, c]));

export function getCosmetic(id) {
  return _byId.get(id) || null;
}

export function byType(type) {
  return COSMETICS.filter(c => c.type === type);
}

/** Purchasable items of a type (for the shop): have a cost, not builtin/hidden. */
export function shopItems(type) {
  return COSMETICS.filter(c => c.type === type && c.cost != null && !c.hidden);
}

/** Hit-effects granted by Onbetwistbare Overwinning, in unlock order. */
export function effectLadder() {
  return COSMETICS.filter(c => c.type === 'hitEffect' && c.unlockWhen === 'undeniableVictory');
}
