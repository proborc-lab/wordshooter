/**
 * store.js — Per-player cosmetic ownership, coins and equipped loadout.
 *
 * Persistence mirrors leaderboard.js: one localStorage key per player, wrapped
 * in try/catch. State shape:
 *   { coins, owned:[id...], equipped:{ skin, follower, hitEffect } }
 */

import { getCosmetic, effectLadder, byType } from './catalog.js';
import { getSwatch, isFree } from './swatches.js';
import { readJSON, writeJSON } from '../storage.js';
import { CONFIG } from '../config.js';

const KEY = 'wordshooter_cosmetics';

function keyFor(player) {
  return `${KEY}_${(player || '').trim()}`;
}

function defaults() {
  return {
    coins: 0,
    owned: [],
    equipped: { skin: null, follower: null, hitEffect: 'default' },
    // The colour mixer: paint you've bought, and the one outfit you designed.
    swatches: [],
    custom: { colors: {}, hat: null },
  };
}

function load(player) {
  const base = defaults();
  const s = readJSON(keyFor(player), null);
  if (!s) return base;
  return {
    ...base,
    ...s,
    equipped: { ...base.equipped, ...(s.equipped || {}) },
    owned: Array.isArray(s.owned) ? s.owned : [],
    swatches: Array.isArray(s.swatches) ? s.swatches : [],
    custom: { ...base.custom, ...(s.custom || {}) },
  };
}

function save(player, state) {
  writeJSON(keyFor(player), state);
}

// ── Reads ──────────────────────────────────────────────────────────────────

export function getState(player) {
  return load(player);
}

export function getCoins(player) {
  return load(player).coins;
}

export function isOwned(player, id) {
  const c = getCosmetic(id);
  if (c && c.builtin) return true;
  return load(player).owned.includes(id);
}

export function getEquipped(player) {
  return load(player).equipped;
}

// ── Writes ───────────────────────────────────────────────────────────────────

export function addCoins(player, n) {
  const s = load(player);
  s.coins += n;
  save(player, s);
  return s.coins;
}

export function equip(player, id) {
  const c = getCosmetic(id);
  if (!c || !isOwned(player, id)) return false;
  const s = load(player);
  s.equipped[c.type] = id;
  save(player, s);
  return true;
}

/** Clear a slot (e.g. "no follower"). hitEffect falls back to the default. */
export function unequip(player, slot) {
  const s = load(player);
  s.equipped[slot] = slot === 'hitEffect' ? 'default' : null;
  save(player, s);
  return true;
}

/** Buy a shop item (skin/follower). Returns { ok, reason? }. */
export function buy(player, id) {
  const c = getCosmetic(id);
  if (!c || c.cost == null) return { ok: false, reason: 'not-for-sale' };
  const s = load(player);
  if (s.owned.includes(id)) return { ok: false, reason: 'owned' };
  if (s.coins < c.cost) return { ok: false, reason: 'insufficient' };
  s.coins -= c.cost;
  s.owned.push(id);
  s.equipped[c.type] = id; // auto-equip the fresh purchase
  save(player, s);
  return { ok: true };
}

// ── Colour mixer ─────────────────────────────────────────────────────────────

/**
 * The mixer is EARNED, not given. It can reproduce any colour outfit for less
 * than the outfit costs, so opening it on day one would make the whole 200-800
 * wardrobe pointless. It exists to keep coins worth having once the wardrobe is
 * exhausted — so it opens once the player has worked through most of it.
 *
 * Returns { unlocked, owned, needed }.
 */
export function mixerStatus(player) {
  const s = load(player);
  const buyable = byType('skin').filter(c => !c.builtin);
  const owned = buyable.filter(c => s.owned.includes(c.id)).length;
  const needed = CONFIG.mixer.unlockOutfits;
  return { unlocked: owned >= needed, owned, needed };
}

/** Paint you may use: the free starters plus everything you've bought. */
export function ownsSwatch(player, id) {
  if (isFree(id)) return true;
  return load(player).swatches.includes(id);
}

/** Buy paint. Once bought it works in every region, forever. */
export function buySwatch(player, id) {
  const sw = getSwatch(id);
  if (!sw) return { ok: false, reason: 'unknown' };
  const s = load(player);
  if (isFree(id) || s.swatches.includes(id)) return { ok: false, reason: 'owned' };
  if (s.coins < sw.cost) return { ok: false, reason: 'insufficient' };
  s.coins -= sw.cost;
  s.swatches.push(id);
  save(player, s);
  return { ok: true };
}

/**
 * Hats you may put on your OWN design: the ones from outfits you own.
 * That's on purpose — it keeps the wardrobe worth buying after the mixer
 * exists. You're not buying one look, you're buying a building block.
 */
export function availableHats(player) {
  const s = load(player);
  return byType('skin')
    .filter(c => c.params && c.params.hat)
    .filter(c => c.builtin || s.owned.includes(c.id))
    .map(c => ({ hat: c.params.hat, from: c.name }));
}

export function getCustom(player) {
  return load(player).custom;
}

/** Mixing itself is free — you already paid for the paint. */
export function setCustom(player, custom) {
  const s = load(player);
  s.custom = { colors: { ...(custom.colors || {}) }, hat: custom.hat || null };
  save(player, s);
  return s.custom;
}

/**
 * Grant the next effect on the Onbetwistbare Overwinning ladder.
 * Auto-equips it so it shows next game. Returns the granted catalog item, or
 * null when every effect is already owned (awards bonus coins instead, so the
 * milestone never becomes a dead reward).
 */
export function unlockNextEffect(player) {
  const s = load(player);
  const next = effectLadder().find(fx => !s.owned.includes(fx.id));
  if (!next) {
    s.coins += CONFIG.coinsPerUndeniableAllOwned;
    save(player, s);
    return null;
  }
  s.owned.push(next.id);
  s.equipped.hitEffect = next.id;
  save(player, s);
  return next;
}
