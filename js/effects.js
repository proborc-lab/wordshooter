/**
 * effects.js — Config-driven particle emitter for box hit-effects.
 *
 * The whole point: a new effect is ONE catalog entry (see cosmetics/catalog.js).
 * Its `params` (style + numbers) fully describe the burst — no code changes here.
 * Only a genuinely new visual primitive needs a new key in STYLES below (rare).
 *
 * Ownership of particles stays with the box that spawned them (a box holds its
 * own `particles` array); this module provides build → step → draw so every box
 * behaves identically and exotic styles render correctly.
 */

import { getCosmetic } from './cosmetics/catalog.js';
import { CONFIG } from './config.js';

// The hit-effect the current player has equipped. Set once per game.
let _activeHit = 'default';

export function setActiveHit(id) {
  _activeHit = id || 'default';
}

export function getActiveHit() {
  return _activeHit;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

function paramsFor(id) {
  const c = getCosmetic(id);
  if (c && c.params && c.params.count) return c.params;
  return getCosmetic('default').params;
}

// ── Build ────────────────────────────────────────────────────────────────────

/** Build a burst of particles for effect `id` centred on (x, y). */
export function build(id, x, y) {
  return buildFrom(paramsFor(id), x, y);
}

/**
 * Build a burst straight from a params object — used by box-anims (boxfx.js),
 * whose closing shards/rubble live inside the anim's own params rather than in
 * a catalog entry of their own.
 */
export function buildFrom(p, x, y) {
  const count = Math.min(p.count || 12, CONFIG.effects.maxParticles);
  const out = [];
  for (let i = 0; i < count; i++) {
    const ang = rand(p.angle ? p.angle[0] : -180, p.angle ? p.angle[1] : 180) * Math.PI / 180;
    const spd = rand(p.speed ? p.speed[0] : 80, p.speed ? p.speed[1] : 260);
    const life = rand(p.life ? p.life[0] : 0.2, p.life ? p.life[1] : 0.6);
    out.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      gravity: p.gravity != null ? p.gravity : CONFIG.effects.defaultGravity,
      drag: p.drag || 0,
      size: rand(p.size ? p.size[0] : 2, p.size ? p.size[1] : 7),
      life,
      maxLife: life,
      color: pick(p.colors || ['#44ff44']),
      style: p.style || 'square',
      spin: p.spin ? rand(-p.spin, p.spin) : 0,
      angle: 0,
    });
  }
  return out;
}

/** The equipped hit-effect (correct answer). */
export function buildHit(x, y) {
  return build(_activeHit, x, y);
}

/** The fixed "wrong answer" reject burst. */
export function buildMiss(x, y) {
  return build('reject', x, y);
}

// ── Step ─────────────────────────────────────────────────────────────────────

/** Advance and cull a particle array; returns the survivors. */
export function step(particles, dt) {
  const alive = [];
  for (const pt of particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += pt.gravity * dt;
    if (pt.drag) {
      const f = Math.max(0, 1 - pt.drag * dt);
      pt.vx *= f;
      pt.vy *= f;
    }
    pt.angle += pt.spin * dt;
    pt.life -= dt;
    if (pt.life > 0) alive.push(pt);
  }
  return alive;
}

// ── Draw ─────────────────────────────────────────────────────────────────────

// Visual primitives. Add a key here only for a brand-new look; most effects
// just reuse these via their catalog `style` field.
const STYLES = {
  square(ctx, p, sx, sy) {
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
  },
  circle(ctx, p, sx, sy) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  },
  spark(ctx, p, sx, sy) {
    // Short streak drawn along the velocity vector — electric / zap look.
    const len = p.size * 2.4;
    const m = Math.hypot(p.vx, p.vy) || 1;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, p.size * 0.5);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - (p.vx / m) * len, sy - (p.vy / m) * len);
    ctx.stroke();
  },
};

/** Draw one particle. `p.style` selects the primitive. */
export function drawParticle(ctx, p, cameraX) {
  const sx = p.x - cameraX;
  const sy = p.y;
  // Fade out over the last 60% of the particle's life.
  const alpha = Math.min(1, p.life / (p.maxLife * 0.6));
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  (STYLES[p.style] || STYLES.square)(ctx, p, sx, sy);
  ctx.restore();
}

export const Effects = {
  setActiveHit, getActiveHit,
  build, buildFrom, buildHit, buildMiss,
  step, drawParticle,
};
