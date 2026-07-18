/**
 * locker.js — Canvas "Kledingkast" screen.
 *
 * A live cosmetics locker. Left: the player's actual poppetje, wearing whatever
 * is SELECTED (not what's bought) — you browse first, and a separate button
 * below does the buying or equipping. Right: a scrollable grid of cells, each
 * showing the item itself rather than just its name (see locker-cells.js).
 *
 * Skins & followers cost coins; box-effects are earned via the Onbetwistbare
 * Overwinning ladder, so those can only be equipped (if owned) or shown locked.
 *
 * Decoupled from main.js: caller injects { canvas, ctx, player, isActive, onExit }.
 */

import '../cosmetics/skins.js';                 // ensure skin sprites are registered
import { Effects } from '../effects.js';
import { Follower } from '../entities/follower.js';
import { drawPlayer, skinKey } from '../cosmetics/skins.js';
import * as Store from '../cosmetics/store.js';
import { byType } from '../cosmetics/catalog.js';
import { CELL_ART } from './locker-cells.js';
import { BoxFx } from '../boxfx.js';
import { CONFIG } from '../config.js';

const DT = 0.016;
const C = {
  bg: '#0b1310', stage: '#12201a', panel: '#16261c', panelHi: '#1d3226',
  line: '#2d4a2d', accent: '#a0e080', text: '#d2e4d2', dim: '#7fa07f',
  coin: '#ffd23f', locked: '#b98cff', equipped: '#7fdc7f',
};

// Grid metrics.
const G = { minCell: 116, cellH: 132, gap: 10, tabH: 40, btnH: 52, pad: 24 };
const CRATE_PAUSE = 0.5;          // beat of empty stage between box-anim replays

/** Pseudo-item for the "no follower" cell. Stable identity: selection is by reference. */
const NO_FOLLOWER = { __none: true, id: null, name: 'Geen', type: 'follower' };

// The tabs, as data. A new cosmetic type = one entry here + one in CELL_ART.
const TABS = [
  {
    id: 'skin', label: 'Skins',
    // 'Mijn Ontwerp' only exists once the mixer is unlocked — otherwise it would
    // sit here as an empty slot that does nothing.
    items: (player) => byType('skin').filter(c =>
      c.id !== 'skin_custom' || Store.mixerStatus(player).unlocked),
  },
  { id: 'follower',  label: 'Volgelingen', items: () => [NO_FOLLOWER, ...byType('follower')] },
  { id: 'hitEffect', label: 'Effecten',    items: () => byType('hitEffect').filter(c => !c.hidden) },
];

let _animId = null;
let _click = null;
let _wheel = null;
let _canvas = null;

