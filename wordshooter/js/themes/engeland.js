/**
 * themes/engeland.js — NL-EN. Foggy London: brick terraces, a clock tower, and
 * a red bus rolling past on the near layer.
 *
 * A parallax backdrop, not a photo: it has to read at a glance while a twelve-
 * year-old is jumping and shooting, so it's silhouettes and a few landmarks.
 */

const backdrop = {
  generate() {
    const els = [];
    // One clock tower, placed far along so it doesn't dominate the start.
    els.push({ kind: 'tower', x: 1400 + Math.random() * 2000, w: 46, h: 300 });

    // Brick terraces with chimney pots.
    for (let i = 0; i < 26; i++) {
      const w = 55 + Math.random() * 70;
      const h = 70 + Math.random() * 130;
      const windows = [];
      for (let dy = 14; dy < h - 14; dy += 22) {
        for (let dx = 8; dx < w - 10; dx += 18) {
          windows.push({ dx, dy, lit: Math.random() > 0.35 });
        }
      }
      els.push({
        kind: 'terrace',
        x: Math.random() * 8500,
        w, h, windows,
        chimneys: 1 + Math.floor(Math.random() * 3),
        color: `rgb(${58 + Math.floor(Math.random() * 22)},${38 + Math.floor(Math.random() * 16)},${38 + Math.floor(Math.random() * 16)})`,
      });
    }

    // Red double-deckers on the near layer.
    for (let i = 0; i < 4; i++) {
      els.push({ kind: 'bus', x: Math.random() * 6000, w: 74, h: 34 });
    }
    return els;
  },

  draw(ctx, els, cameraX, cw, ch) {
    const wrap = (x, p, span) => ((x - cameraX * p) % (cw + span) + cw + span) % (cw + span) - span / 2;

    for (const e of els) {
      if (e.kind === 'tower') {
        const sx = wrap(e.x, 0.25, 400);
        const top = ch - e.h;
        ctx.fillStyle = '#4a4438';
        ctx.fillRect(sx, top + 40, e.w, e.h - 40);
        ctx.fillStyle = '#5a5342';                       // clock face housing
        ctx.fillRect(sx - 4, top + 34, e.w + 8, 42);
        ctx.fillStyle = '#e8d98a';                       // the lit clock
        ctx.beginPath();
        ctx.arc(sx + e.w / 2, top + 55, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3428';
        ctx.lineWidth = 2;
        ctx.beginPath();                                  // hands
        ctx.moveTo(sx + e.w / 2, top + 55);
        ctx.lineTo(sx + e.w / 2, top + 46);
        ctx.moveTo(sx + e.w / 2, top + 55);
        ctx.lineTo(sx + e.w / 2 + 7, top + 58);
        ctx.stroke();
        ctx.fillStyle = '#4a4438';                        // spire
        ctx.beginPath();
        ctx.moveTo(sx - 4, top + 34);
        ctx.lineTo(sx + e.w / 2, top - 26);
        ctx.lineTo(sx + e.w + 4, top + 34);
        ctx.closePath();
        ctx.fill();
      } else if (e.kind === 'terrace') {
        const sx = wrap(e.x, 0.3, 300);
        const top = ch - e.h;
        ctx.fillStyle = e.color;
        ctx.fillRect(sx, top, e.w, e.h);
        for (let i = 0; i < e.chimneys; i++) {            // chimney pots
          const cx2 = sx + 10 + i * 20;
          ctx.fillStyle = '#3e2a26';
          ctx.fillRect(cx2, top - 14, 8, 14);
          ctx.fillStyle = '#6a4a44';
          ctx.fillRect(cx2 - 1, top - 17, 10, 3);
        }
        for (const { dx, dy, lit } of e.windows) {
          ctx.fillStyle = lit ? 'rgba(255, 220, 140, 0.5)' : 'rgba(24, 18, 20, 0.75)';
          ctx.fillRect(sx + dx, top + dy, 8, 10);
        }
      } else {
        const sx = wrap(e.x, 0.55, 200);                  // bus, near layer
        const top = ch - 60 - e.h;
        ctx.fillStyle = '#8a1c1c';
        ctx.fillRect(sx, top, e.w, e.h);
        ctx.fillStyle = '#c02828';
        ctx.fillRect(sx, top, e.w, 4);
        ctx.fillStyle = 'rgba(255, 230, 170, 0.45)';      // windows
        for (let wx = 5; wx < e.w - 8; wx += 14) {
          ctx.fillRect(sx + wx, top + 6, 9, 8);
          ctx.fillRect(sx + wx, top + 19, 9, 8);
        }
        ctx.fillStyle = '#1a1418';                        // wheels
        ctx.fillRect(sx + 10, top + e.h, 10, 5);
        ctx.fillRect(sx + e.w - 22, top + e.h, 10, 5);
      }
    }

    // Fog bank — the thing that actually makes it read as London.
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#c8c0b8';
    for (let i = 0; i < 7; i++) {
      const fx = ((i * 260 - cameraX * 0.15) % (cw + 400) + cw + 400) % (cw + 400) - 200;
      ctx.beginPath();
      ctx.ellipse(fx, ch * 0.62 + Math.sin(i * 1.4) * 30, 190, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
};

export const ENGELAND = {
  name: 'Londen',
  sky: [[0, '#141824'], [0.5, '#252a38'], [0.85, '#3d3f48'], [1, '#4a4a50']],
  tiles:   ['#4a3f3a', '#524640', '#5a4d46', '#62544c', '#6a5b52'],
  accents: ['#2e2622', '#342a26', '#3a2f2a', '#40342e', '#463932'],
  platformFill: '#4a3f3a',
  shadow: '#241d1a',
  abyss: '#0d0b10',
  moveStripe: '#e8d98a',
  moveChevron: '#fff0b8',
  groundStripe: '#8a1c1c',
  tileBase: '#4a3f3a',       // London brick
  backdrop,
};
