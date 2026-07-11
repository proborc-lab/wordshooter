/**
 * config.js — Central tuning knobs.
 *
 * Per CLAUDE.md: magic numbers live here, not inline. Cross-cutting numeric
 * settings for the cosmetics systems (economy, follower motion, effect caps).
 * "Which items exist" is data and lives in cosmetics/catalog.js, not here.
 */

export const CONFIG = {
  // ── Cosmetic economy (coins) ──────────────────────────────────────────────
  coinsPerCorrect: 5,               // munten per goed antwoord
  coinsPerUndeniableAllOwned: 250,  // bonus bij Onbetwistbare Overwinning als
                                    // alle effecten al bezeten zijn

  // ── Reward thresholds — words practised, not victories ────────────────────
  // A custom list may be as short as 4 words. Rewards used to count VICTORIES,
  // so a 4-word list handed out effects in seconds and — once every effect was
  // owned — turned the Onbetwistbare Overwinning into an infinite coin faucet
  // (250 coins per two-minute run). So the rewards now count correct answers.
  //
  // Calibrated against the real lists: the shortest is 9 words (a full 4-round
  // run = 36 correct), the median is 20 (= 80). A 4-word list yields 16.
  rewards: {
    minCorrectForVictory: 32,   // an Onbetwistbare Overwinning: effect + bonus coins
    minCorrectPerDay: 20,       // before a quest day fills — one pass through a normal list
  },

  // ── The Nemesis ───────────────────────────────────────────────────────────
  // The word he keeps getting wrong grows legs and comes back as a creature —
  // a stack of word-boxes, and one of them is the answer. He has to jump to
  // reach the right height, so knowing the word isn't enough; he has to land it.
  nemesis: {
    missesToProvoke: 2,     // misses before a word escapes and becomes the Nemesis
    woundsToDefeat: 3,      // wounds needed to kill it — max ONE per calendar day
    segments: 3,            // boxes in its body (answer + confusions)
    walkSpeed: 42,          // px/s — it paces, it does not wait
  },

  // ── Colour mixer ──────────────────────────────────────────────────────────
  // Deliberately locked at the start. The mixer can reproduce any colour outfit
  // for less than it costs to buy — so if it were open on day one it would make
  // the entire 200-800 wardrobe worthless. It exists to absorb coins AFTER the
  // wardrobe runs dry, so that's when it opens.
  mixer: {
    unlockOutfits: 15,        // outfits you must own before the paint shop opens
  },

  // ── Weekly quest (the habit engine) ───────────────────────────────────────
  // A day is filled by WINNING A ROUND — reachable on a school night, also for a
  // kid who doesn't know the words yet. Pushing on to a full 4-round run (the
  // Onbetwistbare Overwinning) pays a bonus, so the big run stays the peak
  // instead of becoming the entry fee.
  quest: {
    daysPerWeek: 3,
    weekBonusCoins: 300,      // for filling the week
    fullRunBonusCoins: 150,   // on top, for a complete 4-round run
    boardSlots: 40,           // stamps in a school year — the long arc
  },

  // ── Follower defaults (a catalog entry may override any of these) ─────────
  follower: {
    lag: 0.12,          // 0..1 easing toward the target point each step
    bobAmplitude: 6,    // px vertical bob
    bobSpeed: 3,        // rad/s
    offsetX: -22,       // behind the player (sign flips with facing)
    offsetY: -14,       // slightly above
    alpha: 0.85,
    fps: 4,             // animation speed; a gag can slow down or speed up its own timing
  },

  // The Kledingkast draws the poppetje at 4× (in-game it's 2×), so the follower
  // needs its own numbers there: at the in-game offsetX of -22 it would sit
  // INSIDE the 64px-wide preview player and be invisible. Bigger AND further back.
  lockerFollower: {
    scale: 4,
    offsetX: -56,       // clear of the 4× player's body, not behind it
    offsetY: -20,
    bob: 10,
    alpha: 1,           // no need to fade it into a background it doesn't have
  },

  // ── Hit-effect emitter safety ─────────────────────────────────────────────
  effects: {
    maxParticles: 60,   // per-burst cap, guards against a runaway catalog entry
    defaultGravity: 400,
  },

  // ── Coin-fly flourish (coins spraying to the HUD counter) ─────────────────
  coinFx: {
    count: 4,           // coins per correct answer
    max: 40,            // hard cap in flight
    size: 7,            // coin radius (px)
    flightTime: 0.9,    // seconds to reach the counter (higher = slower/juicier)
  },
};
