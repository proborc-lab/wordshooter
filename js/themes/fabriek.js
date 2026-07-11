/**
 * themes/fabriek.js — Rounds 3 & 4. The direction reverses and the world turns
 * hard: smokestacks, furnace-orange windows, copper haze. Deliberately kept for
 * the late rounds regardless of which language world rounds 1-2 used — the
 * contrast IS the signal that things just got serious.
 */

const industrialBackdrop = {
  generate() {
    const elements = [];
    for (let i = 0; i < 28; i++) {
      const type = Math.random() < 0.35 ? 'smokestack' : 'factory';
      const w = type === 'smokestack' ? 18 + Math.random() * 14 : 55 + Math.random() * 90;
      const h = type === 'smokestack' ? 120 + Math.random() * 140 : 55 + Math.random() * 130;
      const windows = [];
      if (type === 'factory') {
        for (let dy = 12; dy < h - 12; dy += 20) {
          for (let dx = 6; dx < w - 8; dx += 16) {
            windows.push({ dx, dy, lit: Math.random() > 0.25 });
          }
        }
      }
      elements.push({
        x: Math.random() * 9000,
        w, h, type,
        color: `rgb(${30 + Math.floor(Math.random() * 20)},${30 + Math.floor(Math.random() * 18)},${35 + Math.floor(Math.random() * 15)})`,
        windows,
      });
    }
    return elements;
  },

  draw(ctx, elements, cameraX, cw, ch) {
    // Factories & smokestacks (parallax 0.3)
    for (const b of elements) {
      const bx = b.x - cameraX * 0.3;
      const screenX = ((bx % (cw + 250)) + cw + 250) % (cw + 250) - 100;
      const top = ch - b.h;

      if (b.type === 'smokestack') {
        ctx.fillStyle = b.color;
        const taper = Math.round(b.w * 0.15);
        ctx.fillRect(screenX + taper, top, b.w - taper * 2, b.h);
        ctx.fillStyle = '#7a3e10';                       // copper rim
        ctx.fillRect(screenX, top, b.w, 4);
        const puffY = top - 18 - ((Date.now() / 1200 + b.x * 0.01) % 1) * 25;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.ellipse(screenX + b.w / 2, puffY, b.w * 0.85, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = b.color;
        ctx.fillRect(screenX, top, b.w, b.h);
        ctx.fillStyle = '#2a2a32';                       // floor marker band
        ctx.fillRect(screenX, top + Math.floor(b.h * 0.5), b.w, 3);
        for (const { dx, dy, lit } of b.windows) {
          ctx.fillStyle = lit ? 'rgba(255, 110, 20, 0.55)' : 'rgba(20, 20, 28, 0.8)';
          ctx.fillRect(screenX + dx, top + dy, 7, 9);
        }
      }
    }

    // Pipes / cable lines (parallax 0.5)
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#5a4a30';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const px = ((i * 170 - cameraX * 0.5) % (cw + 200) + cw + 200) % (cw + 200) - 100;
      const py1 = ch * 0.28 + Math.sin(i * 1.7) * 35;
      const py2 = ch * 0.35 + Math.sin(i * 2.1) * 30;
      ctx.beginPath();
      ctx.moveTo(px, py1);
      ctx.bezierCurveTo(px + 60, py1 + 20, px + 110, py2 - 20, px + 170, py2);
      ctx.stroke();
    }
    ctx.restore();
  },
};

export const FABRIEK = {
  name: 'Fabriek',
  sky: [[0, '#0e0c10'], [0.45, '#1a1218'], [0.85, '#251810'], [1, '#321d08']],
  tiles:   ['#3a3a42', '#404048', '#454550', '#4a4a55', '#50505a'],
  accents: ['#22222a', '#26262e', '#2a2a32', '#2e2e36', '#32323a'],
  platformFill: '#3a3a42',
  shadow: '#12121a',
  abyss: '#0a080c',
  moveStripe: '#ff8833',
  moveChevron: '#ffaa66',
  groundStripe: '#cc6600',
  tileSprite: 'platformTileIndustrial',
  backdrop: industrialBackdrop,
};
