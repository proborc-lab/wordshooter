/**
 * storage.js — The one place that touches localStorage.
 *
 * Two jobs, both about not losing a school year of progress.
 *
 * 1. QUARANTINE, DON'T OVERWRITE.
 *    Every module used to do `try { JSON.parse(raw) } catch { return defaults }`.
 *    That looks harmless and is not: a truncated or corrupted save silently
 *    became "zero coins, nothing owned", and the very next write then stamped
 *    those defaults over the damaged-but-possibly-recoverable bytes. One hiccup
 *    and a year was gone, with no error anywhere. Now the raw bytes are moved
 *    aside under a `__corrupt_<timestamp>` key and reported, so they can still
 *    be dug out by hand.
 *
 * 2. ASK THE BROWSER TO KEEP IT.
 *    navigator.storage.persist() exempts this origin from the browser's
 *    automatic clean-up (the "we needed disk space" eviction). It does NOT
 *    protect against someone deliberately clearing their browsing data —
 *    nothing can. See requestPersistence().
 */

/** Corrupted saves found this session — the UI can warn about them. */
export const corrupted = [];

/** Read + parse a key. On corruption: quarantine the bytes, return `fallback`. */
export function readJSON(key, fallback) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {
    console.warn(`storage: could not read ${key}`, e);
    return fallback;
  }
  if (raw == null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (parsed == null) throw new Error('null');
    return parsed;
  } catch (e) {
    const grave = `${key}__corrupt_${Date.now()}`;
    try {
      localStorage.setItem(grave, raw);        // keep the bytes; they may be salvageable
      localStorage.removeItem(key);            // so we don't quarantine it again next load
    } catch (_) { /* out of quota — the original is still there, untouched */ }
    console.error(`storage: ${key} was corrupt. Bytes kept at ${grave}.`);
    corrupted.push({ key, grave });
    return fallback;
  }
}

/** Write a key. Returns false when the browser refused (quota, private mode). */
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`storage: could not save ${key}`, e);
    return false;
  }
}

// ── Persistence ─────────────────────────────────────────────────────────────

let _persisted = null;   // null = not asked yet

/**
 * Ask the browser to protect this origin's storage from automatic eviction.
 *
 * Chrome usually grants this silently once the site is installed or has enough
 * engagement, which is why index.html ships a web app manifest. A denial is not
 * an error — it just means the data is evictable, and the UI says so instead of
 * pretending everything is fine.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) {
    _persisted = false;
    return false;
  }
  try {
    _persisted = await navigator.storage.persisted()
      ? true
      : await navigator.storage.persist();
  } catch (e) {
    _persisted = false;
  }
  return _persisted;
}

/** null until requestPersistence() has run. */
export function isPersisted() {
  return _persisted;
}
