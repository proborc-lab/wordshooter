/**
 * outfits.js — The wardrobe. Pure data; catalog.js folds this into COSMETICS.
 *
 * An outfit names ONE base color per region and palette.js derives every shade.
 * Adding an outfit = one entry here. No code changes anywhere — not in the
 * sprite builder, not in the locker.
 *
 * Regions: outfit (= helmet+jacket+legs), helmet, jacket, legs, boots, hat, trim.
 * Hats are pixel grids in hats.js; `hat:` names one, and a hat REPLACES the
 * helmet (so `helmet:` does nothing on a hatted outfit — use `hat:` + `trim:`).
 *
 * Price tiers are a guide, not a formula: how much an outfit POPS matters more
 * than how many colors it has, so a striking one-color outfit may outprice a
 * muddy three-color one.
 *   one-color   200-400      three-color  600-800
 *   two-color   400-600      headgear    1000-1500
 */

export const OUTFITS = [
  // ── The Ranger — the sprite's own colors, always owned ─────────────────────
  { id: 'skin_default', type: 'skin', name: 'Ranger', builtin: true, params: {} },

  // The player's own design. The ONLY skin whose colors don't live here: they
  // come from the player's store (Store.getCustom), because they're per player.
  // skins.js rebuilds its sprite from the store — see rebuildCustom().
  { id: 'skin_custom', type: 'skin', name: 'Mijn Ontwerp', builtin: true, params: {} },

  // ── One color (200-400) ───────────────────────────────────────────────────
  {
    id: 'skin_azure', type: 'skin', name: 'Azuur', cost: 200,
    params: { colors: { outfit: '#22406a' }, palette: { eye: '#ffcc33', eyeGlint: '#fff0a0' } },
  },
  {
    id: 'skin_crimson', type: 'skin', name: 'Karmijn', cost: 200,
    params: { colors: { outfit: '#6a2222' }, palette: { eye: '#ffe033', eyeGlint: '#fff7b0' } },
  },
  {
    id: 'skin_ink', type: 'skin', name: 'Inkt', cost: 220,
    params: { colors: { outfit: '#242438' } },
  },
  {
    id: 'skin_moss', type: 'skin', name: 'Mos', cost: 240,
    params: { colors: { outfit: '#4a6a2a' } },
  },
  {
    id: 'skin_sand', type: 'skin', name: 'Zand', cost: 260,
    params: { colors: { outfit: '#b09060' } },
  },
  {
    id: 'skin_grape', type: 'skin', name: 'Druif', cost: 300,
    params: { colors: { outfit: '#5a2a7a' } },
  },
  {
    id: 'skin_ocean', type: 'skin', name: 'Oceaan', cost: 320,
    params: { colors: { outfit: '#1a6a7a' } },
  },
  {
    id: 'skin_rose', type: 'skin', name: 'Knalroze', cost: 380,
    params: { colors: { outfit: '#d84a95' } },
  },
  {
    id: 'skin_snow', type: 'skin', name: 'Sneeuw', cost: 400,
    params: { colors: { outfit: '#dcdce6', boots: '#3a3a48' } },
  },

  // ── Two colors (400-600) ──────────────────────────────────────────────────
  // `outfit` paints helmet+jacket+legs; naming `legs` after it overrides just the
  // legs. So this really is TWO colors — no stray Ranger-green helmet left over.
  {
    id: 'skin_wasp', type: 'skin', name: 'Wesp', cost: 450,
    params: { colors: { outfit: '#e0b020', legs: '#2a2a2a' } },
  },
  {
    id: 'skin_forest', type: 'skin', name: 'Boswachter', cost: 470,
    params: { colors: { outfit: '#2a6a3a', legs: '#7a5228' } },
  },
  {
    id: 'skin_flame', type: 'skin', name: 'Vlam', cost: 490,
    params: { colors: { outfit: '#e04a20', legs: '#2a1a1a' } },
  },
  {
    id: 'skin_frost', type: 'skin', name: 'Vorst', cost: 520,
    params: { colors: { outfit: '#9adcf0', legs: '#2a4a6a' } },
  },
  {
    id: 'skin_racer', type: 'skin', name: 'Coureur', cost: 550,
    params: { colors: { outfit: '#d02020', legs: '#e8e8e8' } },
  },
  {
    id: 'skin_lava', type: 'skin', name: 'Lava', cost: 600,
    params: { colors: { outfit: '#26262a', legs: '#e05010' } },
  },

  // ── Three colors (600-800) ────────────────────────────────────────────────
  {
    id: 'skin_jungle', type: 'skin', name: 'Jungle', cost: 620,
    params: { colors: { helmet: '#6a9a2a', jacket: '#2a6a3a', legs: '#8a5a2a' } },
  },
  {
    id: 'skin_tricolore', type: 'skin', name: 'Driekleur', cost: 660,
    params: { colors: { helmet: '#d02020', jacket: '#e8e8e8', legs: '#2040a0' } },
  },
  {
    id: 'skin_toucan', type: 'skin', name: 'Toekan', cost: 690,
    params: { colors: { helmet: '#e0a020', jacket: '#26262a', legs: '#e04030' } },
  },
  {
    id: 'skin_harlequin', type: 'skin', name: 'Harlekijn', cost: 720,
    params: { colors: { helmet: '#7a2a8a', jacket: '#c83030', legs: '#2a6ac8' } },
  },
  {
    id: 'skin_candy', type: 'skin', name: 'Snoep', cost: 760,
    params: { colors: { helmet: '#f070b0', jacket: '#f4f4f4', legs: '#70d0f0' } },
  },
  {
    id: 'skin_peacock', type: 'skin', name: 'Pauw', cost: 800,
    params: { colors: { helmet: '#1a8a8a', jacket: '#2a5aa0', legs: '#6a2a8a' } },
  },

  // ── Headgear (1000-1500) ──────────────────────────────────────────────────
  {
    id: 'skin_streetcap', type: 'skin', name: 'Petje', cost: 1000,
    params: { hat: 'pet', colors: { outfit: '#2a4a8a', hat: '#d02020' } },
  },
  {
    id: 'skin_cowboy', type: 'skin', name: 'Cowboy', cost: 1100,
    params: { hat: 'cowboy', colors: { outfit: '#7a5228', hat: '#9a7038', trim: '#4a3018', boots: '#3a2410' } },
  },
  {
    id: 'skin_king', type: 'skin', name: 'Koning', cost: 1200,
    params: { hat: 'kroon', colors: { outfit: '#6a2a8a', trim: '#ffd23f', boots: '#3a2a1a' } },
  },
  {
    id: 'skin_jester', type: 'skin', name: 'Nar', cost: 1300,
    params: { hat: 'nar', colors: { outfit: '#7a2a8a', hat: '#c83030', trim: '#ffd23f' } },
  },
  {
    id: 'skin_wizard', type: 'skin', name: 'Tovenaar', cost: 1400,
    params: { hat: 'tovenaar', colors: { outfit: '#2a2a6a', hat: '#3a3a8a', trim: '#ffd23f' } },
  },
  {
    id: 'skin_gentleman', type: 'skin', name: 'Deftige Heer', cost: 1500,
    params: { hat: 'hoge_hoed', colors: { outfit: '#22222e', hat: '#16161e', trim: '#c02020' } },
  },

  // ── Personages (1600-2400) ────────────────────────────────────────────────
  // Headgear that reaches the FACE — a veil, a visor, an eye patch, a whole
  // alien head. Costlier than the plain-hat tier because the whole silhouette
  // changes, not just what's on top of the head.
  {
    id: 'skin_gardener', type: 'skin', name: 'Tuinman', cost: 1600,
    params: {
      hat: 'strohoed',
      colors: { jacket: '#6a9a3a', legs: '#5a6a48', hat: '#d8b968', trim: '#5a3a1a', boots: '#3a2a18' },
    },
  },
  {
    id: 'skin_beekeeper', type: 'skin', name: 'Imker', cost: 1750,
    params: {
      hat: 'imker',
      // `ink` is the veil: woven grey fabric, not a black hole.
      colors: { outfit: '#e4e4dc', hat: '#f0f0e8', ink: '#55554e', boots: '#3a3a34' },
    },
  },
  {
    id: 'skin_pirate', type: 'skin', name: 'Piraat', cost: 1900,
    params: {
      hat: 'piraat',
      colors: {
        jacket: '#8a2b2b', legs: '#2a2a30', hat: '#c02828',
        trim: '#ffd23f', ink: '#141414', boots: '#3a2410',   // ink = the eye patch
      },
    },
  },
  {
    id: 'skin_alien', type: 'skin', name: 'Alien', cost: 2100,
    params: {
      hat: 'alienkop',
      // The grid covers the whole face, so ink IS the eyes.
      colors: { outfit: '#3a7a4a', hat: '#7ad86a', ink: '#0d0d14', boots: '#1f3a24' },
    },
  },
  {
    id: 'skin_astronaut', type: 'skin', name: 'Astronaut', cost: 2400,
    params: {
      hat: 'ruimtehelm',
      colors: { outfit: '#e8e8ec', hat: '#f4f4f8', trim: '#2a4a7a', boots: '#4a4a52' },
    },
  },
];
