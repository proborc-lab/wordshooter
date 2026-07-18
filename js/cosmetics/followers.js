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

/** Sorted by price on export, so the shop always reads cheap→expensive however
 *  the entries below are grouped. Nothing depends on follower catalog order. */
const ROSTER = [
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

  // ── Tweede lichting: één uit elk thema ────────────────────────────────────
  // The motion params carry as much character as the art does — see the snail.
  {
    id: 'foll_rock', type: 'follower', name: 'Steen met Ogen', cost: 130,
    // It does nothing. It has eyes. It lurches. That is the entire joke.
    params: { sprite: 'steenmetogen', lag: 0.04, bob: 1, bobSpeed: 0.8 },
  },
  {
    id: 'foll_snail', type: 'follower', name: 'Slak', cost: 150,
    // Absurd lag: it trails miles behind and never quite catches up.
    params: { sprite: 'slak', lag: 0.02, bob: 1, bobSpeed: 1, offsetX: -34 },
  },
  {
    id: 'foll_hay', type: 'follower', name: 'Hooibaal', cost: 170,
    params: { sprite: 'hooibaal', lag: 0.06, bob: 2, bobSpeed: 1.4 },
  },
  {
    id: 'foll_popcorn', type: 'follower', name: 'Popcorn', cost: 190,
    params: { sprite: 'popcorn', bob: 6, bobSpeed: 5.5 },
  },
  {
    id: 'foll_beachball', type: 'follower', name: 'Strandbal', cost: 210,
    params: { sprite: 'strandbal', lag: 0.07, bob: 10, bobSpeed: 2.4 },
  },
  {
    id: 'foll_hedgehog', type: 'follower', name: 'Egeltje', cost: 230,
    params: { sprite: 'egeltje', bob: 3, bobSpeed: 2.6 },
  },
  {
    id: 'foll_icecream', type: 'follower', name: 'IJsje', cost: 240,
    params: { sprite: 'ijsje', bob: 4, bobSpeed: 2.2 },
  },
  {
    id: 'foll_chicken', type: 'follower', name: 'Kippetje', cost: 250,
    params: { sprite: 'kippetje', bob: 6, bobSpeed: 5 },
  },
  {
    id: 'foll_pizza', type: 'follower', name: 'Pizzapunt', cost: 260,
    params: { sprite: 'pizzapunt', bob: 5, bobSpeed: 3 },
  },
  {
    id: 'foll_fedora', type: 'follower', name: 'Gleufhoed', cost: 280,
    // An empty hat, floating along by itself. Funnier than a gangster, and safer.
    params: { sprite: 'gleufhoed', lag: 0.09, bob: 4, bobSpeed: 2 },
  },
  {
    id: 'foll_jelly', type: 'follower', name: 'Kwal', cost: 300,
    // Slow and hypnotic: the tendrils curl on the second frame.
    params: { sprite: 'kwal', lag: 0.05, bob: 12, bobSpeed: 1.5, alpha: 0.8 },
  },
  {
    id: 'foll_owl', type: 'follower', name: 'Uil', cost: 320,
    params: { sprite: 'uil', bob: 7, bobSpeed: 3.4 },
  },
  {
    id: 'foll_skull', type: 'follower', name: 'Skeletje', cost: 340,
    params: { sprite: 'skeletje', bob: 6, bobSpeed: 2.8, alpha: 0.9 },
  },
  {
    id: 'foll_octopus', type: 'follower', name: 'Octopusje', cost: 360,
    params: { sprite: 'octopusje', lag: 0.07, bob: 9, bobSpeed: 2.2 },
  },
  {
    id: 'foll_wisp', type: 'follower', name: 'Dwaallichtje', cost: 380,
    params: { sprite: 'dwaallichtje', bob: 11, bobSpeed: 4.5, alpha: 0.85 },
  },
  {
    id: 'foll_monkey', type: 'follower', name: 'Aapje', cost: 400,
    params: { sprite: 'aapje', bob: 8, bobSpeed: 4.2 },
  },
  {
    id: 'foll_snowman', type: 'follower', name: 'Sneeuwpop', cost: 420,
    params: { sprite: 'sneeuwpop', lag: 0.08, bob: 3, bobSpeed: 1.6 },
  },
  {
    id: 'foll_scarab', type: 'follower', name: 'Scarabee', cost: 450,
    params: { sprite: 'scarabee', bob: 5, bobSpeed: 6 },
  },
  {
    id: 'foll_violincase', type: 'follower', name: 'Vioolkoffer', cost: 470,
    params: { sprite: 'vioolkoffer', lag: 0.1, bob: 3, bobSpeed: 1.8 },
  },
  {
    id: 'foll_rubik', type: 'follower', name: 'Rubiks Kubus', cost: 500,
    params: { sprite: 'rubikskubus', bob: 4, bobSpeed: 2.5 },
  },
  {
    id: 'foll_trafficlight', type: 'follower', name: 'Verkeerslicht', cost: 520,
    // Same grid twice; only the lit lamp moves from red to green. Cheapest
    // good idea in the cast — and the only follower that actually *does* something.
    params: { sprite: 'verkeerslicht', lag: 0.08, bob: 2, bobSpeed: 1.2 },
  },
  {
    id: 'foll_robot', type: 'follower', name: 'Robotje', cost: 550,
    params: { sprite: 'robotje', lag: 0.16, bob: 4, bobSpeed: 3 },
  },
  {
    id: 'foll_clapper', type: 'follower', name: 'Filmklapper', cost: 580,
    // It doesn't bob — it CLAPS. The two frames are open and shut.
    params: { sprite: 'filmklapper', bob: 3, bobSpeed: 2 },
  },
  {
    id: 'foll_crystal', type: 'follower', name: 'Kristal', cost: 620,
    params: { sprite: 'kristal', bob: 7, bobSpeed: 2.6, alpha: 0.9 },
  },
  {
    id: 'foll_dragon', type: 'follower', name: 'Draakje', cost: 700,
    params: { sprite: 'draakje', bob: 9, bobSpeed: 3.6 },
  },
  {
    id: 'foll_frog', type: 'follower', name: 'Kikker', cost: 200,
    params: { sprite: 'kikker', bob: 7, bobSpeed: 4.5 },
  },
  {
    id: 'foll_bee', type: 'follower', name: 'Bijtje', cost: 270,
    // Nervous little wingbeat: fast, twitchy bob.
    params: { sprite: 'bijtje', lag: 0.2, bob: 4, bobSpeed: 8 },
  },
  {
    id: 'foll_penguin', type: 'follower', name: 'Pinguïn', cost: 330,
    params: { sprite: 'pinguin', bob: 4, bobSpeed: 2.8 },
  },
  {
    id: 'foll_bat', type: 'follower', name: 'Vleermuis', cost: 350,
    params: { sprite: 'vleermuis', lag: 0.15, bob: 10, bobSpeed: 5.5 },
  },
  {
    id: 'foll_grave', type: 'follower', name: 'Grafsteentje', cost: 390,
    params: { sprite: 'grafsteentje', lag: 0.05, bob: 2, bobSpeed: 1.2 },
  },

  // ── Toneelstukjes (750-1200) ──────────────────────────────────────────────
  // These don't bob, they PERFORM: multi-frame loops with a punchline. Priced
  // above the rest because a gag you watch is worth more than a shape that
  // floats. `fps` sets the comic timing — the dead air before the bang is the
  // whole joke, so a slow fps often reads funnier than a fast one.
  {
    id: 'foll_toaster', type: 'follower', name: 'Broodrooster', cost: 750,
    // Slow on purpose: 3 fps = two full seconds of nothing before the PING.
    params: { sprite: 'broodrooster', fps: 3, lag: 0.07, bob: 2, bobSpeed: 1.2 },
  },
  {
    id: 'foll_toiletroll', type: 'follower', name: 'Wc-rol', cost: 780,
    params: { sprite: 'wcrol', fps: 3, lag: 0.06, bob: 3, bobSpeed: 1.4 },
  },
  {
    id: 'foll_sleepycat', type: 'follower', name: 'Slapend Katje', cost: 820,
    // Sleepy timing. Rushing this one ruins it.
    params: { sprite: 'katje', fps: 2.5, lag: 0.05, bob: 2, bobSpeed: 1 },
  },
  {
    id: 'foll_cactusflower', type: 'follower', name: 'Bloeiende Cactus', cost: 850,
    params: { sprite: 'cactus', fps: 3, lag: 0.06, bob: 2, bobSpeed: 1.2 },
  },
  {
    id: 'foll_hen', type: 'follower', name: 'Legkip', cost: 880,
    params: { sprite: 'legkip', fps: 4, bob: 4, bobSpeed: 2 },
  },
  {
    id: 'foll_monkeybanana', type: 'follower', name: 'Aapje met Banaan', cost: 900,
    params: { sprite: 'aapje_eet', fps: 3, bob: 6, bobSpeed: 2.5 },
  },
  {
    id: 'foll_coffee', type: 'follower', name: 'Koffiebeker', cost: 930,
    // Fast: the jitter has to look like caffeine, not like a shrug.
    params: { sprite: 'koffiebeker', fps: 9, lag: 0.14, bob: 2, bobSpeed: 3 },
  },
  {
    id: 'foll_soda', type: 'follower', name: 'Frisdrankflesje', cost: 960,
    params: { sprite: 'frisdrank', fps: 6, lag: 0.1, bob: 2, bobSpeed: 2 },
  },
  {
    id: 'foll_candle', type: 'follower', name: 'Kaarsje', cost: 1000,
    params: { sprite: 'kaarsje', fps: 2.5, lag: 0.05, bob: 3, bobSpeed: 1.2, alpha: 0.95 },
  },
  {
    id: 'foll_croc', type: 'follower', name: 'Krokodil', cost: 1050,
    // 2.5 fps: six frames of stillness is nearly two and a half seconds. The
    // snap only lands because you'd stopped expecting it.
    params: { sprite: 'krokodil', fps: 2.5, lag: 0.06, bob: 2, bobSpeed: 1 },
  },
  {
    id: 'foll_volcano', type: 'follower', name: 'Vulkaantje', cost: 1120,
    params: { sprite: 'vulkaan', fps: 3.5, lag: 0.05, bob: 1, bobSpeed: 0.8 },
  },
  {
    id: 'foll_door', type: 'follower', name: 'Zwevende Deur', cost: 1200,
    // Somebody lives in there. Slow, so you have time to notice the eye.
    params: { sprite: 'deur', fps: 2.5, lag: 0.05, bob: 2, bobSpeed: 0.9 },
  },
];

export const FOLLOWERS = [...ROSTER].sort((a, b) => a.cost - b.cost);
