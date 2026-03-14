import { Sprites } from './sprites.js';

export class Level {
  constructor(canvas) {
    this.canvas = canvas;
    this.cameraX = 0;
    this.platforms = [];
    this.scrollSpeed = 120; // px/s base
    this.lastPlatformX = 0;
    this.lastPlatformY = 0;
    this.lastPlatformTier = 0;
    this.groundY = canvas.height - 60;
    this.tiers = [
      canvas.height - 80,   // low
      canvas.height - 200,  // mid
      canvas.height - 320   // high
    ];
    this.bgStars = this._generateBgElements();
    this.difficulty = 0; // set externally by Game when correctCount milestones hit
    this.generate();
  }

  _generateBgElements() {
    const elements = [];
    // Background buildings/ruins
    for (let i = 0; i < 30; i++) {
      elements.push({
        x: Math.random() * 8000,
        y: 0,
        w: 40 + Math.random() * 80,
        h: 60 + Math.random() * 200,
        color: `rgb(${15 + Math.floor(Math.random() * 20)},${20 + Math.floor(Math.random() * 20)},${15 + Math.floor(Math.random() * 15)})`
      });
    }
    return elements;
  }

  generate() {
    // Ground platform
    this.platforms.push({
      x: 0,
      y: this.groundY,
      width: 400,
      height: 60,
      tileColor: '#2d4a2d',
      isGround: true
    });
    this.lastPlatformX = 200;
    this.lastPlatformY = this.groundY;
    this.lastPlatformTier = 0;

    // Generate initial platforms
    while (this.lastPlatformX < this.canvas.width + 2000) {
      this._generateNextPlatform();
    }
  }

  _generateNextPlatform() {
    const minGap = 70;
    const maxGap = 180;
    const gap = minGap + Math.random() * (maxGap - minGap);
    const x = this.lastPlatformX + gap;
    const width = 120 + Math.random() * 150;

    // Pick tier: can jump max 1 tier up, can fall multiple tiers
    let tierDelta;
    const rand = Math.random();
    if (rand < 0.35) {
      tierDelta = -1; // go down
    } else if (rand < 0.65) {
      tierDelta = 0; // same level
    } else {
      tierDelta = 1; // go up one
    }

    let newTier = this.lastPlatformTier + tierDelta;
    newTier = Math.max(0, Math.min(2, newTier));

    // Occasionally add a ground section
    if (Math.random() < 0.1) {
      newTier = 0;
    }

    const y = this.tiers[newTier] + (Math.random() - 0.5) * 30;

    // Pick tile colors based on tier/position
    const tileColors = ['#2d4a2d', '#3a5a3a', '#4a6a4a'];
    const accentColors = ['#1a3a1a', '#253a25', '#304a30'];

    const platform = {
      x,
      y,
      width,
      height: 20 + Math.random() * 10,
      tileColor: tileColors[newTier],
      accentColor: accentColors[newTier],
      tier: newTier
    };

    // Moving platforms at difficulty 1+
    if (this.difficulty >= 1 && Math.random() < 0.28) {
      platform.moveVx = (35 + Math.random() * 35) * (Math.random() < 0.5 ? 1 : -1);
      platform.moveOriginX = x + width / 2;
      platform.moveRangeX = 55 + Math.random() * 75;
    }

    this.platforms.push(platform);

    this.lastPlatformX = x + width;
    this.lastPlatformY = y;
    this.lastPlatformTier = newTier;
  }

  update(dt, cameraX) {
    this.cameraX = cameraX;

    // Animate moving platforms
    for (const p of this.platforms) {
      if (p.moveVx !== undefined) {
        p.x += p.moveVx * dt;
        if (Math.abs(p.x + p.width / 2 - p.moveOriginX) >= p.moveRangeX) {
          p.moveVx = -p.moveVx;
        }
      }
    }

    // Generate more platforms ahead
    const ahead = cameraX + this.canvas.width + 2000;
    while (this.lastPlatformX < ahead) {
      this._generateNextPlatform();
    }

    // Remove platforms far behind camera
    const cutoff = cameraX - 400;
    this.platforms = this.platforms.filter(p => p.x + p.width > cutoff);
  }

  getPlatformsInView() {
    const left = this.cameraX - 100;
    const right = this.cameraX + this.canvas.width + 200;
    return this.platforms.filter(p => p.x + p.width > left && p.x < right);
  }

  getAllPlatforms() {
    return this.platforms;
  }

