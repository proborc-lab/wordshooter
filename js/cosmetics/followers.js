/**
 * followers.js — The companion roster. Pure data; catalog.js folds it into COSMETICS.
 *
 * `params.sprite` names a grid in ../entities/follower-art.js. Adding a follower
 * = one grid there + one entry here. Nothing else.
 *
 * `params` may also override any CONFIG.follower motion key — lag, bob, bobSpeed,
 * offsetX, offsetY, alpha, scale — which is how the same trailing entity can feel
 * like a drifting balloon or a darting rocket without a line of new code.
 */

export const FOLLOWERS = [
  // ── Snacks & knuffels (goedkoop, eerste spaardoel) ────────────────────────
  {
    id: 'foll_apple', type: 'follower', name: 'Appel', cost: 120,
    params: { sprite: 'appel', bob: 4, bobSpeed: 2.2 },
  },
  {
    id: 'foll_banana', type: 'follower', name: 'Banaan', cost: 140,
    params: { sprite: 'banaan', bob: 4, bobSpeed: 2.2 },
  },
  {
    id: 'foll_ghost', type: 'follower', name: 'Spookje', cost: 150,
    params: { sprite: 'ghost' },
  },
  {
    id: 'foll_mushroom', type: 'follower', name: 'Paddenstoel', cost: 160,
    params: { sprite: 'paddestoel', bob: 3, bobSpeed: 2 },
  },
  {
    id: 'foll_balloon', type: 'follower', name: 'Ballon', cost: 180,
    // Drifts lazily: high lag, big slow bob. It's a balloon, it should lag behind.
    params: { sprite: 'ballon', lag: 0.05, bob: 9, bobSpeed: 1.6, offsetY: -20 },
  },

  // ── Licht & vuur ──────────────────────────────────────────────────────────
  {
    id: 'foll_lamp', type: 'follower', name: 'Lampje', cost: 200,
    params: { sprite: 'lampje', bob: 4 },
  },
  {
    id: 'foll_sparkles', type: 'follower', name: 'Sterretjes', cost: 220,
    params: { sprite: 'sterretjes', bob: 8, bobSpeed: 4.5, alpha: 0.95 },
  },
  {
    id: 'foll_flame', type: 'follower', name: 'Vlammetje', cost: 260,
    params: { sprite: 'vlammetje', bob: 5, bobSpeed: 5 },
  },

  // ── Vliegend spul ─────────────────────────────────────────────────────────
  {
    id: 'foll_pacman', type: 'follower', name: 'Happertje', cost: 280,
    params: { sprite: 'happertje', bob: 5, bobSpeed: 3.5 },
  },
  {
    id: 'foll_drone', type: 'follower', name: 'Drone', cost: 300,
    params: { sprite: 'drone' },
  },
  {
    id: 'foll_parrot', type: 'follower', name: 'Papegaai', cost: 320,
    params: { sprite: 'papegaai', bob: 8, bobSpeed: 4 },
  },
  {
    id: 'foll_ufo', type: 'follower', name: 'UFO', cost: 380,
    // Hovers eerily still: almost no bob, tight follow.
    params: { sprite: 'ufo', lag: 0.18, bob: 2, bobSpeed: 1.2, offsetY: -22 },
  },
  {
    id: 'foll_plane', type: 'follower', name: 'Vliegtuig', cost: 420,
    params: { sprite: 'vliegtuig', lag: 0.09, bob: 5, bobSpeed: 2, offsetY: -24 },
  },
  {
    id: 'foll_rocket', type: 'follower', name: 'Raket', cost: 480,
    // Darts: snappy lag, quick jittery bob.
    params: { sprite: 'raket', lag: 0.22, bob: 4, bobSpeed: 6 },
  },
  {
    id: 'foll_phoenix', type: 'follower', name: 'Feniks', cost: 600,
    params: { sprite: 'feniks', bob: 9, bobSpeed: 3.2, scale: 2 },
  },
];
