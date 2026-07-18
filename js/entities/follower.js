/**
 * follower.js — Cosmetic companion that trails the player.
 *
 * Purely decorative: never collides, never blocks, is never hit. It eases
 * toward a point behind + above the player with a gentle bob, and plays a
 * little emote on correct/miss answers (light, transient positive feedback —
 * no punishment).
 *
 * Config-driven: a new follower = one grid in follower-art.js + one catalog
 * entry pointing at it (params.sprite). No code changes here.
 * Per-follower motion tuning (lag/bob/offset) can override CONFIG.follower via
 * the catalog entry's params.
 */

import { Sprites, mkCanvas } from '../sprites.js';
import { getCosmetic } from '../cosmetics/catalog.js';
import { CONFIG } from '../config.js';
import { FOLLOWER_ART, PALETTE, SIZE, duplicateKeys } from './art/index.js';

// ── Sprite rendering — grids in follower-art.js become canvases ──────────────

/** One frame grid → a SIZE×SIZE canvas. Short/missing rows are simply blank. */
function renderFrame(rows) {
  const c = mkCanvas(SIZE, SIZE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  rows.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      const hex = PALETTE[line[x]];
      if (!hex) continue;
      ctx.fillStyle = hex;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

export function initFollowers() {
  const dupes = duplicateKeys();
  if (dupes.length) {
    // Two theme files claiming the same key would silently clobber each other's
    // art. Better to shout at load than to ship a mystery sprite.
    console.error('follower-art: duplicate grid keys across themes:', dupes.join(', '));
  }
  for (const key in FOLLOWER_ART) {
    Sprites.cache[`follower_${key}`] = FOLLOWER_ART[key].map(renderFrame);
  }
}

// ── Entity ───────────────────────────────────────────────────────────────────

export class Follower {
  /**
   * `overrides` win over the catalog params — the locker draws the player at 4×
   * instead of the in-game 2×, so it needs its own scale and offsets (see
   * CONFIG.lockerFollower). Same keys as params: scale, offsetX, offsetY, bob…
   */
  constructor(id, overrides = {}) {
    const c = getCosmetic(id);
    const p = { ...((c && c.params) || {}), ...overrides };
    const d = CONFIG.follower;
    this.spriteKey = `follower_${p.sprite || 'ghost'}`;
    this.lag      = p.lag      != null ? p.lag      : d.lag;
    this.bobAmp   = p.bob      != null ? p.bob      : d.bobAmplitude;
    this.bobSpeed = p.bobSpeed != null ? p.bobSpeed : d.bobSpeed;
    this.offsetX  = p.offsetX  != null ? p.offsetX  : d.offsetX;
    this.offsetY  = p.offsetY  != null ? p.offsetY  : d.offsetY;
    this.alpha    = p.alpha    != null ? p.alpha    : d.alpha;
    this.scale    = p.scale    != null ? p.scale    : 2;
    this.fps      = p.fps      != null ? p.fps      : d.fps;

    this.x = 0;
    this.y = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.frame = 0;
    this.animTimer = 0;
    this.initialized = false;
    this.emoteType = null;
    this.emoteTimer = 0;
    this.emoteDur = 0;
  }

  emote(type) {
    this.emoteType = type;
    this.emoteDur = type === 'correct' ? 0.45 : 0.3;
    this.emoteTimer = this.emoteDur;
  }

  update(dt, player) {
    const dir = player.facingRight ? 1 : -1;
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    this.phase += this.bobSpeed * dt;

    const targetX = pcx + dir * this.offsetX;                       // behind the player
    const targetY = pcy + this.offsetY + Math.sin(this.phase) * this.bobAmp;

    if (!this.initialized) {
      this.x = targetX;
      this.y = targetY;
      this.initialized = true;
    } else {
      const t = 1 - Math.pow(1 - this.lag, dt * 60);               // frame-rate independent ease
      this.x += (targetX - this.x) * t;
      this.y += (targetY - this.y) * t;
    }

    // Cycle through ALL frames, not just two. This used to be `frame ^= 1`,
    // which silently capped every follower at a 2-frame flip — a 10-frame gag
    // would have played frames 0 and 1 and thrown the punchline away.
    this.animTimer += dt;
    if (this.animTimer > 1 / this.fps) {
      this.animTimer = 0;
      const frames = Sprites.cache[this.spriteKey];
      const n = frames ? frames.length : 1;
      this.frame = (this.frame + 1) % n;
    }
    if (this.emoteTimer > 0) this.emoteTimer = Math.max(0, this.emoteTimer - dt);
  }

  draw(ctx, cameraX) {
    const cache = Sprites.cache[this.spriteKey];
    if (!cache) return;
    const img = cache[this.frame % cache.length];
    const w = img.width * this.scale;
    const h = img.height * this.scale;

    let rot = 0, dy = 0, a = this.alpha;
    if (this.emoteTimer > 0) {
      const p = this.emoteTimer / this.emoteDur;                   // 1 → 0
      if (this.emoteType === 'correct') {
        rot = p * Math.PI * 2;                                     // one celebratory spin
        dy = -Math.sin((1 - p) * Math.PI) * 9;                     // and a hop
      } else {
        dy = Math.sin((1 - p) * Math.PI) * 7;                      // brief droop
        a *= 0.45 + 0.55 * (1 - Math.sin((1 - p) * Math.PI));
      }
    }

    const sx = this.x - cameraX;
    const sy = this.y + dy;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.imageSmoothingEnabled = false;
    if (rot) {
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, Math.round(sx - w / 2), Math.round(sy - h / 2), w, h);
    }
    ctx.restore();
  }
}

// Register sprites at import so the cache is ready before any Follower draws.
initFollowers();
