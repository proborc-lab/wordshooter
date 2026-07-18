/**
 * wordstats.js — Which words he doesn't know, and what he confuses them with.
 *
 * The whole game rewards him for showing up and for being good. Nothing until
 * now noticed what he actually gets WRONG. This is the memory that makes the
 * Nemesis possible.
 *
 * Two things are recorded per word:
 *   misses      — how often he got it wrong
 *   confusions  — what he shot INSTEAD, and how often
 *
 * That second one is the whole point. "He gets `vakantie` wrong" is a fact you
 * can do very little with. "He answers `strand` when asked `vakantie`" tells you
 * exactly which knot needs untying — and it lets the Nemesis stand next to the
 * one word he'd actually confuse it with, instead of three random ones he can
 * eliminate at a glance.
 *
 * Deliberately invisible to the player. No scorecard, no "these 7 you still
 * don't know" — the learning stays incidental (see the project's design
 * philosophy). The game just quietly gets sharper about his weak spots.
 *
 * Persistence goes through storage.js, so a corrupt file is quarantined rather
 * than silently reset.
 */

import { readJSON, writeJSON } from './storage.js';
import { CONFIG } from './config.js';

const KEY = 'wordshooter_wordstats';

function keyFor(player) {
  return `${KEY}_${(player || '').trim()}`;
}

/** '2026-07-11' — wounds are counted per calendar day, not per session. */
function dayKey(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function defaults() {
  return {
    words: {},        // "listId::answer" → { misses, hits, confusions: {wrong: n} }
    nemesis: null,    // { key, list, prompt, answer, wounds, lastWound, since }
  };
}

function load(player) {
  const base = defaults();
  const s = readJSON(keyFor(player), null);
  if (!s) return base;
  return {
    ...base,
    ...s,
    words: (s.words && typeof s.words === 'object') ? s.words : {},
  };
}

function save(player, s) {
  writeJSON(keyFor(player), s);
}

/** A word is identified by its list AND its answer — 'zon' means different
 *  things in the French and the German list. */
export function wordKey(listId, answer) {
  return `${listId}::${answer}`;
}

// ── Recording ───────────────────────────────────────────────────────────────

/**
 * He answered `shotWord` when the answer was `answer`.
 *
 * Promotes the word to Nemesis once it has been missed enough times. ONE nemesis
 * at a time, always: a swarm of your own weaknesses is the opposite of
 * encouraging.
 *
 * But "one at a time" must not mean "one forever". A Nemesis belongs to a list,
 * and he only meets it while playing THAT list — and homework lists change every
 * week. So a Nemesis stuck in last week's list would never be met, never be
 * beaten, and would block every new one for the rest of the year. The mechanic
 * would silently die after the first list change.
 *
 * So the Nemesis follows him: a word escaping in the list he's actually playing
 * takes over from one stranded in a list he has moved on from. The old one isn't
 * punished — its wounds are kept on the word itself, so if he ever comes back to
 * that list it escapes again exactly where it left off.
 */
export function recordMiss(player, { listId, prompt, answer, shotWord }) {
  const s = load(player);
  const k = wordKey(listId, answer);
  const w = s.words[k] || { misses: 0, hits: 0, confusions: {}, wounds: 0 };

  w.misses++;
  if (shotWord && shotWord !== answer) {
    w.confusions[shotWord] = (w.confusions[shotWord] || 0) + 1;
  }
  s.words[k] = w;

  const ready = w.misses >= CONFIG.nemesis.missesToProvoke;
  const stranded = s.nemesis && s.nemesis.list !== listId;

  if (ready && (!s.nemesis || stranded)) {
    if (stranded) _release(s, s.nemesis);          // let the old one go quiet
    s.nemesis = {
      key: k, list: listId, prompt, answer,
      wounds: w.wounds || 0,                       // resumes where it left off
      lastWound: null, since: dayKey(),
    };
  }

  save(player, s);
  return s.nemesis && s.nemesis.key === k ? s.nemesis : null;   // just escaped?
}

/** Park a Nemesis back into its word, losing nothing. */
function _release(s, n) {
  const w = s.words[n.key];
  if (w) w.wounds = n.wounds;
}

export function recordHit(player, { listId, answer }) {
  const s = load(player);
  const k = wordKey(listId, answer);
  const w = s.words[k] || { misses: 0, hits: 0, confusions: {} };
  w.hits++;
  s.words[k] = w;
  save(player, s);
}

// ── The Nemesis ─────────────────────────────────────────────────────────────

/** The active nemesis, if it belongs to the list being played. */
export function getNemesis(player, listId) {
  const n = load(player).nemesis;
  return (n && n.list === listId) ? n : null;
}

/** The word currently on the loose, whichever list it escaped from. */
export function getHunt(player) {
  return load(player).nemesis || null;
}

/**
 * The words to stack it with: the ones he actually confuses it with, most
 * confused first. Falls back to nothing — the caller pads with list words.
 */
export function confusionsFor(player, listId, answer) {
  const w = load(player).words[wordKey(listId, answer)];
  if (!w || !w.confusions) return [];
  return Object.entries(w.confusions)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

/**
 * Beat it. Only ONE wound counts per calendar day — beat it ten times tonight
 * and it's still one wound.
 *
 * That rule is doing real work. He must be able to meet the word again and
 * again while he practises (it stays in the list rotation like any other word),
 * or the word he finds hardest would be the one he practises least. But a word
 * beaten three times in one evening isn't learned; it has to survive a night's
 * sleep. So: practise as often as you like, wound it once a day, kill it in
 * three days.
 *
 * Returns { wounded, defeated, wounds }.
 */
export function recordNemesisWin(player) {
  const s = load(player);
  const n = s.nemesis;
  if (!n) return { wounded: false, defeated: false, wounds: 0 };

  const today = dayKey();
  if (n.lastWound === today) {
    return { wounded: false, defeated: false, wounds: n.wounds };   // already bled today
  }

  n.wounds++;
  n.lastWound = today;
  _release(s, n);                    // mirror the wounds onto the word itself,
                                     // so a list change can't lose them

  const defeated = n.wounds >= CONFIG.nemesis.woundsToDefeat;
  if (defeated) {
    s.trophies = Array.isArray(s.trophies) ? s.trophies : [];
    s.trophies.push({ word: n.answer, prompt: n.prompt, list: n.list, since: n.since, beaten: today });
    s.nemesis = null;
    // The word starts clean: it has been earned back.
    if (s.words[n.key]) { s.words[n.key].misses = 0; s.words[n.key].wounds = 0; }
  }

  save(player, s);
  return { wounded: true, defeated, wounds: n.wounds };
}

/** Words he has beaten. Trophies, never a list of failures. */
export function getTrophies(player) {
  const s = load(player);
  return Array.isArray(s.trophies) ? s.trophies : [];
}
