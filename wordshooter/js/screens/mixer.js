/**
 * mixer.js — Canvas "Kleurenmenger" screen.
 *
 * Pick a body part on the left, pick paint on the right, and the poppetje in
 * the middle changes instantly. Paint costs coins (swatches.js); mixing itself
 * is free, so nothing punishes experimenting.
 *
 * The hats you may use are the ones from outfits you OWN — which is what keeps
 * the wardrobe worth buying now that any colour is reachable. You don't buy a
 * look, you buy a building block.
 *
 * Decoupled from main.js: caller injects { canvas, ctx, player, isActive, onExit }.
 */

import { drawPlayer, skinKey, rebuildCustom } from '../cosmetics/skins.js';
import * as Store from '../cosmetics/store.js';
import { REGIONS, SWATCHES, getSwatch } from '../cosmetics/swatches.js';
import { HATS } from '../cosmetics/hats.js';

const DT = 0.016;
const C = {
  bg: '#0b1310', stage: '#12201a', panel: '#16261c', panelHi: '#1d3226',
  line: '#2d4a2d', accent: '#a0e080', text: '#d2e4d2', dim: '#7fa07f',
  coin: '#ffd23f', owned: '#7fdc7f',
};
const M = { pad: 24, rowH: 40, gap: 8, sw: 52, swGap: 8 };

let _animId = null;
let _click = null;
let _wheel = null;
let _canvas = null;

