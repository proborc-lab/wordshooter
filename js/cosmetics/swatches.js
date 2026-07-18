/**
 * swatches.js — The paint. Pure data.
 *
 * The coin sink that has to outlast a school year. You buy a COLOUR; mixing is
 * then free forever. Charging per outfit change would tax experimenting, and a
 * mixer nobody dares to fiddle with is worthless.
 *
 * Price tracks how loud a colour is, not how useful: greys and earths are cheap
 * starter paint, neons and metallics are the trophies. Every swatch works in
 * every region, so a cheap grey is never a wasted purchase.
 *
 * Adding a colour = one entry. Adding a region = one entry in REGIONS (they map
 * straight onto palette.js regions — no new machinery).
 */

/** The parts of the outfit you can paint. Order = order on screen. */
export const REGIONS = [
  { id: 'helmet', name: 'Helm' },
  { id: 'jacket', name: 'Jas' },
  { id: 'legs',   name: 'Broek' },
  { id: 'boots',  name: 'Laarzen' },
  { id: 'hat',    name: 'Hoed' },
  { id: 'trim',   name: 'Sierrand' },
  { id: 'ink',    name: 'Details' },
];

/** Free from the start, so the mixer is never an empty room. */
export const STARTER = ['w_ranger', 'w_ash', 'w_bone', 'w_soil'];

export const SWATCHES = [
  // ── Basis (40-90) — startverf, altijd bruikbaar ───────────────────────────
  { id: 'w_ranger', name: 'Rangergroen', hex: '#2d4a2d', cost: 0 },
  { id: 'w_ash',    name: 'As',          hex: '#4a4a52', cost: 0 },
  { id: 'w_bone',   name: 'Bot',         hex: '#d8d4c8', cost: 0 },
  { id: 'w_soil',   name: 'Aarde',       hex: '#5a4028', cost: 0 },
  { id: 'w_coal',   name: 'Kool',        hex: '#22222a', cost: 40 },
  { id: 'w_slate',  name: 'Leisteen',    hex: '#3f4a55', cost: 50 },
  { id: 'w_sand',   name: 'Zand',        hex: '#b09060', cost: 60 },
  { id: 'w_moss',   name: 'Mos',         hex: '#4a6a2a', cost: 60 },
  { id: 'w_rust',   name: 'Roest',       hex: '#8a4a28', cost: 70 },
  { id: 'w_olive',  name: 'Olijf',       hex: '#6a6a38', cost: 70 },
  { id: 'w_clay',   name: 'Klei',        hex: '#9a6a52', cost: 80 },
  { id: 'w_snow',   name: 'Sneeuw',      hex: '#eef0f4', cost: 90 },

  // ── Kleur (100-200) ───────────────────────────────────────────────────────
  { id: 'w_navy',   name: 'Marineblauw', hex: '#22406a', cost: 100 },
  { id: 'w_wine',   name: 'Wijnrood',    hex: '#6a2222', cost: 100 },
  { id: 'w_forest', name: 'Woudgroen',   hex: '#2a6a3a', cost: 110 },
  { id: 'w_plum',   name: 'Pruim',       hex: '#5a2a7a', cost: 120 },
  { id: 'w_teal',   name: 'Petrol',      hex: '#1a6a7a', cost: 130 },
  { id: 'w_brick',  name: 'Baksteen',    hex: '#a03828', cost: 130 },
  { id: 'w_mustard',name: 'Mosterd',     hex: '#c8a02a', cost: 140 },
  { id: 'w_sky',    name: 'Hemelsblauw', hex: '#4a9ae0', cost: 150 },
  { id: 'w_grass',  name: 'Grasgroen',   hex: '#5ac850', cost: 160 },
  { id: 'w_coral',  name: 'Koraal',      hex: '#e06a52', cost: 170 },
  { id: 'w_royal',  name: 'Koningsblauw',hex: '#2a4ad0', cost: 180 },
  { id: 'w_violet', name: 'Violet',      hex: '#8a4ad8', cost: 200 },

  // ── Fel (220-320) ─────────────────────────────────────────────────────────
  { id: 'w_scarlet',name: 'Vuurrood',    hex: '#e02020', cost: 220 },
  { id: 'w_tangerine',name:'Mandarijn',  hex: '#ff8c1a', cost: 240 },
  { id: 'w_lime',   name: 'Limoen',      hex: '#a8e820', cost: 250 },
  { id: 'w_ice',    name: 'IJsblauw',    hex: '#9adcf0', cost: 260 },
  { id: 'w_hotpink',name: 'Knalroze',    hex: '#f050a0', cost: 280 },
  { id: 'w_turquoise',name:'Turkoois',   hex: '#20e0c0', cost: 300 },
  { id: 'w_magenta',name: 'Magenta',     hex: '#e020c0', cost: 320 },

  // ── Trofee (380-600) — hier gaan de laatste munten heen ────────────────────
  { id: 'w_gold',   name: 'Goud',        hex: '#ffd23f', cost: 380 },
  { id: 'w_silver', name: 'Zilver',      hex: '#c8d0dc', cost: 380 },
  { id: 'w_copper', name: 'Koper',       hex: '#cc7733', cost: 400 },
  { id: 'w_neonlime',name:'Neongroen',   hex: '#7bff2a', cost: 450 },
  { id: 'w_neoncyan',name:'Neoncyaan',   hex: '#2affff', cost: 480 },
  { id: 'w_neonpink',name:'Neonroze',    hex: '#ff2ad0', cost: 500 },
  { id: 'w_void',   name: 'Diepzwart',   hex: '#0a0a10', cost: 550 },
  { id: 'w_pearl',  name: 'Parelwit',    hex: '#ffffff', cost: 600 },
];

const _byId = new Map(SWATCHES.map(s => [s.id, s]));

export function getSwatch(id) {
  return _byId.get(id) || null;
}

/** Free swatches are owned by everyone; the rest must be bought. */
export function isFree(id) {
  const s = getSwatch(id);
  return !!s && !s.cost;
}
