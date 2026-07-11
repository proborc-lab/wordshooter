/**
 * sprites.js — Pixel-art sprite generator.
 * All sprites are drawn programmatically on small canvases
 * then scaled up with imageSmoothingEnabled=false for the retro pixel look.
 *
 * Player  : 16×24 px  → displayed at 2× = 32×48
 * Monster : 20×25 px  → displayed at 2× = 40×50
 * Platform tile : 40×16 px, tiled
 */

export function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function flipH(src) {
  const c = mkCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

// Player sprites (16×24) are built from palettes in cosmetics/skins.js.

// ── MONSTER (20 × 25) ────────────────────────────────────────────────────────
// 2 frames: 0=normal glow, 1=bright glow (eye pulse)
function makeMonster() {
  const W = 20, H = 25;

  return [0, 1].map(f => {
    const c = mkCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // ── Horns ──
    ctx.fillStyle = '#cc3333';
    // Left horn (tapers upward)
    ctx.fillRect(3, 0, 2, 1);
    ctx.fillRect(2, 1, 4, 1);
    ctx.fillRect(2, 2, 5, 2);
    // Right horn
    ctx.fillRect(15, 0, 2, 1);
    ctx.fillRect(14, 1, 4, 1);
    ctx.fillRect(13, 2, 5, 2);
    // Horn base darker
    ctx.fillStyle = '#991111';
    ctx.fillRect(2, 3, 5, 1);
    ctx.fillRect(13, 3, 5, 1);

    // ── Head ──
    ctx.fillStyle = '#6a0a0a';
    ctx.fillRect(1, 4, 18, 7);
    // Head highlight (top strip)
    ctx.fillStyle = '#8b1a1a';
    ctx.fillRect(2, 4, 16, 2);
    // Head edge shadows
    ctx.fillStyle = '#3d0505';
    ctx.fillRect(1, 4, 1, 7);
    ctx.fillRect(18, 4, 1, 7);

    // ── Eyes ──
    const eyeOuter = f === 0 ? '#ff6600' : '#ff8800';
    const eyeInner = f === 0 ? '#ffcc00' : '#ffee00';
    // Left eye
    ctx.fillStyle = eyeOuter;
    ctx.fillRect(3, 6, 5, 3);
    ctx.fillStyle = eyeInner;
    ctx.fillRect(4, 6, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(f === 0 ? 5 : 4, 6, 1, 1);
    // Right eye
    ctx.fillStyle = eyeOuter;
    ctx.fillRect(12, 6, 5, 3);
    ctx.fillStyle = eyeInner;
    ctx.fillRect(13, 6, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(f === 0 ? 14 : 13, 6, 1, 1);

    // ── Mouth / fangs ──
    ctx.fillStyle = '#220000';
    ctx.fillRect(5, 10, 10, 1);
    ctx.fillStyle = '#eeeecc';
    ctx.fillRect(6, 10, 2, 1);
    ctx.fillRect(12, 10, 2, 1);

    // ── Body ──
    ctx.fillStyle = '#8a1a1a';
    ctx.fillRect(1, 11, 18, 9);
    // Body highlight
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(3, 11, 14, 3);
    // Body shadow (bottom)
    ctx.fillStyle = '#5a0a0a';
    ctx.fillRect(1, 17, 18, 3);
    // Body rivets / armour detail
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(5, 13, 2, 2);
    ctx.fillRect(13, 13, 2, 2);

    // ── Shoulder spikes ──
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(0, 11, 2, 7);
    ctx.fillRect(18, 11, 2, 7);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(0, 11, 2, 2);
    ctx.fillRect(18, 11, 2, 2);

    // ── Claws/arms ──
    ctx.fillStyle = '#6a0000';
    ctx.fillRect(0, 13, 2, 5);
    ctx.fillRect(18, 13, 2, 5);
    ctx.fillStyle = '#dd2200';
    ctx.fillRect(0, 17, 2, 1);
    ctx.fillRect(18, 17, 2, 1);

    // ── Legs ──
    ctx.fillStyle = '#5a0a0a';
    ctx.fillRect(3, 20, 5, 4);
    ctx.fillRect(12, 20, 5, 4);
    ctx.fillStyle = '#8a1a1a';
    ctx.fillRect(4, 20, 3, 3);
    ctx.fillRect(13, 20, 3, 3);

    // ── Clawed feet ──
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(2, 23, 2, 1);
    ctx.fillRect(5, 23, 2, 1);
    ctx.fillRect(11, 23, 2, 1);
    ctx.fillRect(14, 23, 2, 1);
    // Foot base
    ctx.fillStyle = '#3d0000';
    ctx.fillRect(3, 24, 4, 1);
    ctx.fillRect(12, 24, 4, 1);

    return c;
  });
}

// ── TINT HELPER ───────────────────────────────────────────────────────────────
export function tintSprite(src, color) {
  const c = mkCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, src.width, src.height);
  // Restore original alpha mask so transparent pixels stay transparent
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(src, 0, 0);
  return c;
}

// ── INDUSTRIAL PLATFORM TILE (40 × 16) ───────────────────────────────────────
// Steel panels with rivets and a copper accent strip — for rounds 3 & 4
function makePlatformTileIndustrial() {
  const W = 40, H = 16;
  const c = mkCanvas(W, H);
  const ctx = c.getContext('2d');

  // Base steel fill
  ctx.fillStyle = '#3a3a42';
  ctx.fillRect(0, 0, W, H);

  // Top copper accent strip
  ctx.fillStyle = '#9a5a1a';
  ctx.fillRect(0, 0, W, 2);
  ctx.fillStyle = '#cc7722';
  ctx.fillRect(0, 0, W, 1);

  // Steel panel joints (vertical seams every 20px)
  ctx.fillStyle = '#22222a';
  ctx.fillRect(20, 2, 1, H - 4);

  // Panel highlights (lighter centre of each panel)
  ctx.fillStyle = '#4a4a55';
  ctx.fillRect(2, 3, 16, 5);
  ctx.fillRect(22, 3, 16, 5);

  // Rivets — 2 per panel
  ctx.fillStyle = '#cc8833';
  ctx.fillRect(4, 4, 3, 3);   // left panel left rivet
  ctx.fillRect(14, 4, 3, 3);  // left panel right rivet
  ctx.fillRect(24, 4, 3, 3);  // right panel left rivet
  ctx.fillRect(34, 4, 3, 3);  // right panel right rivet
  // Rivet highlight
  ctx.fillStyle = '#ffbb55';
  ctx.fillRect(4, 4, 1, 1);
  ctx.fillRect(14, 4, 1, 1);
  ctx.fillRect(24, 4, 1, 1);
  ctx.fillRect(34, 4, 1, 1);

  // Grill slots at the bottom
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(5,  11, 5, 2);
  ctx.fillRect(12, 11, 5, 2);
  ctx.fillRect(25, 11, 5, 2);
  ctx.fillRect(32, 11, 5, 2);

  // Bottom shadow
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, H - 2, W, 2);

  return c;
}

// ── PLATFORM TILE (40 × 16) ──────────────────────────────────────────────────
// Repeating brick tile — horizontally tileable
function makePlatformTile() {
  const W = 40, H = 16;
  const c = mkCanvas(W, H);
  const ctx = c.getContext('2d');

  // Base fill
  ctx.fillStyle = '#2d4a2d';
  ctx.fillRect(0, 0, W, H);

  // Top highlight (grass/surface)
  ctx.fillStyle = '#5a8a5a';
  ctx.fillRect(0, 0, W, 1);
  ctx.fillStyle = '#4a7a4a';
  ctx.fillRect(0, 1, W, 1);
  ctx.fillStyle = '#3a6a3a';
  ctx.fillRect(0, 2, W, 1);

  // Brick mortar lines (horizontal)
  ctx.fillStyle = '#1a3010';
  ctx.fillRect(0, 7, W, 1);   // between row 1 and row 2

  // Brick body colour (lighter than base)
  ctx.fillStyle = '#354a25';
  // Row 1 bricks (full offset)
  ctx.fillRect(1, 3, 18, 4);
  ctx.fillRect(21, 3, 18, 4);
  // Row 2 bricks (half offset)
  ctx.fillRect(1, 8, 8, 5);
  ctx.fillRect(11, 8, 18, 5);
  ctx.fillRect(31, 8, 8, 5);

  // Brick vertical joints
  ctx.fillStyle = '#1a3010';
  ctx.fillRect(20, 3, 1, 4);   // row-1 joint
  ctx.fillRect(10, 8, 1, 5);   // row-2 joints
  ctx.fillRect(30, 8, 1, 5);

  // Brick highlight (top edge of each brick)
  ctx.fillStyle = '#3d5a2d';
  ctx.fillRect(1, 3, 18, 1);
  ctx.fillRect(21, 3, 18, 1);
  ctx.fillRect(1, 8, 8, 1);
  ctx.fillRect(11, 8, 18, 1);
  ctx.fillRect(31, 8, 8, 1);

  // Bottom shadow
  ctx.fillStyle = '#1a2e1a';
  ctx.fillRect(0, H - 2, W, 2);

  return c;
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export const Sprites = {
  cache: {},

  init() {
    // Player sprites are registered by cosmetics/skins.js (palette-based skins).
    this.cache.monster = makeMonster();

    this.cache.platformTile = makePlatformTile();
    this.cache.platformTileIndustrial = makePlatformTileIndustrial();
  },

  /**
   * Draw a cached sprite.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} name  - key in this.cache
   * @param {number} x     - top-left screen x
   * @param {number} y     - top-left screen y
   * @param {object} opts
   *   frame  {number}  animation frame index (default 0)
   *   scale  {number}  pixel multiplier (default 1)
   *   alpha  {number}  0-1 opacity multiplier (default 1)
   */
  draw(ctx, name, x, y, { frame = 0, scale = 1, alpha = 1 } = {}) {
    const cache = this.cache[name];
    if (!cache) return;
    const img = Array.isArray(cache) ? cache[frame % cache.length] : cache;
    if (!img) return;

    ctx.save();
    if (alpha !== 1) ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x), Math.round(y),
                  img.width * scale, img.height * scale);
    ctx.restore();
  },
};

// Auto-initialise when this module is first imported
Sprites.init();
