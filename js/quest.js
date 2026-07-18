/**
 * quest.js — The weekly quest. The habit engine.
 *
 * Everything else in this game rewards you for being GOOD. This is the only
 * thing that rewards you for coming BACK — three days a week, every week.
 *
 * A day is filled by ANSWERING WORDS — CONFIG.rewards.minCorrectPerDay of them,
 * across as many attempts as it takes. Not by winning, and not by finishing a
 * round: those count victories, and victories are farmable with a 4-word custom
 * list. Words practised are not. A full 4-round run pays a bonus on top, so the
 * Onbetwistbare Overwinning stays the peak rather than becoming the entry fee.
 *
 * Protective by construction (see the project's design philosophy):
 *  - Correct answers from a LOST game still count. He practised those words; the
 *    game losing them would be a lie.
 *  - Missing a week costs NOTHING. There is no streak to break, no debt.
 *  - The year board is 40 blank slots that fill one per completed week — not a
 *    calendar. A calendar would show exactly which weeks he skipped; a row of
 *    stamps only ever shows what he earned. Same information for us, no shame
 *    for him.
 *  - Days already earned are never revoked.
 *
 * Persistence mirrors store.js: one localStorage key per player, try/caught.
 */

import { CONFIG } from './config.js';
import * as Store from './cosmetics/store.js';
import { readJSON, writeJSON } from './storage.js';

const KEY = 'wordshooter_quest';

function keyFor(player) {
  return `${KEY}_${(player || '').trim()}`;
}

/** ISO week, Monday-based: '2026-W28'. Weeks roll over on Monday morning. */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;                 // Sunday (0) counts as 7
  d.setUTCDate(d.getUTCDate() + 4 - day);         // Thursday decides the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Local calendar day: '2026-07-11'. */
export function dayKey(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function defaults() {
  // counts: correct answers per day this week — what actually fills a day.
  return { weekKey: weekKey(), days: [], counts: {}, weekClaimed: false, weeks: [] };
}

function load(player) {
  const base = defaults();
  let s = base;
  const p = readJSON(keyFor(player), null);
  if (p) {
    s = {
      ...base,
      ...p,
      days: Array.isArray(p.days) ? p.days : [],
      weeks: Array.isArray(p.weeks) ? p.weeks : [],
      counts: (p.counts && typeof p.counts === 'object') ? p.counts : {},
    };
  }
  // New week → the day tally starts over. Completed weeks are kept forever.
  const now = weekKey();
  if (s.weekKey !== now) {
    s = { ...s, weekKey: now, days: [], counts: {}, weekClaimed: false };
  }
  return s;
}

function save(player, state) {
  writeJSON(keyFor(player), state);
}

// ── Reads ──────────────────────────────────────────────────────────────────

export function getState(player) {
  const s = load(player);
  const target = CONFIG.quest.daysPerWeek;
  const today = dayKey();
  return {
    days: s.days,
    daysDone: Math.min(s.days.length, target),
    target,
    doneToday: s.days.includes(today),
    correctToday: s.counts[today] || 0,
    needPerDay: CONFIG.rewards.minCorrectPerDay,
    weekComplete: s.days.length >= target,
    stamps: s.weeks.length,
    boardSlots: CONFIG.quest.boardSlots,
  };
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Record a finished game — EVERY game, won or lost.
 *
 * `correct` is how many words were answered right. `fullRun` means the player
 * beat all four rounds AND practised enough words doing it (the caller checks
 * that against CONFIG.rewards.minCorrectForVictory — a 4-word list must not buy
 * an Onbetwistbare Overwinning).
 *
 * Returns what just happened, so the game-over screen can show it:
 *   { dayFilled, weekJustCompleted, coins, daysDone, target, correctToday, needPerDay }
 */
export function recordGame(player, { correct = 0, fullRun = false } = {}) {
  const s = load(player);
  const q = CONFIG.quest;
  const need = CONFIG.rewards.minCorrectPerDay;
  const today = dayKey();

  // Words practised count even if the game was lost. He did answer them.
  s.counts[today] = (s.counts[today] || 0) + correct;

  const out = { dayFilled: false, weekJustCompleted: false, coins: 0 };

  if (!s.days.includes(today) && s.counts[today] >= need) {
    s.days.push(today);
    out.dayFilled = true;
  }

  if (fullRun) out.coins += q.fullRunBonusCoins;

  // The week pays out once, the moment the last day lands.
  if (!s.weekClaimed && s.days.length >= q.daysPerWeek) {
    s.weekClaimed = true;
    if (!s.weeks.includes(s.weekKey)) s.weeks.push(s.weekKey);
    out.coins += q.weekBonusCoins;
    out.weekJustCompleted = true;
  }

  if (out.coins > 0) Store.addCoins(player, out.coins);
  save(player, s);

  out.daysDone = Math.min(s.days.length, q.daysPerWeek);
  out.target = q.daysPerWeek;
  out.stamps = s.weeks.length;
  out.correctToday = s.counts[today];
  out.needPerDay = need;
  out.doneToday = s.days.includes(today);
  return out;
}
