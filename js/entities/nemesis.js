/**
 * nemesis.js — The word that got away, come back for you.
 *
 * A word he keeps missing escapes, and returns as a creature: a STACK of word
 * boxes for a body, two little legs, two spindly arms, two eyes on stalks. One
 * of the boxes is the answer; the others are the words he actually confuses it
 * with (see wordstats.js — his own confusion, handed back to him).
 *
 * The difficulty is physical, not textual. This game has three verbs — move,
 * jump, shoot — and the Nemesis uses all three: the answer may be the top box or
 * the bottom one, so knowing the word isn't enough, he has to jump to the right
 * height and land the shot. No typing, no new keys, no homework.
 *
 * The body segments are real WordBoxes, so every hit-effect works on them for
 * free: you can freeze the Nemesis, fold it shut, or have a UFO take it away.
 *
 * It never punishes twice. Shooting a wrong segment costs exactly what shooting
 * a wrong box costs — one heart — and the creature stays whole, so elimination
 * is not a strategy.
 */

import { WordBox } from '../entities.js';
import { CONFIG } from '../config.js';

const SEG_W = 130;
const SEG_H = 52;
const LEG_H = 24;

export class Nemesis {
  /**
   * `items` — [{ word, isCorrect }], bottom of the stack first.
   * (x, y) is where its FEET stand.
   */
  constructor(x, y, items) {
    this.x = x;
    this.y = y;                              // ground line under its feet
    this.alive = true;
    this.beaten = false;                     // the answer segment was hit
    this.width = SEG_W;
    this.height = items.length * SEG_H + LEG_H;

    this.dir = -1;                           // it walks toward the player
    this.speed = CONFIG.nemesis.walkSpeed;
    this.homeX = x;
    this.range = 130;
    this.t = 0;

    // Bottom segment first, so index 0 sits on the legs.
    this.segments = items.map((it, i) => {
      const box = new WordBox(0, 0, it.word, it.isCorrect);
      box.width = SEG_W;
      box.height = SEG_H;
      box.isNemesisSegment = true;
      box.stackIndex = i;
      return box;
    });
  }

  /** Screen-space top-left of a segment, bottom of the stack = index 0. */
  _segY(i) {
    return this.y - LEG_H - (i + 1) * SEG_H;
  }

  update(dt) {
    this.t += dt;

    // Paces back and forth around where it appeared.
    this.x += this.dir * this.speed * dt;
    if (Math.abs(this.x - this.homeX) > this.range) this.dir = -this.dir;

    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      s.x = this.x;
      s.y = this._segY(i);
      s.update(dt);
    }

    // It's done once the answer segment has finished dissolving.
    if (this.beaten && this.segments.every(s => s.state === 'destroyed' || !s.isCorrect)) {
      this.alive = false;
    }
  }

  /** Which segment did this projectile hit? null = a miss. */
  segmentAt(projectile) {
    for (const s of this.segments) {
      if (s.state !== 'normal') continue;
      if (projectile.x < s.x + s.width && projectile.x + projectile.width > s.x &&
          projectile.y < s.y + s.height && projectile.y + projectile.height > s.y) {
        return s;
      }
    }
    return null;
  }

  /** The right one was hit. The creature collapses. */
  defeat() {
    this.beaten = true;
  }

  draw(ctx, cameraX) {
    const sx = Math.round(this.x - cameraX);
    const topY = this._segY(this.segments.length - 1);
    const feetY = this.y;
    const bob = Math.sin(this.t * 6) * 2;                 // the walk cycle
    const cx = sx + SEG_W / 2;

    // ── Legs ────────────────────────────────────────────────────────────────
    // They alternate, so it plods rather than slides.
    ctx.fillStyle = '#4a3520';
    const stride = Math.sin(this.t * 6) * 6;
    ctx.fillRect(cx - 28 + stride, feetY - LEG_H, 12, LEG_H);
    ctx.fillRect(cx + 16 - stride, feetY - LEG_H, 12, LEG_H);
    ctx.fillStyle = '#2a1e12';                            // feet
    ctx.fillRect(cx - 34 + stride, feetY - 6, 22, 6);
    ctx.fillRect(cx + 12 - stride, feetY - 6, 22, 6);

    // ── Arms ────────────────────────────────────────────────────────────────
    const armY = this._segY(Math.max(0, this.segments.length - 2)) + SEG_H / 2;
    const swing = Math.sin(this.t * 6 + Math.PI) * 6;
    ctx.strokeStyle = '#6a5238';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx + 2, armY);
    ctx.lineTo(sx - 24, armY + 12 + swing);
    ctx.moveTo(sx + SEG_W - 2, armY);
    ctx.lineTo(sx + SEG_W + 24, armY + 12 - swing);
    ctx.stroke();
    ctx.fillStyle = '#6a5238';                            // little hands
    ctx.beginPath();
    ctx.arc(sx - 25, armY + 13 + swing, 5, 0, Math.PI * 2);
    ctx.arc(sx + SEG_W + 25, armY + 13 - swing, 5, 0, Math.PI * 2);
    ctx.fill();

    // ── The body: real word boxes ───────────────────────────────────────────
    // A pulsing violet aura first, so it reads as THE NEMESIS at a glance and
    // not as three crates that happen to be stacked. Violet is already the
    // game's "something special is going on" colour (locked effects use it).
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 3);
    ctx.save();
    ctx.strokeStyle = '#b98cff';
    ctx.globalAlpha = 0.35 + pulse * 0.35;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#b98cff';
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.strokeRect(sx - 4, topY - 4, SEG_W + 8,
                   this.segments.length * SEG_H + 8);
    ctx.restore();

    for (const s of this.segments) s.draw(ctx, cameraX);

    // ── Eyes on stalks ──────────────────────────────────────────────────────
    // They track the player-ish (they wobble), which is what makes it feel alive.
    const stalkY = topY - 2;
    const look = Math.sin(this.t * 2.2) * 2;
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    for (const dx of [-16, 16]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * 0.55, stalkY);
      ctx.lineTo(cx + dx, stalkY - 16 + bob);
      ctx.stroke();
    }
    for (const dx of [-16, 16]) {
      const ex = cx + dx, ey = stalkY - 18 + bob;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      ctx.arc(ex + look, ey + 1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
