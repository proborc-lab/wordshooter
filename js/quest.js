/**
 * quest.js — The weekly quest. The habit engine.
 *
 * Everything else in this game rewards you for being GOOD. This is the only
 * thing that rewards you for coming BACK — three days a week, every week.
 *
 * A day is filled by winning a round (see CONFIG.quest). Finishing a full
 * 4-round run fills the day too and pays a bonus on top, so the Onbetwistbare
 * Overwinning stays the peak rather than becoming the entry fee.
 *
 * Protective by construction (see the project's design philosophy):
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
  return { weekKey: weekKey(), days: [], weekClaimed: false, weeks: [] };
}

function load(player) {
  const base = defaults();
  let s = base;
  try {
    const raw = localStorage.getItem(keyFor(player));
    if (raw) {
      const p = JSON.parse(raw);
      s = {
        ...base,
        ...p,
        days: Array.isArray(p.days) ? p.days : [],
        weeks: Array.isArray(p.weeks) ? p.weeks : [],
      };
    }
  } catch (e) {
    return base;
  }
  // New week → the day tally starts over. Completed weeks are kept forever.
  const now = weekKey();
  if (s.weekKey !== now) {
    s = { ...s, weekKey: now, days: [], weekClaimed: false };
  }
  return s;
}

function save(player, state) {
  try {
    localStorage.setItem(keyFor(player), JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save quest:', e);
  }
}

// ── Reads ──────────────────────────────────────────────────────────────────

export function getState(player) {
  const s = load(player);
  const target = CONFIG.quest.daysPerWeek;
  return {
    days: s.days,
    daysDone: Math.min(s.days.length, target),
    target,
    doneToday: s.days.includes(dayKey()),
    weekComplete: s.days.length >= target,
    stamps: s.weeks.length,
    boardSlots: CONFIG.quest.boardSlots,
  };
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Record a won round. `fullRun` = the player beat all four rounds.
 * Returns what just happened, so the game-over screen can celebrate it:
 *   { dayFilled, weekJustCompleted, coins, daysDone, target }
 */
export function recordWin(player, { fullRun = false } = {}) {
  const s = load(player);
  const q = CONFIG.quest;
  const today = dayKey();

  const out = { dayFilled: false, weekJustCompleted: false, coins: 0 };

  if (!s.days.includes(today)) {
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
  return out;
}
