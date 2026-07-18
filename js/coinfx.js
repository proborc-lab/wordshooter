/**
 * coinfx.js — Screen-space "coins fly to the counter" flourish.
 *
 * Cosmetic only: coins are already credited (and persisted) the instant a
 * correct answer lands. These sprites just spray from the crate and home to the
 * HUD coin counter, giving the reward a satisfying "cha-ching" without ever
 * being missable — so earning stays deterministic and attention stays on the
 * words.
 */

import { CONFIG } from './config.js';

const coins = [];
let bump = 0;                 // 0..1 pulse for the HUD counter when coins land

/** Spawn a burst at screen position (sx, sy) — the hit crate's on-screen spot. */
export function spawn(sx, sy, n = CONFIG.coinFx.count) {
  if (coins.length > CONFIG.coinFx.max) return;
  for (let i = 0; i < n; i++) {
    coins.push({
      sx, sy,                                   // start (screen space)
      x: sx, y: sy,
      t: -i * 0.06,                             // slight stagger
      dur: CONFIG.coinFx.flightTime * (0.9 + Math.random() * 0.25),
      arc: 40 + Math.random() * 45,             // hop height
      jx: (Math.random() - 0.5) * 26,           // start jitter
    });
  }
}

/** Advance coins toward the HUD counter at (tx, ty); cull arrivals, set bump. */
export function update(dt, tx, ty) {
  let arrived = 0;
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.t += dt;
    if (c.t < 0) continue;
    const p = Math.min(1, c.t / c.dur);
    const e = p * p * (3 - 2 * p);              // smoothstep
    const startX = c.sx + c.jx;
    c.x = startX + (tx - startX) * e;
    c.y = c.sy + (ty - c.sy) * e - Math.sin(p * Math.PI) * c.arc;
    if (c.t >= c.dur) { coins.splice(i, 1); arrived++; }
  }
  if (arrived) bump = 1;
  if (bump > 0) bump = Math.max(0, bump - dt * 5);
}

export function draw(ctx) {
  for (const c of coins) {
    if (c.t < 0) continue;
    const p = Math.min(1, c.t / c.dur);
    const r = CONFIG.coinFx.size - p * (CONFIG.coinFx.size * 0.3);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8860b';
    ctx.beginPath(); ctx.arc(c.x, c.y, r, Math.PI * 0.3, Math.PI * 1.15); ctx.fill();
    ctx.fillStyle = '#fff2a8';
    ctx.fillRect(c.x - 1, c.y - r + 1, 2, 2);
    ctx.restore();
  }
}

/** 0..1 pulse for the HUD counter to bump when coins arrive. */
export function counterBump() { return bump; }

/** Reset between games. */
export function clear() { coins.length = 0; bump = 0; }
