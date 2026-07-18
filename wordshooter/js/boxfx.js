/**
 * boxfx.js — Box destruction animations (the `kind: 'boxAnim'` hit-effects).
 *
 * The original effects (fire/melt/explode/zap) are particle bursts: effects.js
 * sprays them from the box centre and the box simply vanishes. These are a
 * SECOND kind of effect — the box itself freezes over, inflates and floats away,
 * folds shut, gets chomped. Same contract though: a new one is ONE catalog entry.
 *
 * Most are pure data: a transform curve (scale / rotate / drift / shake / fade),
 * an optional colour wash, and a particle burst fired near the end. Only the
 * three looks a transform genuinely cannot express get a painter in PAINTS —
 * splitting into puzzle pieces, being eaten, being beamed up.
 *
 * The caller passes a `body(ctx)` callback that paints the box normally, so
 * WordBox / SpellingBox / BonusBox each keep their own look for free — and a
 * painter may call it more than once, which is how the puzzle pieces work.
 */

import { getCosmetic } from './cosmetics/catalog.js';

/** The box-anim params for an effect id, or null if it's a particle effect. */
export function animFor(id) {
  const c = getCosmetic(id);
  const p = c && c.params;
  return p && p.kind === 'boxAnim' ? p : null;
}

const lerp = (a, b, t) => a + (b - a) * t;

/** A curve value: a [from, to] pair that interpolates, or a plain constant. */
function val(v, t, dflt) {
  if (v == null) return dflt;
  return Array.isArray(v) ? lerp(v[0], v[1], t) : v;
}

// ── Painters — only for looks a transform can't express ─────────────────────
//
// Two optional phases per painter:
//   before(ctx, r, t, p)         — drawn in plain screen space, BEFORE the box
//                                  transform. A tractor beam comes from the sky,
//                                  so it must not tumble along with the box.
//   body(ctx, r, t, p, washed)   — replaces the normal box paint, inside the
//                                  transform. `washed` paints the box + its tint,
//                                  and may be called more than once.

const PAINTS = {
  /** The box splits into four quarters that fly apart. */
  puzzle: {
    body(ctx, r, t, p, washed) {
      const off = t * (p.spread || 48);
      const quads = [[0, 0, -1, -1], [1, 0, 1, -1], [0, 1, -1, 1], [1, 1, 1, 1]];
      for (const [qx, qy, dx, dy] of quads) {
        ctx.save();
        ctx.globalAlpha *= 1 - t * 0.85;
        ctx.translate(dx * off, dy * off);
        ctx.beginPath();
        ctx.rect(r.x + qx * r.w / 2, r.y + qy * r.h / 2, r.w / 2, r.h / 2);
        ctx.clip();
        washed(ctx);
        ctx.restore();
      }
    },
  },

  /** Bites get taken out of the box, right to left. The holes are real holes. */
  chomp: {
    body(ctx, r, t, p, washed) {
      const bites = p.bites || 5;
      const rad = r.h * 0.52;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      for (let i = 0; i < bites; i++) {
        if (t * bites < i) break;
        const bx = r.x + r.w - (i + 0.5) * (r.w / bites);
        const by = r.y + (i % 2 ? r.h * 0.12 : r.h * 0.88);
        ctx.moveTo(bx + rad, by);
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
      }
      ctx.clip('evenodd');        // the bites become holes: background shows through
      washed(ctx);
      ctx.restore();
    },
  },

  /** A tractor beam from above lifts the box away. The beam never tumbles. */
  ufo: {
    before(ctx, r, t, p) {
      const beam = p.beamHeight || 120;
      const glow = Math.sin(Math.PI * Math.min(1, t * 1.3));
      ctx.globalAlpha *= 0.45 * glow;
      ctx.fillStyle = p.beamColor || '#7fe8f0';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 7, r.y - beam);
      ctx.lineTo(r.x + r.w / 2 + 7, r.y - beam);
      ctx.lineTo(r.x + r.w + 12, r.y + r.h);
      ctx.lineTo(r.x - 12, r.y + r.h);
      ctx.closePath();
      ctx.fill();
    },
  },
};

/**
 * Where the box VISUALLY is at time t.
 *
 * The transform only moves the box on screen — its logical x/y never change. So
 * a closing burst spawned at the box's own centre would erupt from the ground
 * while you watch the balloon float away overhead. Anything that spawns at the
 * box (particles, and any future flourish) must ask here instead.
 */
export function animCenter(p, r, t) {
  const tr = (p && p.transform) || {};
  return {
    x: r.x + r.w / 2 + val(tr.dx, t, 0),
    y: r.y + r.h / 2 + val(tr.dy, t, 0),
  };
}

/**
 * Draw a box mid-dissolve. `t` runs 0 → 1 across the effect's duration.
 * `body(ctx)` paints the box at its normal screen position.
 */
export function drawDissolve(ctx, p, r, t, body) {
  const tr = p.transform || {};
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;

  // Fade only over the tail, so the word stays readable for most of the anim.
  const from = tr.fadeFrom != null ? tr.fadeFrom : 0;
  const fade = t <= from ? 1 : 1 - (t - from) / (1 - from);

  const scale = val(tr.scale, t, 1);
  const sx = scale * val(tr.scaleX, t, 1);
  const sy = scale * val(tr.scaleY, t, 1);
  const shake = tr.shake ? tr.shake * Math.sin(t * Math.PI) : 0;
  const jitter = () => (shake ? (Math.random() - 0.5) * 2 * shake : 0);
  const paint = PAINTS[p.paint];

  // Screen-space pass (the tractor beam): before the box, untransformed.
  if (paint && paint.before) {
    ctx.save();
    paint.before(ctx, r, t, p);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha *= Math.max(0, fade) * val(tr.alpha, t, 1);
  ctx.translate(cx + jitter(), cy + val(tr.dy, t, 0) + jitter());
  ctx.rotate((tr.rotate || 0) * t);
  ctx.scale(sx, sy);
  ctx.translate(-cx, -cy);

  // The box plus its colour wash — painters may call this more than once.
  const washed = (c) => {
    body(c);
    if (p.tint) {
      c.save();
      c.globalAlpha *= val(p.tint.alpha, t, 0.8);
      c.fillStyle = p.tint.color;
      c.fillRect(r.x, r.y, r.w, r.h);
      c.restore();
    }
  };

  if (paint && paint.body) paint.body(ctx, r, t, p, washed);
  else washed(ctx);

  ctx.restore();
}

export const BoxFx = { animFor, animCenter, drawDissolve };
