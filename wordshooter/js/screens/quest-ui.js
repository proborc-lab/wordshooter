/**
 * quest-ui.js — How the weekly quest looks. HTML, because the menus are
 * DOM overlays (see main.js showOverlay), not canvas.
 *
 * Three pieces:
 *   questStrip()   — the ●●○ week strip, on the mission screen
 *   questResult()  — what just happened, on the game-over screen
 *   questBoard()   — the year board: 40 stamps, one per completed week
 *
 * Everything is a pure function of quest state — no state of its own.
 */

import * as Quest from '../quest.js';
import { CONFIG } from '../config.js';

const GREEN = '#a0e080';
const DIM = '#5a7a5a';
const GOLD = '#ffd23f';

function dots(done, target) {
  return Array.from({ length: target }, (_, i) =>
    `<span style="color:${i < done ? GREEN : DIM};font-size:20px;line-height:1">${i < done ? '●' : '○'}</span>`
  ).join(' ');
}

/** The week strip for the mission screen. Clickable → opens the year board. */
export function questStrip(player) {
  const q = Quest.getState(player);
  const left = q.target - q.daysDone;

  const line = q.weekComplete
    ? `<span style="color:${GOLD}">★ Week compleet!</span>`
    : q.doneToday
      ? `Vandaag gehaald — nog ${left} ${left === 1 ? 'dag' : 'dagen'} deze week`
      : `Nog ${left} ${left === 1 ? 'dag' : 'dagen'} deze week`;

  return `
    <button class="menu-btn" id="questBtn"
            style="border-color:${q.weekComplete ? GOLD : GREEN};color:${GREEN};
                   display:flex;align-items:center;justify-content:space-between;gap:10px">
      <span style="letter-spacing:3px">${dots(q.daysDone, q.target)}</span>
      <span style="font-size:12px;opacity:0.9">${line}</span>
      <span style="font-size:11px;color:${GOLD};opacity:0.85">${q.stamps}/${q.boardSlots} ★</span>
    </button>
  `;
}

/**
 * The game-over line. `res` is what Quest.recordWin returned, or null when the
 * round was lost — a loss says nothing at all, rather than something sad.
 */
export function questResult(res) {
  if (!res) return '';

  if (res.weekJustCompleted) {
    return `
      <div style="border:2px solid ${GOLD};border-radius:6px;padding:10px;margin:10px 0;
                  background:rgba(255,210,63,0.08)">
        <div style="color:${GOLD};font-size:18px;font-weight:bold">★ WEEK COMPLEET</div>
        <div style="color:${GREEN};font-size:13px;margin-top:4px">
          ${dots(res.daysDone, res.target)} &nbsp; Stempel ${res.stamps} van ${CONFIG.quest.boardSlots}
        </div>
        <div style="color:${GOLD};font-size:13px;margin-top:4px">+${res.coins} munten</div>
      </div>`;
  }

  const bonus = res.coins > 0
    ? `<span style="color:${GOLD}"> · +${res.coins} munten</span>` : '';

  if (res.dayFilled) {
    const left = res.target - res.daysDone;
    return `
      <div style="color:${GREEN};font-size:13px;margin:8px 0">
        ${dots(res.daysDone, res.target)} &nbsp; Dag afgevinkt — nog ${left} deze week${bonus}
      </div>`;
  }

  if (res.doneToday) {
    return `
      <div style="color:${DIM};font-size:13px;margin:8px 0">
        ${dots(res.daysDone, res.target)} &nbsp; Vandaag al afgevinkt${bonus}
      </div>`;
  }

  // Not there yet. Show how close he is — a day is filled by WORDS, so a short
  // list simply means playing another round. Progress, not a scolding.
  const left = res.needPerDay - res.correctToday;
  return `
    <div style="color:${DIM};font-size:13px;margin:8px 0">
      ${dots(res.daysDone, res.target)} &nbsp;
      <span style="color:${GREEN}">${res.correctToday}/${res.needPerDay}</span>
      woorden goed vandaag — nog ${left} voor je dag${bonus}
    </div>`;
}

/**
 * The year board: CONFIG.quest.boardSlots blank stamps that fill one per
 * completed week. Deliberately NOT a calendar — a calendar would show exactly
 * which weeks he skipped. This only ever shows what he earned.
 */
export function questBoard(player) {
  const q = Quest.getState(player);
  const cells = Array.from({ length: q.boardSlots }, (_, i) => {
    const filled = i < q.stamps;
    return `<div style="aspect-ratio:1;border:1px solid ${filled ? GOLD : '#2d4a2d'};
                        border-radius:4px;display:flex;align-items:center;justify-content:center;
                        background:${filled ? 'rgba(255,210,63,0.14)' : 'transparent'};
                        color:${filled ? GOLD : '#233a23'};font-size:15px">★</div>`;
  }).join('');

  return `
    <div class="menu-panel">
      <div class="menu-title" style="font-size:28px">JAARKAART</div>
      <div class="menu-subtitle">Elke volle week is een stempel</div>
      <div style="color:${GOLD};font-size:22px;font-weight:bold;margin:10px 0 4px">
        ${q.stamps} / ${q.boardSlots}
      </div>
      <div style="color:${DIM};font-size:12px;margin-bottom:14px">
        ${CONFIG.quest.daysPerWeek} dagen spelen in een week = 1 stempel
      </div>
      <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin-bottom:16px">
        ${cells}
      </div>
      <button class="menu-btn back-btn" id="questBackBtn">← TERUG</button>
    </div>
  `;
}
