/**
 * trophy-ui.js — The wall of beaten words.
 *
 * This is the Collection Codex we shelved, and the reason it's worth building
 * now is that it finally collects something that matters: not the things he
 * bought, but the words he conquered.
 *
 * The framing is everything. The same data could be shown as "words you keep
 * getting wrong" — a report card, and precisely the thing that makes a kid quit.
 * Told the other way round it's a trophy case: these are words that ran from
 * you, and you hunted them down. Identical facts, opposite feeling.
 *
 * So: it NEVER lists his weak words. Only the one that's currently on the loose
 * (that's a hunt, not an accusation) and the ones he has already beaten.
 */

import * as WordStats from '../wordstats.js';
import { CONFIG } from '../config.js';

const GOLD = '#ffd23f';
const VIOLET = '#b98cff';
const GREEN = '#a0e080';
const DIM = '#5a7a5a';

/** The mission-screen button. Shows the hunt, because that's the live story. */
export function trophyButton(player) {
  const hunt = WordStats.getHunt(player);
  const n = WordStats.getTrophies(player).length;

  const sub = hunt
    ? `<span style="font-size:11px;margin-left:8px;color:${VIOLET}">
         ${hunt.answer} is ontsnapt
       </span>`
    : `<span style="font-size:11px;margin-left:8px;opacity:0.7">${n} verslagen</span>`;

  return `<button class="menu-btn" id="trophyBtn"
      style="border-color:${hunt ? VIOLET : GOLD};color:${hunt ? VIOLET : GOLD};margin-bottom:4px">
    🏆 TROFEEËN${sub}
  </button>`;
}

function huntPanel(hunt) {
  if (!hunt) return '';
  const w = CONFIG.nemesis.woundsToDefeat;
  const pips = Array.from({ length: w }, (_, i) =>
    `<span style="color:${i < hunt.wounds ? GOLD : '#3a3a4a'};font-size:18px">●</span>`
  ).join(' ');

  return `
    <div style="border:2px solid ${VIOLET};border-radius:8px;padding:12px;margin-bottom:16px;
                background:rgba(90,60,120,0.15)">
      <div style="color:${VIOLET};font-size:12px;letter-spacing:2px">OP DE VLUCHT</div>
      <div style="color:#fff;font-size:26px;font-weight:bold;margin:6px 0">${hunt.answer}</div>
      <div style="color:${DIM};font-size:12px">${hunt.prompt} → ${hunt.answer}</div>
      <div style="margin-top:10px">${pips}
        <span style="color:${DIM};font-size:12px;margin-left:8px">
          ${hunt.wounds}/${w} raak — hoogstens één per dag
        </span>
      </div>
    </div>`;
}

function trophyCard(t) {
  return `
    <div style="border:1px solid ${GOLD};border-radius:6px;padding:10px;
                background:rgba(255,210,63,0.07);text-align:left">
      <div style="color:${GOLD};font-size:17px;font-weight:bold">🏆 ${t.word}</div>
      <div style="color:${GREEN};font-size:12px;margin-top:2px">${t.prompt} → ${t.word}</div>
      <div style="color:${DIM};font-size:10px;margin-top:6px">
        ontsnapt ${t.since} · verslagen ${t.beaten}
      </div>
    </div>`;
}

export function trophyWall(player) {
  const hunt = WordStats.getHunt(player);
  const trophies = WordStats.getTrophies(player).slice().reverse();   // newest first

  // The empty state carries a lot of weight: it must not read as "you have
  // achieved nothing", but as "nothing has got away from you".
  const body = trophies.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
                   gap:10px;margin-bottom:16px">
         ${trophies.map(trophyCard).join('')}
       </div>`
    : `<div style="color:${DIM};font-size:13px;line-height:1.7;margin:20px 0">
         Nog geen trofeeën.<br>
         Er is nog geen woord in geslaagd om van je weg te komen.
       </div>`;

  return `
    <div class="menu-panel">
      <div class="menu-title" style="font-size:28px">TROFEEËN</div>
      <div class="menu-subtitle">Woorden die je te pakken hebt gekregen</div>
      <div style="color:${GOLD};font-size:22px;font-weight:bold;margin:10px 0 16px">
        ${trophies.length}
      </div>
      ${huntPanel(hunt)}
      ${body}
      <button class="menu-btn back-btn" id="trophyBackBtn">← TERUG</button>
    </div>`;
}
