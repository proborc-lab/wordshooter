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
      canvas.height - 80,   // tier 0 — ground level
      canvas.height - 175,  // tier 1 — low
      canvas.height - 275,  // tier 2 — mid-low
      canvas.height - 375,  // tier 3 — mid-high
      canvas.height - 470,  // tier 4 — high
    ];
    this.bgStars = this._generateBgElements();
    this.bgIndustrial = this._generateBgElementsIndustrial();
    this.theme = 'forest'; // 'forest' | 'industrial'
    this.difficulty = 0; // set externally by Game when correctCount milestones hit
    this.generate();
  }

  _generateBgElementsIndustrial() {
    const elements = [];
    // Factories, silos, and smokestacks pre-generated for industrial theme
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
        // Steel-grey factory walls
        color: `rgb(${30 + Math.floor(Math.random() * 20)},${30 + Math.floor(Math.random() * 18)},${35 + Math.floor(Math.random() * 15)})`,
        windows
      });
    }
    return elements;
  }

  _generateBgElements() {
    const elements = [];
    // Background buildings/ruins
    for (let i = 0; i < 30; i++) {
      const w = 40 + Math.random() * 80;
      const h = 60 + Math.random() * 200;
      // Pre-compute lit window offsets (relative to building top-left) to avoid
      // calling Math.random() every frame, which caused windows to flicker.
      const windows = [];
      for (let dy = 10; dy < h - 10; dy += 18) {
        for (let dx = 5; dx < w - 8; dx += 14) {
          if (Math.random() >= 0.01) windows.push({ dx, dy }); // ~99% lit
        }
      }
      elements.push({
        x: Math.random() * 8000,
        y: 0,
        w, h,
        color: `rgb(${15 + Math.floor(Math.random() * 20)},${20 + Math.floor(Math.random() * 20)},${15 + Math.floor(Math.random() * 15)})`,
        windows
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

    this._denseBurst = false;       // true while generating a dense cluster
    this._denseRemaining = 0;       // platforms left in the current burst

    // Generate initial platforms
    while (this.lastPlatformX < this.canvas.width + 2000) {
      this._generateNextPlatform();
    }
  }

  _generateNextPlatform() {
    // ── Dense-burst bookkeeping ──────────────────────────────────────────────
    if (this._denseBurst) {
      this._denseRemaining--;
      if (this._denseRemaining <= 0) this._denseBurst = false;
    } else if (Math.random() < 0.05) {
      // ~5% chance to start a burst of 10-18 tightly packed platforms
      this._denseBurst    = true;
      this._denseRemaining = 10 + Math.floor(Math.random() * 9);
    }

    const dense = this._denseBurst;

    const minGap = dense ? 12 : 55;
    const maxGap = dense ? 45 : 150;
    const gap = minGap + Math.random() * (maxGap - minGap);
    const x = this.lastPlatformX + gap;
    const width = dense
      ? 55  + Math.random() * 80    // narrower individual platforms in bursts
      : 80  + Math.random() * 130;

    // Richer tier transitions across 5 tiers
    // Can jump up 1 tier freely, up 2 with a double-jump; can fall freely
    const rand = Math.random();
    let tierDelta;
    if      (rand < 0.15) tierDelta = -2; // drop two levels
    else if (rand < 0.35) tierDelta = -1; // drop one
    else if (rand < 0.55) tierDelta =  0; // stay
    else if (rand < 0.80) tierDelta =  1; // climb one
    else                  tierDelta =  2; // climb two (needs double-jump)

    let newTier = this.lastPlatformTier + tierDelta;
    newTier = Math.max(0, Math.min(this.tiers.length - 1, newTier));

    // Occasional ground-level reset for breathing room (suppressed during bursts)
    if (!dense && Math.random() < 0.07) newTier = 0;

    const y = this.tiers[newTier] + (Math.random() - 0.5) * 20;

    // Colour deepens with height — forest or industrial palette
    const tileColors   = this.theme === 'industrial'
      ? ['#3a3a42', '#404048', '#454550', '#4a4a55', '#50505a']
      : ['#2d4a2d', '#325233', '#3a5a3a', '#426242', '#4a6a4a'];
    const accentColors = this.theme === 'industrial'
      ? ['#22222a', '#26262e', '#2a2a32', '#2e2e36', '#32323a']
      : ['#1a3a1a', '#1f3f1f', '#253a25', '#2a4a2a', '#304a30'];

    const platform = {
      x, y, width,
      height: 18 + Math.random() * 10,
      tileColor:   tileColors[newTier],
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

    // During bursts add a second platform ~75% of the time; normally ~42%
    // (creates branching paths — player can go high or low)
    if (Math.random() < (dense ? 0.75 : 0.42)) {
      const altTier = Math.max(0, Math.min(this.tiers.length - 1,
        newTier + (Math.random() < 0.5 ? 2 : -2)));
      if (altTier !== newTier) {
        const altW = 70 + Math.random() * 100;
        const altX = x + width / 2 + 30 + Math.random() * 60;
        const altY = this.tiers[altTier] + (Math.random() - 0.5) * 20;
        this.platforms.push({
          x: altX, y: altY, width: altW,
          height: 18 + Math.random() * 8,
          tileColor:   tileColors[altTier],
          accentColor: accentColors[altTier],
          tier: altTier
        });
      }
    }

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
    const industrial = this.theme === 'industrial';

    // ── Sky ──────────────────────────────────────────────────────────────────
    const skyKey = industrial ? 'ind' : 'for';
    if (!this._skyGrad || this._skyGradH !== ch || this._skyGradKey !== skyKey) {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      if (industrial) {
        grad.addColorStop(0, '#0e0c10');   // near-black purple-grey
        grad.addColorStop(0.45, '#1a1218'); // dark charcoal
        grad.addColorStop(0.85, '#251810'); // amber haze near ground
        grad.addColorStop(1,    '#321d08'); // warm copper glow
      } else {
        grad.addColorStop(0, '#050a05');
        grad.addColorStop(0.6, '#0a150a');
        grad.addColorStop(1, '#0f1a0f');
      }
      this._skyGrad = grad;
      this._skyGradH = ch;
      this._skyGradKey = skyKey;
    }
    ctx.fillStyle = this._skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    if (industrial) {
      // ── Industrial background — factories & smokestacks (parallax 0.3) ────
      for (const b of this.bgIndustrial) {
        const bx = b.x - cameraX * 0.3;
        const screenX = ((bx % (cw + 250)) + cw + 250) % (cw + 250) - 100;
        const buildingTop = ch - b.h;

        if (b.type === 'smokestack') {
          // Tapered chimney
          ctx.fillStyle = b.color;
          const taper = Math.round(b.w * 0.15);
          ctx.fillRect(screenX + taper, buildingTop, b.w - taper * 2, b.h);
          // Copper rim at top
          ctx.fillStyle = '#7a3e10';
          ctx.fillRect(screenX, buildingTop, b.w, 4);
          // Smoke puff (animated via time)
          const puffY = buildingTop - 18 - ((Date.now() / 1200 + b.x * 0.01) % 1) * 25;
          ctx.save();
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = '#888888';
          ctx.beginPath();
          ctx.ellipse(screenX + b.w / 2, puffY, b.w * 0.85, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Factory building
          ctx.fillStyle = b.color;
          ctx.fillRect(screenX, buildingTop, b.w, b.h);
          // Horizontal band (industrial floor marker)
          ctx.fillStyle = '#2a2a32';
          ctx.fillRect(screenX, buildingTop + Math.floor(b.h * 0.5), b.w, 3);
          // Windows — furnace-orange if lit
          const buildingTopY = buildingTop;
          for (const { dx, dy, lit } of b.windows) {
            ctx.fillStyle = lit ? 'rgba(255, 110, 20, 0.55)' : 'rgba(20, 20, 28, 0.8)';
            ctx.fillRect(screenX + dx, buildingTopY + dy, 7, 9);
          }
        }
      }

      // Distant pipes / cable lines (parallax 0.5)
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

    } else {
      // ── Forest background — buildings (parallax 0.3) ──────────────────────
      for (const b of this.bgStars) {
        const bx = b.x - cameraX * 0.3;
        const screenX = ((bx % (cw + 200)) + cw + 200) % (cw + 200) - 100;
        ctx.fillStyle = b.color;
        ctx.fillRect(screenX, ch - b.h, b.w, b.h);
        ctx.fillStyle = 'rgba(60, 90, 60, 0.4)';
        const buildingTop = ch - b.h;
        for (const { dx, dy } of b.windows) {
          ctx.fillRect(screenX + dx, buildingTop + dy, 6, 8);
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
    }

    // ── Platforms ─────────────────────────────────────────────────────────────
    const tile = industrial
      ? Sprites.cache.platformTileIndustrial
      : Sprites.cache.platformTile;
    const shadowColor = industrial ? '#12121a' : '#1a2e1a';

    for (const p of this.getPlatformsInView()) {
      const sx = Math.round(p.x - cameraX);
      const sy = Math.round(p.y);

      // Base fill
      ctx.fillStyle = p.tileColor || (industrial ? '#3a3a42' : '#2d4a2d');
      ctx.fillRect(sx, sy, p.width, p.height);

      if (tile) {
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

      // Boost pad — animated upward arrows and pulsing amber glow
      if (p.isBoostPad) {
        const t = Date.now() / 500;
        const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
        ctx.save();
        // Glowing top strip
        ctx.globalAlpha = 0.55 + pulse * 0.35;
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(sx, sy, p.width, 3);
        // Upward chevrons scrolling upward
        ctx.globalAlpha = 0.45 + pulse * 0.3;
        ctx.fillStyle = '#ffcc44';
        const phase = (Date.now() / 220) % 18;
        for (let ci = 0; ci < p.width - 12; ci += 24) {
          const ax = sx + ci + 6;
          const ay = sy + p.height - 4 - phase;
          ctx.beginPath();
          ctx.moveTo(ax,      ay);
          ctx.lineTo(ax + 8,  ay + 7);
          ctx.lineTo(ax + 16, ay);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffcc44';
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ax,      ay - 7);
          ctx.lineTo(ax + 8,  ay);
          ctx.lineTo(ax + 16, ay - 7);
          ctx.stroke();
        }
        // Side amber edge glow
        ctx.globalAlpha = 0.25 + pulse * 0.2;
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, p.width - 2, p.height - 2);
        ctx.restore();
      }

      // Moving platform indicator
      if (p.moveVx !== undefined && !p.isBoostPad) {
        const phase = ((Date.now() / 300) + p.moveOriginX * 0.01) % 1;
        const stripeColor = industrial ? '#ff8833' : '#44ff88';
        const chevronColor = industrial ? '#ffaa66' : '#88ffaa';
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = stripeColor;
        ctx.fillRect(sx, sy, p.width, 3);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = chevronColor;
        for (let ci = 0; ci < p.width; ci += 18) {
          const cx2 = sx + (ci + phase * 18) % p.width;
          const dir = p.moveVx > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(cx2, sy + 1);
          ctx.lineTo(cx2 + 5 * dir, sy + 6);
          ctx.lineTo(cx2, sy + 11);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = stripeColor;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Bottom shadow edge
      ctx.fillStyle = shadowColor;
      ctx.fillRect(sx, sy + p.height - 2, p.width, 2);

      // Danger stripes on ground platforms
      if (p.isGround) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = industrial ? '#cc6600' : '#885500';
        for (let i = 0; i < p.width; i += 20) {
          ctx.fillRect(sx + i, sy, 10, p.height);
        }
        ctx.restore();
      }
    }

    // Ground/abyss
    ctx.fillStyle = industrial ? '#0a080c' : '#050f05';
    ctx.fillRect(0, this.groundY + 60, cw, ch - this.groundY - 60);
  }

  spawnBossArena(cameraX) {
    const startX = cameraX + this.canvas.width * 0.25;
    const tileColors   = this.theme === 'industrial'
      ? ['#3a3a42', '#404048', '#454550', '#4a4a55', '#50505a']
      : ['#2d4a2d', '#325233', '#3a5a3a', '#426242', '#4a6a4a'];
    const accentColors = this.theme === 'industrial'
      ? ['#22222a', '#26262e', '#2a2a32', '#2e2e36', '#32323a']
      : ['#1a3a1a', '#1f3f1f', '#253a25', '#2a4a2a', '#304a30'];

    // 4 spelling-box platforms — tagged isBossArena so _startBossRound places boxes on them
    const spellingLayout = [
      { dx: 20,  tier: 1, width: 155 },
      { dx: 240, tier: 1, width: 145 },
      { dx: 480, tier: 1, width: 155 },
      { dx: 700, tier: 1, width: 145 },
    ];
    for (const ap of spellingLayout) {
      this.platforms.push({
        x: startX + ap.dx, y: this.tiers[ap.tier], width: ap.width, height: 20,
        tileColor: tileColors[ap.tier], accentColor: accentColors[ap.tier], tier: ap.tier,
        isBossArena: true, decorated: true
      });
    }

    // Boost pad — wide moving platform near ground that catapults the player upward
    const bpX = startX + 300;
    const bpY = this.tiers[0] - 12;  // just above ground level
    const boostPad = {
      x: bpX, y: bpY, width: 220, height: 14,
      tileColor: '#1a1a0a', accentColor: '#331100', tier: 0,
      isBoostPad: true, decorated: true,
      moveVx: 60,
      moveOriginX: bpX + 110,
      moveRangeX: 190,
    };
    this.platforms.push(boostPad);

    // High flanking platforms so the player can reach shooting height (tier 4 hits the boss)
    // Boss floats near canvas.height * 0.15; tier 4 (canvas.height - 470) puts player at boss height
    const navLayout = [
      { dx: 100, tier: 4, width: 135 },  // left of boss
      { dx: 175, tier: 3, width: 110 },  // stepping stone up-left
      { dx: 360, tier: 4, width: 135 },  // right of boss
      { dx: 555, tier: 3, width: 110 },  // stepping stone up-right
      { dx: 610, tier: 4, width: 125 },  // far right high
    ];
    for (const np of navLayout) {
      this.platforms.push({
        x: startX + np.dx, y: this.tiers[np.tier], width: np.width, height: 20,
        tileColor: tileColors[np.tier], accentColor: accentColors[np.tier], tier: np.tier,
        decorated: true
      });
    }
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
        tileColor: '#3a5a3a', accentColor: '#253a25', tier: 2
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
