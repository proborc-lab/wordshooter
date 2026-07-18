/**
 * themes/friesland.js — NL-FY. Flat land, enormous sky.
 *
 * The trick with Friesland is that there is almost nothing in it, and that IS
 * the landscape: a low horizon, towering clouds, water, a windmill, a church
 * tower on a terp. The emptiness has to be deliberate or it just looks unfinished.
 */

const backdrop = {
  generate() {
    const els = [];

    // Towering clouds — the real subject.
    for (let i = 0; i < 12; i++) {
      els.push({
        kind: 'wolk',
        x: Math.random() * 8000,
        y: 40 + Math.random() * 150,
        w: 90 + Math.random() * 130,
        h: 40 + Math.random() * 60,
      });
    }

    els.push({ kind: 'molen', x: 1200 + Math.random() * 2200 });
    els.push({ kind: 'kerk',  x: 3600 + Math.random() * 2600 });

    // Reed tufts along the waterline.
    for (let i = 0; i < 30; i++) {
      els.push({ kind: 'riet', x: Math.random() * 8000, h: 12 + Math.random() * 16 });
    }
    return els;
  },

  draw(ctx, els, cameraX, cw, ch) {
    const wrap = (x, p, span) => ((x - cameraX * p) % (cw + span) + cw + span) % (cw + span) - span / 2;
    const horizon = ch - 60;

    // Water: a flat band under the horizon, catching the sky.
    ctx.fillStyle = '#1e2c42';
    ctx.fillRect(0, horizon - 34, cw, 34);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#e0a878';                            // sunset caught on the water
    for (let i = 0; i < 22; i++) {
      const gx = ((i * 90 - cameraX * 0.4) % (cw + 200) + cw + 200) % (cw + 200) - 100;
      const gy = horizon - 30 + (i % 4) * 7;
      ctx.fillRect(gx, gy, 16 + (i % 3) * 10, 2);
    }
    ctx.restore();

    for (const e of els) {
      if (e.kind !== 'wolk') continue;
      const sx = wrap(e.x, 0.16, 400);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#c8b4b8';                          // clouds lit from below
      ctx.beginPath();                                    // three lumps = a cloud
      ctx.ellipse(sx, e.y, e.w * 0.5, e.h * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(sx - e.w * 0.3, e.y + e.h * 0.18, e.w * 0.32, e.h * 0.36, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + e.w * 0.32, e.y + e.h * 0.2, e.w * 0.3, e.h * 0.33, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.3;                              // shadowed underbelly
      ctx.fillStyle = '#5a5a72';
      ctx.beginPath();
      ctx.ellipse(sx, e.y + e.h * 0.34, e.w * 0.46, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const e of els) {
      if (e.kind === 'molen') {
        const sx = wrap(e.x, 0.42, 300);
        const base = horizon - 30;
        ctx.fillStyle = '#3e3428';                        // cap and body
        ctx.beginPath();
        ctx.moveTo(sx - 16, base);
        ctx.lineTo(sx - 9, base - 74);
        ctx.lineTo(sx + 9, base - 74);
        ctx.lineTo(sx + 16, base);
        ctx.closePath();
        ctx.fill();
        // Turning sails — one rotation every eight seconds.
        const a = (Date.now() / 8000) * Math.PI * 2;
        const hub = { x: sx, y: base - 80 };
        ctx.strokeStyle = '#5e5240';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const th = a + i * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(hub.x, hub.y);
          ctx.lineTo(hub.x + Math.cos(th) * 34, hub.y + Math.sin(th) * 34);
          ctx.stroke();
        }
      } else if (e.kind === 'kerk') {
        const sx = wrap(e.x, 0.42, 300);
        const base = horizon - 30;
        ctx.fillStyle = '#4a4438';
        ctx.fillRect(sx - 9, base - 62, 18, 62);
        ctx.beginPath();                                  // saddle spire
        ctx.moveTo(sx - 11, base - 62);
        ctx.lineTo(sx, base - 88);
        ctx.lineTo(sx + 11, base - 62);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 225, 150, 0.5)';
        ctx.fillRect(sx - 3, base - 50, 6, 8);
      } else if (e.kind === 'riet') {
        const sx = wrap(e.x, 0.62, 200);
        ctx.strokeStyle = '#4a5a34';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(sx + i * 3, horizon - 26);
          ctx.lineTo(sx + i * 3 + (i - 1.5) * 2, horizon - 26 - e.h);
          ctx.stroke();
        }
      }
    }
  },
};

export const FRIESLAND = {
  name: 'Fryslân',
  // Dusk, not daylight. A bright blue sky looked lovely and made the game's own
  // pale-green UI text (the countdown, "KLAAR VOOR DE START") unreadable on top
  // of it. Golden hour over the water keeps the enormous Frisian sky and gives
  // the interface something dark to sit on.
  sky: [[0, '#1a2a44'], [0.42, '#3d4a6a'], [0.74, '#8a6a70'], [1, '#c88a5a']],
  tiles:   ['#4a6a38', '#527440', '#5a7e48', '#628850', '#6a9258'],
  accents: ['#2e4222', '#344a28', '#3a522e', '#405a34', '#46623a'],
  platformFill: '#4a6a38',
  shadow: '#243418',
  abyss: '#0e1626',
  moveStripe: '#ffd23f',
  moveChevron: '#fff0a0',
  groundStripe: '#c88a5a',
  tileBase: '#4a6a38',       // Frisian meadow
  backdrop,
};
