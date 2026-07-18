import { Sprites } from './sprites.js';
import { themeDef } from './themes/index.js';

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
    this.superEasyRail = null;
    this.difficulty = 0; // set externally by Game when correctCount milestones hit
    this.setTheme('bos');
    this.generate();
  }

  /**
   * Switch worlds. Every colour and the whole parallax backdrop comes from
   * themes.js — a new world is one entry there and nothing here.
   */
  setTheme(id) {
    this.theme = id;
    this.themeDef = themeDef(id);
    this.backdrop = this.themeDef.backdrop.generate();
    this._skyGrad = null;               // force the cached gradient to rebuild

    // Re-colour the platforms that already exist. The Level generates its first
    // stretch in the constructor and the world is only chosen afterwards, so
    // without this the opening of an industrial round kept its forest greens —
    // which was visible as a green ground slab sitting in a factory.
    const { tiles, accents } = this.themeDef;
    for (const p of this.platforms) {
      if (p.decorated) continue;                 // boost pads own their colours
      const tier = p.tier || 0;
      p.tileColor = tiles[tier];
      p.accentColor = accents[tier];
    }
  }

  generate() {
    // Ground platform — takes the theme's tier-0 colour, not a hard-coded green.
    this.platforms.push({
      x: 0,
      y: this.groundY,
      width: 400,
      height: 60,
      tileColor: this.themeDef.tiles[0],
      tier: 0,
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

    // Colour deepens with height — the palette comes from the theme.
    const { tiles: tileColors, accents: accentColors } = this.themeDef;

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

  initSuperEasyRail() {
    const railY = this.groundY;
    this.superEasyRail = {
      x: 0, y: railY, width: this.canvas.width, height: 14,
      tileColor: '#1a1a0a', accentColor: '#331100', tier: 0,
      isBoostPad: true, isSuperEasyRail: true, decorated: true,
    };
    this.platforms.push(this.superEasyRail);
  }

  update(dt, cameraX) {
    this.cameraX = cameraX;

    // Keep super easy rail pinned to the left edge of the camera
    if (this.superEasyRail) this.superEasyRail.x = cameraX;

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

    // Remove platforms far behind camera (keep the super easy rail always)
    const cutoff = cameraX - 400;
    this.platforms = this.platforms.filter(p => p.isSuperEasyRail || p.x + p.width > cutoff);
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
    const T = this.themeDef;

    // ── Sky ──────────────────────────────────────────────────────────────────
    if (!this._skyGrad || this._skyGradH !== ch || this._skyGradKey !== this.theme) {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      for (const [stop, color] of T.sky) grad.addColorStop(stop, color);
      this._skyGrad = grad;
      this._skyGradH = ch;
      this._skyGradKey = this.theme;
    }
    ctx.fillStyle = this._skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    // ── Parallax backdrop — each world draws its own (see themes.js) ─────────
    T.backdrop.draw(ctx, this.backdrop, cameraX, cw, ch);

    // ── The void below ────────────────────────────────────────────────────────
    // Drawn BEFORE the platforms so they sit on top of it. It used to be drawn
    // after, starting at groundY + 60 — which is exactly the bottom edge of the
    // canvas, so it had zero height and never appeared at all. In the dark
    // forest that went unnoticed (the sky's bottom stop is near-black anyway),
    // but in a bright world the sky showed through as a pale strip that looked
    // like solid ground — under which the player would happily fall to his death.
    ctx.fillStyle = T.abyss;
    ctx.fillRect(0, this.groundY, cw, ch - this.groundY);

    // ── Platforms ─────────────────────────────────────────────────────────────
    const tile = Sprites.cache[T.tileSprite];
    const shadowColor = T.shadow;

    for (const p of this.getPlatformsInView()) {
      const sx = Math.round(p.x - cameraX);
      const sy = Math.round(p.y);

      // Base fill
      ctx.fillStyle = p.tileColor || T.platformFill;
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
        const stripeColor = T.moveStripe;
        const chevronColor = T.moveChevron;
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
        ctx.fillStyle = T.groundStripe;
        for (let i = 0; i < p.width; i += 20) {
          ctx.fillRect(sx + i, sy, 10, p.height);
        }
        ctx.restore();
      }
    }

  }

  spawnBossArena(cameraX) {
    const startX = cameraX + this.canvas.width * 0.25;
    const { tiles: tileColors, accents: accentColors } = this.themeDef;

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
      .filter(p => p.x > startX && p.x < startX + 1400 && !p.isGround && !p.isBoostPad)
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