export function openMixer({ canvas, ctx, player, isActive, onExit }) {
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  if (_canvas) {
    if (_click) _canvas.removeEventListener('click', _click);
    if (_wheel) _canvas.removeEventListener('wheel', _wheel);
  }
  _canvas = canvas;

  let region = REGIONS[0].id;       // which body part we're painting
  let design = Store.getCustom(player);
  let coins = Store.getCoins(player);
  let hats = Store.availableHats(player);
  let scroll = 0;
  let maxScroll = 0;
  let animT = 0;
  let message = null;
  let messageTimer = 0;
  let hitRegions = [];

  function refresh() {
    design = Store.getCustom(player);
    coins = Store.getCoins(player);
    hats = Store.availableHats(player);
    rebuildCustom(player);          // the preview reads the rebuilt sprite
  }
  function flash(msg) { message = msg; messageTimer = 2; }
  refresh();

  /** Paint the active region, or buy the paint first. Mixing is free. */
  function pick(sw) {
    if (!Store.ownsSwatch(player, sw.id)) {
      const r = Store.buySwatch(player, sw.id);
      if (!r.ok) {
        flash(r.reason === 'insufficient' ? 'Te weinig munten' : 'Niet beschikbaar');
        return;
      }
      flash(`${sw.name} gekocht`);
    }
    const colors = { ...design.colors, [region]: sw.hex };
    Store.setCustom(player, { colors, hat: design.hat });
    refresh();
  }

  /** Clear the region back to the Ranger default. */
  function clearRegion() {
    const colors = { ...design.colors };
    delete colors[region];
    Store.setCustom(player, { colors, hat: design.hat });
    refresh();
  }

  function setHat(hat) {
    Store.setCustom(player, { colors: design.colors, hat });
    refresh();
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────
  function box(x, y, w, h, fill, stroke, lw = 2) {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }
  function label(text, x, y, size, color, align = 'left') {
    ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // ── Left: the parts you can paint ─────────────────────────────────────────
  function drawRegions(x, y, w) {
    label('LICHAAMSDEEL', x, y - 14, 11, C.dim);
    let ry = y;
    for (const r of REGIONS) {
      const on = region === r.id;
      const hex = design.colors[r.id];
      // A hat REPLACES the helmet, so painting the helmet under one does nothing.
      // Say so, instead of showing a colour chip that has no effect on screen.
      const dead = (r.id === 'helmet' && design.hat) || (r.id === 'hat' && !design.hat);

      box(x, ry, w, M.rowH, on ? C.panelHi : C.panel, on ? C.accent : C.line);
      label(r.name, x + 12, ry + M.rowH / 2, 14, dead ? C.dim : (on ? C.accent : C.text));

      if (dead) {
        label(r.id === 'helmet' ? 'onder hoed' : 'geen hoed',
              x + w - 12, ry + M.rowH / 2, 9, C.dim, 'right');
      } else if (hex) {
        ctx.fillStyle = hex;
        ctx.fillRect(x + w - 34, ry + 10, 20, 20);
        ctx.strokeStyle = C.line; ctx.lineWidth = 1;
        ctx.strokeRect(x + w - 34, ry + 10, 20, 20);
      } else {
        label('—', x + w - 24, ry + M.rowH / 2, 13, C.dim, 'center');
      }

      const id = r.id;
      hitRegions.push({ x, y: ry, w, h: M.rowH, action: () => { region = id; scroll = 0; } });
      ry += M.rowH + M.gap;
    }

    ry += 6;
    box(x, ry, w, 34, C.panel, C.line);
    label('Standaard', x + w / 2, ry + 17, 12, C.dim, 'center');
    hitRegions.push({ x, y: ry, w, h: 34, action: clearRegion });
    return ry + 34;
  }

  // ── Middle: the poppetje wearing the design ───────────────────────────────
  function drawStage(x, y, w, h) {
    box(x, y, w, h, C.stage, C.line);
    const floorY = y + h * 0.58;      // keeps the poppetje near the middle of a tall stage
    ctx.fillStyle = 'rgba(160,224,128,0.10)';
    ctx.fillRect(x + 10, floorY, w - 20, 3);

    const s = 5;
    const pw = 16 * s, ph = 24 * s;
    const wf = [0, 1, 0, 2];
    const frame = wf[Math.floor(animT * 5) % 4];
    drawPlayer(ctx, skinKey('skin_custom', true, false),
               x + w / 2 - pw / 2, floorY - ph, { frame, scale: s });

    label('MIJN ONTWERP', x + w / 2, y + h - 14, 11, C.dim, 'center');
  }

  /** Hats you own, from the outfits you bought. */
  function drawHats(x, y, w) {
    label('HOED', x, y - 14, 11, C.dim);
    const cols = 4;
    const cw = (w - (cols - 1) * 6) / cols;
    const opts = [{ hat: null, from: 'Geen' }, ...hats.filter(h => HATS[h.hat])];
    opts.forEach((h, i) => {
      const hx = x + (i % cols) * (cw + 6);
      const hy = y + Math.floor(i / cols) * 34;
      const on = (design.hat || null) === h.hat;
      box(hx, hy, cw, 28, on ? C.panelHi : C.panel, on ? C.accent : C.line, 1);
      const name = h.hat ? h.from : 'Geen';
      label(name.slice(0, 8), hx + cw / 2, hy + 14, 10, on ? C.accent : C.dim, 'center');
      hitRegions.push({ x: hx, y: hy, w: cw, h: 28, action: () => setHat(h.hat) });
    });
    return y + Math.ceil(opts.length / cols) * 34;
  }

  // ── Right: the paint ──────────────────────────────────────────────────────
  function drawSwatches(x, y, w, h) {
    const cols = Math.max(3, Math.floor((w + M.swGap) / (M.sw + M.swGap)));
    const cw = (w - M.swGap * (cols - 1)) / cols;
    const cellH = M.sw + 18;
    const rows = Math.ceil(SWATCHES.length / cols);
    const contentH = rows * (cellH + M.swGap) - M.swGap;

    maxScroll = Math.max(0, contentH - h);
    scroll = Math.min(Math.max(scroll, 0), maxScroll);

    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

    const active = design.colors[region];
    SWATCHES.forEach((sw, i) => {
      const cx = x + (i % cols) * (cw + M.swGap);
      const cy = y + Math.floor(i / cols) * (cellH + M.swGap) - scroll;
      if (cy + cellH < y || cy > y + h) return;

      const owns = Store.ownsSwatch(player, sw.id);
      const on = active === sw.hex;

      ctx.fillStyle = sw.hex;
      ctx.fillRect(cx, cy, cw, M.sw);
      if (!owns) {                          // unbought paint sits behind a scrim
        ctx.fillStyle = 'rgba(11,19,16,0.62)';
        ctx.fillRect(cx, cy, cw, M.sw);
      }
      ctx.strokeStyle = on ? C.accent : (owns ? C.line : '#3a3a2a');
      ctx.lineWidth = on ? 3 : 1;
      ctx.strokeRect(cx + 1, cy + 1, cw - 2, M.sw - 2);

      if (owns) {
        if (on) label('✓', cx + cw / 2, cy + M.sw / 2, 18, '#ffffff', 'center');
      } else {
        label(`${sw.cost}`, cx + cw / 2, cy + M.sw / 2,
              12, coins >= sw.cost ? C.coin : C.dim, 'center');
      }
      label(sw.name.slice(0, 9), cx + cw / 2, cy + M.sw + 9, 9,
            owns ? C.dim : (coins >= sw.cost ? C.coin : C.dim), 'center');

      const vTop = Math.max(cy, y), vBot = Math.min(cy + cellH, y + h);
      if (vBot > vTop) {
        hitRegions.push({ x: cx, y: vTop, w: cw, h: vBot - vTop, action: () => pick(sw) });
      }
    });

    ctx.restore();

    if (maxScroll > 0) {
      const thumbH = Math.max(30, h * (h / contentH));
      const thumbY = y + (scroll / maxScroll) * (h - thumbH);
      ctx.fillStyle = 'rgba(160,224,128,0.10)';
      ctx.fillRect(x + w + 4, y, 4, h);
      ctx.fillStyle = C.line;
      ctx.fillRect(x + w + 4, thumbY, 4, thumbH);
    }
  }

  // ── Frame ─────────────────────────────────────────────────────────────────
  function cleanup() {
    if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
    if (_click) { canvas.removeEventListener('click', _click); _click = null; }
    if (_wheel) { canvas.removeEventListener('wheel', _wheel); _wheel = null; }
  }

  const draw = () => {
    if (!isActive()) { cleanup(); return; }
    animT += DT;
    if (messageTimer > 0) messageTimer -= DT;

    const cw = canvas.width, ch = canvas.height;
    const pad = M.pad;
    hitRegions = [];

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, cw, ch);

    box(pad, pad, 116, 40, C.panel, C.line);
    label('‹ TERUG', pad + 58, pad + 20, 14, C.text, 'center');
    hitRegions.push({ x: pad, y: pad, w: 116, h: 40, action: () => onExit() });
    label('KLEURENMENGER', cw / 2, pad + 20, 24, C.accent, 'center');
    label(`🪙 ${coins}`, cw - pad, pad + 20, 20, C.coin, 'right');

    const top = pad + 78;
    const bodyH = ch - top - pad;

    const colW = 190;
    const afterRegions = drawRegions(pad, top, colW);
    drawHats(pad, afterRegions + 34, colW);

    const stageX = pad + colW + pad;
    const stageW = Math.min(cw * 0.26, 300);
    drawStage(stageX, top, stageW, bodyH);

    const swX = stageX + stageW + pad;
    const swW = cw - swX - pad - 10;
    label('VERF — koop een kleur, gebruik hem overal', swX, top - 14, 11, C.dim);
    drawSwatches(swX, top, swW, bodyH);

    if (messageTimer > 0 && message) {
      label(message, stageX + stageW / 2, ch - pad, 14, C.coin, 'center');
    }

    _animId = requestAnimationFrame(draw);
  };
  _animId = requestAnimationFrame(draw);

  // ── Input ─────────────────────────────────────────────────────────────────
  _click = (e) => {
    if (!isActive()) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    for (const reg of hitRegions) {
      if (x >= reg.x && x <= reg.x + reg.w && y >= reg.y && y <= reg.y + reg.h) { reg.action(); break; }
    }
  };
  canvas.addEventListener('click', _click);

  _wheel = (e) => {
    if (!isActive() || maxScroll <= 0) return;
    e.preventDefault();
    scroll = Math.min(Math.max(scroll + e.deltaY, 0), maxScroll);
  };
  canvas.addEventListener('wheel', _wheel, { passive: false });
}