export function openLocker({ canvas, ctx, player, isActive, onExit }) {
  // Tear down any previous instance.
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  if (_canvas) {
    if (_click) _canvas.removeEventListener('click', _click);
    if (_wheel) _canvas.removeEventListener('wheel', _wheel);
  }
  _canvas = canvas;

  let tab = 'skin';
  let state = Store.getState(player);
  let selected = {};                // per type: the item being previewed, not yet equipped
  let scroll = {};                  // per tab: scroll offset (px)
  let maxScroll = 0;                // recomputed each frame for the active tab
  let previewFollower = null;
  let lastFoll = '__init';
  let animT = 0;
  let fireTimer = 0;
  let crateT = 0;                   // 0→1 across a box-anim, then a short pause
  let burstFired = false;
  let fx = [];
  let message = null;
  let messageTimer = 0;
  let hitRegions = [];

  /** What the stage shows for a slot: the selected item, else what's equipped. */
  function preview(slot) {
    const sel = selected[slot];
    return sel ? sel.id : state.equipped[slot];
  }
  function refresh() {
    state = Store.getState(player);
    const foll = preview('follower');
    if (foll !== lastFoll) {
      lastFoll = foll;
      previewFollower = foll ? new Follower(foll, CONFIG.lockerFollower) : null;
    }
  }
  function flash(msg) { message = msg; messageTimer = 2; }
  function select(it) {
    selected[it.type] = it;
    refresh();
    if (it.type === 'hitEffect') {                // show it straight away
      fireTimer = 0;
      crateT = 0;
      burstFired = false;
      fx = [];
    }
  }
  refresh();

  const activeTab = () => TABS.find(t => t.id === tab);

  function statusOf(it) {
    if (state.equipped[it.type] === it.id) return { t: '● Uitgerust', c: C.equipped };
    if (it.__none) return { t: '', c: C.dim };
    if (Store.isOwned(player, it.id)) return { t: 'In bezit', c: C.text };
    if (it.cost != null) return { t: `🪙 ${it.cost}`, c: state.coins >= it.cost ? C.coin : C.dim };
    return { t: '🔒', c: C.locked };
  }

  /** The one thing the big button does for the currently selected item. */
  function action() {
    const it = selected[tab];
    if (!it) return { text: 'Kies iets uit de kast', color: C.dim };
    if (state.equipped[it.type] === it.id) return { text: '● Uitgerust', color: C.equipped };
    if (it.__none) {
      return { text: 'Uitrusten', color: C.accent, run: () => { Store.unequip(player, 'follower'); refresh(); } };
    }
    if (Store.isOwned(player, it.id)) {
      return { text: 'Uitrusten', color: C.accent, run: () => { Store.equip(player, it.id); refresh(); } };
    }
    if (it.cost != null) {
      if (state.coins < it.cost) return { text: `🪙 ${it.cost} — te weinig munten`, color: C.dim };
      return {
        text: `Kopen — 🪙 ${it.cost}`, color: C.coin,
        run: () => {
          const r = Store.buy(player, it.id);
          if (r.ok) { refresh(); flash(`${it.name} gekocht!`); }
          else flash(r.reason === 'insufficient' ? 'Te weinig munten' : 'Niet beschikbaar');
        },
      };
    }
    return { text: '🔒 Onbetwistbare Overwinning', color: C.locked };
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────
  function box(x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }
  function label(text, x, y, size, color, align = 'left') {
    ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // ── Preview stage ─────────────────────────────────────────────────────────
  function drawStage(x, y, w, h) {
    box(x, y, w, h, C.stage, C.line);
    const floorY = y + h * 0.78;
    ctx.fillStyle = 'rgba(160,224,128,0.10)';
    ctx.fillRect(x + 8, floorY, w - 16, 3);

    const s = 4;
    const pw = 16 * s, ph = 24 * s;
    const px = x + w * 0.42 - pw / 2;
    const py = floorY - ph;

    if (previewFollower) {
      const fake = { x: px, y: py, width: pw, height: ph, facingRight: true };
      previewFollower.update(DT, fake);
      previewFollower.draw(ctx, 0);
    }

    const wf = [0, 1, 0, 2];
    const frame = wf[Math.floor(animT * 6) % 4];
    drawPlayer(ctx, skinKey(preview('skin'), true, false), px, py, { frame, scale: s });

    // Demo crate, hit over and over so the equipped effect plays on a loop.
    const crateS = 38;
    const r = { x: x + w * 0.72, y: floorY - crateS, w: crateS, h: crateS };
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const id = preview('hitEffect');
    const anim = BoxFx.animFor(id);
    const paintCrate = (c) => {
      c.fillStyle = '#2d3a1a'; c.fillRect(r.x, r.y, r.w, r.h);
      c.strokeStyle = '#5a7a3a'; c.lineWidth = 2;
      c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    };

    if (anim) {
      // Play the anim, hold empty for a beat, then the crate is "back".
      crateT += DT / (anim.duration || 0.7);
      if (crateT >= 1 + CRATE_PAUSE) { crateT = 0; burstFired = false; }
      if (crateT <= 1) {
        if (anim.burst && !burstFired && crateT >= (anim.burst.at != null ? anim.burst.at : 0.7)) {
          burstFired = true;
          const c = BoxFx.animCenter(anim, r, crateT);   // where the crate has drifted to
          fx = fx.concat(Effects.buildFrom(anim.burst, c.x, c.y));
        }
        BoxFx.drawDissolve(ctx, anim, r, crateT, paintCrate);
      }
    } else {
      fireTimer -= DT;
      if (fireTimer <= 0) {
        fireTimer = 1.5;
        Effects.setActiveHit(id);
        fx = fx.concat(Effects.buildHit(cx, cy));
      }
      paintCrate(ctx);
    }

    fx = Effects.step(fx, DT);
    for (const p of fx) Effects.drawParticle(ctx, p, 0);

    label('VOORBEELD', x + w / 2, y + h - 14, 11, C.dim, 'center');
  }

  function drawAction(x, y, w, h) {
    const a = action();
    const live = !!a.run;
    box(x, y, w, h, live ? C.panelHi : C.panel, live ? a.color : C.line);
    label(a.text, x + w / 2, y + h / 2, 16, a.color, 'center');
    if (live) hitRegions.push({ x, y, w, h, action: a.run });
  }

  // ── Item grid ─────────────────────────────────────────────────────────────
  function drawTabs(x, y, w) {
    const tw = (w - 16) / TABS.length;
    TABS.forEach((t, i) => {
      const tx = x + i * (tw + 8);
      const on = tab === t.id;
      box(tx, y, tw, G.tabH, on ? C.panelHi : C.panel, on ? C.accent : C.line);
      label(t.label, tx + tw / 2, y + G.tabH / 2, 14, on ? C.accent : C.dim, 'center');
      hitRegions.push({ x: tx, y, w: tw, h: G.tabH, action: () => { tab = t.id; } });
    });
  }

  function drawCell(it, x, y, w, h) {
    const s = statusOf(it);
    const sel = selected[it.type] === it;
    const eq = state.equipped[it.type] === it.id;
    box(x, y, w, h, sel ? C.panelHi : C.panel, sel ? C.accent : (eq ? C.equipped : C.line));

    const art = CELL_ART[it.type];
    if (art) art(ctx, it, x + w / 2, y + h * 0.36);

    label(it.name, x + w / 2, y + h - 34, 13, sel ? C.accent : C.text, 'center');
    if (s.t) label(s.t, x + w / 2, y + h - 15, 12, s.c, 'center');
  }

  /** Scrollable grid. Cells outside the viewport are neither drawn nor clickable. */
  function drawGrid(x, y, w, h) {
    const items = activeTab().items(player);
    const cols = Math.max(2, Math.floor((w + G.gap) / (G.minCell + G.gap)));
    const cellW = (w - G.gap * (cols - 1)) / cols;
    const rows = Math.ceil(items.length / cols);
    const contentH = rows * (G.cellH + G.gap) - G.gap;

    maxScroll = Math.max(0, contentH - h);
    const sy = Math.min(scroll[tab] || 0, maxScroll);
    scroll[tab] = sy;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    items.forEach((it, i) => {
      const cx = x + (i % cols) * (cellW + G.gap);
      const cy = y + Math.floor(i / cols) * (G.cellH + G.gap) - sy;
      if (cy + G.cellH < y || cy > y + h) return;      // fully scrolled out
      drawCell(it, cx, cy, cellW, G.cellH);
      const vTop = Math.max(cy, y);
      const vBot = Math.min(cy + G.cellH, y + h);
      if (vBot > vTop) {
        hitRegions.push({ x: cx, y: vTop, w: cellW, h: vBot - vTop, action: () => select(it) });
      }
    });

    ctx.restore();

    if (maxScroll > 0) {
      const trackH = h;
      const thumbH = Math.max(30, trackH * (h / contentH));
      const thumbY = y + (sy / maxScroll) * (trackH - thumbH);
      ctx.fillStyle = 'rgba(160,224,128,0.10)';
      ctx.fillRect(x + w + 4, y, 4, trackH);
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
    const pad = G.pad;
    hitRegions = [];

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, cw, ch);

    box(pad, pad, 116, 40, C.panel, C.line);
    label('‹ TERUG', pad + 58, pad + 20, 14, C.text, 'center');
    hitRegions.push({ x: pad, y: pad, w: 116, h: 40, action: () => onExit() });
    label('KLEDINGKAST', cw / 2, pad + 20, 26, C.accent, 'center');
    label(`🪙 ${state.coins}`, cw - pad, pad + 20, 20, C.coin, 'right');

    const top = pad + 64;
    const bodyH = ch - top - pad;
    const previewW = Math.min(cw * 0.36, 380);
    drawStage(pad, top, previewW, bodyH - G.btnH - 12);
    drawAction(pad, top + bodyH - G.btnH, previewW, G.btnH);

    const gx = pad + previewW + pad;
    const gw = cw - gx - pad - 10;            // 10px gutter for the scrollbar
    drawTabs(gx, top, gw);
    const gy = top + G.tabH + 16;
    drawGrid(gx, gy, gw, ch - gy - pad);

    if (messageTimer > 0 && message) {
      label(message, pad + previewW / 2, ch - 8, 14, C.coin, 'center');
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
    scroll[tab] = Math.min(Math.max((scroll[tab] || 0) + e.deltaY, 0), maxScroll);
  };
  canvas.addEventListener('wheel', _wheel, { passive: false });
}
