/**
 * themes/frankrijk.js — NL-FR. The rooftops of Paris at dusk: zinc roofs,
 * dormer windows, and the Eiffel tower blinking away in the distance.
 */

const backdrop = {
  generate() {
    const els = [];
    els.push({ kind: 'eiffel', x: 1800 + Math.random() * 2500, w: 70, h: 330 });

    // Haussmann blocks: pale stone, zinc roof, dormer windows in it.
    for (let i = 0; i < 26; i++) {
      const w = 70 + Math.random() * 80;
      const h = 60 + Math.random() * 110;
      const windows = [];
      for (let dy = 16; dy < h - 12; dy += 20) {
        for (let dx = 9; dx < w - 12; dx += 20) {
          windows.push({ dx, dy, lit: Math.random() > 0.4 });
        }
      }
      els.push({
        kind: 'block',
        x: Math.random() * 8500,
        w, h, windows,
        dormers: 1 + Math.floor(Math.random() * 3),
        color: `rgb(${74 + Math.floor(Math.random() * 18)},${68 + Math.floor(Math.random() * 16)},${60 + Math.floor(Math.random() * 14)})`,
      });
    }
    return els;
  },

  draw(ctx, els, cameraX, cw, ch) {
    const wrap = (x, p, span) => ((x - cameraX * p) % (cw + span) + cw + span) % (cw + span) - span / 2;

    for (const e of els) {
      if (e.kind === 'eiffel') {
        const sx = wrap(e.x, 0.22, 420);
        const base = ch - 60;
        const top = base - e.h;
        ctx.strokeStyle = '#6a5a48';
        ctx.lineWidth = 3;
        // Two splayed legs meeting at the top — the silhouette does the work.
        ctx.beginPath();
        ctx.moveTo(sx, base);
        ctx.lineTo(sx + e.w / 2 - 4, top);
        ctx.moveTo(sx + e.w, base);
        ctx.lineTo(sx + e.w / 2 + 4, top);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (const f of [0.28, 0.55]) {                  // the two platforms
          const y = base - e.h * f;
          const spread = (e.w / 2) * (1 - f) + 4;
          ctx.beginPath();
          ctx.moveTo(sx + e.w / 2 - spread, y);
          ctx.lineTo(sx + e.w / 2 + spread, y);
          ctx.stroke();
        }
        ctx.fillStyle = '#6a5a48';
        ctx.fillRect(sx + e.w / 2 - 3, top - 14, 6, 16);  // mast
        // The beacon: blinks, because it does.
        const blink = (Date.now() / 900) % 1 < 0.35;
        ctx.fillStyle = blink ? '#ffe9a0' : '#5a4a38';
        ctx.beginPath();
        ctx.arc(sx + e.w / 2, top - 17, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const sx = wrap(e.x, 0.3, 300);
        const top = ch - e.h;
        ctx.fillStyle = e.color;                          // stone facade
        ctx.fillRect(sx, top + 12, e.w, e.h - 12);
        ctx.fillStyle = '#5a6068';                        // zinc roof
        ctx.beginPath();
        ctx.moveTo(sx, top + 12);
        ctx.lineTo(sx + 9, top);
        ctx.lineTo(sx + e.w - 9, top);
        ctx.lineTo(sx + e.w, top + 12);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < e.dormers; i++) {             // dormer windows
          const dx = sx + 14 + i * 24;
          ctx.fillStyle = '#4a5058';
          ctx.fillRect(dx, top + 2, 9, 11);
          ctx.fillStyle = 'rgba(255, 214, 140, 0.5)';
          ctx.fillRect(dx + 2, top + 5, 5, 7);
        }
        for (const { dx, dy, lit } of e.windows) {
          ctx.fillStyle = lit ? 'rgba(255, 206, 130, 0.5)' : 'rgba(30, 26, 26, 0.7)';
          ctx.fillRect(sx + dx, top + 14 + dy, 8, 12);
        }
      }
    }
  },
};

export const FRANKRIJK = {
  name: 'Parijs',
  sky: [[0, '#1d1830'], [0.45, '#3a2a42'], [0.8, '#6a4148'], [1, '#8a5442']],
  tiles:   ['#5a5a60', '#62626a', '#6a6a74', '#72727e', '#7a7a88'],
  accents: ['#38383e', '#3e3e44', '#44444a', '#4a4a52', '#505058'],
  platformFill: '#5a5a60',
  shadow: '#2a2a30',
  abyss: '#100c18',
  moveStripe: '#ffd27a',
  moveChevron: '#ffe9a0',
  groundStripe: '#8a5442',
  tileBase: '#5a5a60',       // Paris zinc & stone
  backdrop,
};