  draw(ctx) {
    const cameraX = this.cameraX;
    const ch = this.canvas.height;
    const cw = this.canvas.width;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, '#050a05');
    grad.addColorStop(0.6, '#0a150a');
    grad.addColorStop(1, '#0f1a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // Background buildings (parallax 0.3)
    for (const b of this.bgStars) {
      const bx = b.x - cameraX * 0.3;
      const screenX = ((bx % (cw + 200)) + cw + 200) % (cw + 200) - 100;
      ctx.fillStyle = b.color;
      ctx.fillRect(screenX, ch - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = 'rgba(60, 90, 60, 0.4)';
      for (let wy = ch - b.h + 10; wy < ch - 10; wy += 18) {
        for (let wx = screenX + 5; wx < screenX + b.w - 8; wx += 14) {
          if (Math.random() < 0.01) continue; // occasionally unlit
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }

    // Distant trees (parallax 0.5)
    ctx.fillStyle = '#0f200f';
    for (let i = 0; i < 25; i++) {
      const tx = ((i * 140 - cameraX * 0.5) % (cw + 200) + cw + 200) % (cw + 200) - 100;
      const th = 40 + (i % 5) * 20;
      ctx.fillRect(tx, ch - this.groundY * 0 - th - 60, 12, th);
      ctx.beginPath();
      ctx.moveTo(tx - 18, ch - 60 - th + 10);
      ctx.lineTo(tx + 6, ch - 60 - th - 30);
      ctx.lineTo(tx + 30, ch - 60 - th + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Platforms
    const tile = Sprites.cache.platformTile;
    for (const p of this.getPlatformsInView()) {
      const sx = Math.round(p.x - cameraX);
      const sy = Math.round(p.y);

      // Base fill (covers any gap below the tile)
      ctx.fillStyle = p.tileColor || '#2d4a2d';
      ctx.fillRect(sx, sy, p.width, p.height);

      if (tile) {
        // Tile the platform sprite horizontally (and a second row if platform is tall enough)
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.beginPath();
        ctx.rect(sx, sy, p.width, p.height);
        ctx.clip();
        for (let tx = 0; tx < p.width + tile.width; tx += tile.width) {
          ctx.drawImage(tile, sx + tx, sy);
          if (p.height > tile.height) {
            ctx.drawImage(tile, sx + tx, sy + tile.height);
          }
        }
        ctx.restore();
      }

      // Moving platform indicator — animated green stripe on top
      if (p.moveVx !== undefined) {
        const phase = ((Date.now() / 300) + p.moveOriginX * 0.01) % 1;
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#44ff88';
        ctx.fillRect(sx, sy, p.width, 3);
        // Chevrons showing direction
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = p.moveVx > 0 ? '#88ffaa' : '#aaffcc';
        for (let ci = 0; ci < p.width; ci += 18) {
          const cx2 = sx + (ci + phase * 18) % p.width;
          const dir = p.moveVx > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(cx2, sy + 1);
          ctx.lineTo(cx2 + 5 * dir, sy + 6);
          ctx.lineTo(cx2, sy + 11);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#44ff88';
          ctx.stroke();
        }
        ctx.restore();
      }

      // Bottom shadow edge
      ctx.fillStyle = '#1a2e1a';
      ctx.fillRect(sx, sy + p.height - 2, p.width, 2);

      // Danger stripes on ground platforms
      if (p.isGround) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#885500';
        for (let i = 0; i < p.width; i += 20) {
          ctx.fillRect(sx + i, sy, 10, p.height);
        }
        ctx.restore();
      }
    }

    // Ground/abyss
    ctx.fillStyle = '#050f05';
    ctx.fillRect(0, this.groundY + 60, cw, ch - this.groundY - 60);
  }

  placeWordBoxes(boxes, startX) {
    const numNeeded = boxes.length;
    const boxW = boxes[0]?.width || 110;
    const minClear = boxW + 20; // minimum gap between left edges of consecutive boxes

    // Search a wider window so the spacing requirement doesn't starve us
    const candidates = this.platforms
      .filter(p => p.x > startX && p.x < startX + 1400 && !p.isGround)
      .sort((a, b) => a.x - b.x);

    // Greedily pick platforms whose box won't overlap the previous one
    const selected = [];
    let lastBoxRight = -Infinity;
    for (const p of candidates) {
      if (selected.length >= numNeeded) break;
      const bx = p.x + (p.width - boxW) / 2;
      if (bx >= lastBoxRight + 20) {       // 20 px clearance between boxes
        selected.push(p);
        lastBoxRight = bx + boxW;
      }
    }

    // If still not enough, generate guaranteed fallback platforms
    while (selected.length < numNeeded) {
      const prev = selected[selected.length - 1];
      const newX = prev
        ? prev.x + prev.width + minClear + 20
        : startX + 250;
      const pw = 170;
      const py = this.tiers[1];
      const fallback = {
        x: newX, y: py, width: pw, height: 20,
        tileColor: '#2d4a2d', accentColor: '#3a5a3a', tier: 1
      };
      this.platforms.push(fallback);
      selected.push(fallback);
    }

    // Assign positions
    const positions = [];
    for (let i = 0; i < numNeeded; i++) {
      const p = selected[i];
      const bx = p.x + (p.width - boxes[i].width) / 2;
      const by = p.y - boxes[i].height - 5;
      boxes[i].x = bx;
      boxes[i].y = by;
      positions.push({ x: bx, y: by });
    }
    return positions;
  }
}
