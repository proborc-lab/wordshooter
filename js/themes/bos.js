/**
 * themes/bos.js — The original world: a dark green city with distant pines.
 * The default, and the fallback for anything unmapped.
 */

const forestBackdrop = {
  generate() {
    const elements = [];
    for (let i = 0; i < 30; i++) {
      const w = 40 + Math.random() * 80;
      const h = 60 + Math.random() * 200;
      // Window offsets are pre-computed: calling Math.random() every frame made
      // the windows flicker.
      const windows = [];
      for (let dy = 10; dy < h - 10; dy += 18) {
        for (let dx = 5; dx < w - 8; dx += 14) {
          if (Math.random() >= 0.01) windows.push({ dx, dy });   // ~99% lit
        }
      }
      elements.push({
        x: Math.random() * 8000,
        y: 0,
        w, h,
        color: `rgb(${20 + Math.floor(Math.random() * 25)},${30 + Math.floor(Math.random() * 30)},${20 + Math.floor(Math.random() * 25)})`,
        windows,
      });
    }
    return elements;
  },

  draw(ctx, elements, cameraX, cw, ch) {
    // Buildings (parallax 0.3)
    for (const b of elements) {
      const bx = b.x - cameraX * 0.3;
      const screenX = ((bx % (cw + 200)) + cw + 200) % (cw + 200) - 100;
      ctx.fillStyle = b.color;
      ctx.fillRect(screenX, ch - b.h, b.w, b.h);
      ctx.fillStyle = 'rgba(60, 90, 60, 0.4)';
      const top = ch - b.h;
      for (const { dx, dy } of b.windows) {
        ctx.fillRect(screenX + dx, top + dy, 6, 8);
      }
    }

    // Distant trees (parallax 0.5)
    ctx.fillStyle = '#0f200f';
    for (let i = 0; i < 25; i++) {
      const tx = ((i * 140 - cameraX * 0.5) % (cw + 200) + cw + 200) % (cw + 200) - 100;
      const th = 40 + (i % 5) * 20;
      ctx.fillRect(tx, ch - th - 60, 12, th);
      ctx.beginPath();
      ctx.moveTo(tx - 18, ch - 60 - th + 10);
      ctx.lineTo(tx + 6, ch - 60 - th - 30);
      ctx.lineTo(tx + 30, ch - 60 - th + 10);
      ctx.closePath();
      ctx.fill();
    }
  },
};

export const BOS = {
  name: 'Bos',
  sky: [[0, '#050a05'], [0.6, '#0a150a'], [1, '#0f1a0f']],
  tiles:   ['#2d4a2d', '#325233', '#3a5a3a', '#426242', '#4a6a4a'],
  accents: ['#1a3a1a', '#1f3f1f', '#253a25', '#2a4a2a', '#304a30'],
  platformFill: '#2d4a2d',
  shadow: '#1a2e1a',
  abyss: '#050f05',
  moveStripe: '#44ff88',
  moveChevron: '#88ffaa',
  groundStripe: '#885500',
  tileBase: '#2d4a2d',       // the original green
  backdrop: forestBackdrop,
};
