/**
 * themes/duitsland.js — NL-DE. Alps behind a black-forest treeline, with
 * half-timbered houses tucked in at the bottom.
 *
 * Three parallax layers here rather than two: the mountains barely move, the
 * pines drift, the houses keep pace. That depth is what sells a mountain.
 */

const backdrop = {
  generate() {
    const els = [];

    // Snow-capped peaks — the slowest layer.
    for (let i = 0; i < 9; i++) {
      els.push({
        kind: 'peak',
        x: i * 420 + Math.random() * 120,
        w: 320 + Math.random() * 220,
        h: 210 + Math.random() * 130,
      });
    }

    // Black-forest pines.
    for (let i = 0; i < 34; i++) {
      els.push({
        kind: 'pine',
        x: Math.random() * 8000,
        h: 60 + Math.random() * 80,
      });
    }

    // Half-timbered houses.
    for (let i = 0; i < 12; i++) {
      els.push({
        kind: 'huis',
        x: Math.random() * 7000,
        w: 52 + Math.random() * 34,
        h: 46 + Math.random() * 30,
      });
    }
    return els;
  },

  draw(ctx, els, cameraX, cw, ch) {
    const wrap = (x, p, span) => ((x - cameraX * p) % (cw + span) + cw + span) % (cw + span) - span / 2;
    const horizon = ch - 60;

    for (const e of els) {
      if (e.kind !== 'peak') continue;
      const sx = wrap(e.x, 0.12, 700);                 // barely moves = far away
      const top = horizon - e.h;
      ctx.fillStyle = '#2e3444';
      ctx.beginPath();
      ctx.moveTo(sx, horizon);
      ctx.lineTo(sx + e.w / 2, top);
      ctx.lineTo(sx + e.w, horizon);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c8d2e0';                        // snow cap
      ctx.beginPath();
      ctx.moveTo(sx + e.w / 2 - e.w * 0.13, top + e.h * 0.26);
      ctx.lineTo(sx + e.w / 2, top);
      ctx.lineTo(sx + e.w / 2 + e.w * 0.13, top + e.h * 0.26);
      ctx.lineTo(sx + e.w / 2 + e.w * 0.05, top + e.h * 0.19);
      ctx.lineTo(sx + e.w / 2 - e.w * 0.04, top + e.h * 0.24);
      ctx.closePath();
      ctx.fill();
    }

    for (const e of els) {
      if (e.kind !== 'pine') continue;
      const sx = wrap(e.x, 0.38, 250);
      const base = horizon + 6;
      ctx.fillStyle = '#16241c';
      ctx.fillRect(sx - 2, base - 12, 5, 12);
      for (let tier = 0; tier < 3; tier++) {           // stacked triangles
        const ty = base - 12 - tier * (e.h * 0.26);
        const half = (e.h * 0.30) * (1 - tier * 0.22);
        ctx.beginPath();
        ctx.moveTo(sx - half, ty);
        ctx.lineTo(sx, ty - e.h * 0.38);
        ctx.lineTo(sx + half, ty);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (const e of els) {
      if (e.kind !== 'huis') continue;
      const sx = wrap(e.x, 0.55, 200);
      const top = horizon - e.h;
      ctx.fillStyle = '#d8cdb8';                        // whitewashed wall
      ctx.fillRect(sx, top + 12, e.w, e.h - 12);
      ctx.fillStyle = '#5a3428';                        // the timber frame
      ctx.fillRect(sx, top + 12, e.w, 3);
      ctx.fillRect(sx, top + e.h - 3, e.w, 3);
      ctx.fillRect(sx, top + 12, 3, e.h - 12);
      ctx.fillRect(sx + e.w - 3, top + 12, 3, e.h - 12);
      ctx.beginPath();                                  // the diagonal braces
      ctx.moveTo(sx + 3, top + 15);
      ctx.lineTo(sx + e.w - 3, top + e.h - 4);
      ctx.moveTo(sx + e.w - 3, top + 15);
      ctx.lineTo(sx + 3, top + e.h - 4);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#5a3428';
      ctx.stroke();
      ctx.fillStyle = '#7a2e24';                        // roof
      ctx.beginPath();
      ctx.moveTo(sx - 4, top + 13);
      ctx.lineTo(sx + e.w / 2, top - 8);
      ctx.lineTo(sx + e.w + 4, top + 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 214, 130, 0.55)';      // one lit window
      ctx.fillRect(sx + e.w / 2 - 5, top + 24, 10, 10);
    }
  },
};

export const DUITSLAND = {
  name: 'Alpen',
  sky: [[0, '#0e1626'], [0.4, '#1e2f44'], [0.75, '#3a4a5e'], [1, '#5a6a74']],
  tiles:   ['#3a4a3c', '#425244', '#4a5a4c', '#526254', '#5a6a5c'],
  accents: ['#243026', '#2a362c', '#303c32', '#364238', '#3c483e'],
  platformFill: '#3a4a3c',
  shadow: '#1a241c',
  abyss: '#080d14',
  moveStripe: '#c8d2e0',
  moveChevron: '#ffffff',
  groundStripe: '#7a2e24',
  tileBase: '#3a4a3c',       // alpine pine-green stone
  backdrop,
};
