/**
 * palette.js — Outfit colors as data.
 *
 * An outfit names ONE base color per body region; every shade of that region
 * (shadow/dark/mid/hi) is derived from it. That is what makes a new outfit a
 * single line of data instead of a hand-picked set of hexes.
 *
 * Regions are separate palette keys — helmet, jacket, legs and boots no longer
 * share one "outfit" color — which is what makes two- and three-color outfits
 * possible at all. `outfit` is shorthand for helmet+jacket+legs (the 1-color
 * tier); name regions individually for the multi-color tiers.
 *
 *   { colors: { outfit: '#22406a' } }                  → one-color
 *   { colors: { jacket: '#8a2b2b', legs: '#22406a' } } → two-color
 *   { colors: { hat: '#ffd23f', trim: '#fff0a0' } }    → hat colors (see hats.js)
 */

// Lightness multipliers per shade, relative to the region's base color.
// Tuned so ramp('#2d4a2d') reproduces the original Ranger greens.
const STOPS = { shadow: 0.35, dark: 0.62, mid: 1, hi: 1.25 };

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex([h, s, l]) {
  l = Math.min(1, Math.max(0, l));
  const f = n => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** One base color → its shadow/dark/mid/hi shades. */
export function ramp(hex) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const out = {};
  for (const [stop, mul] of Object.entries(STOPS)) {
    out[stop] = hslToHex([h, s, l * mul]);
  }
  return out;
}

/** Which palette key each region's shades land in. */
const REGION_KEYS = {
  helmet: { shadow: 'helmetShadow', dark: 'helmetDark', mid: 'helmetMid' },
  jacket: { dark: 'jacketDark', mid: 'jacketMid', hi: 'jacketHi' },
  legs:   { dark: 'legDark', mid: 'legMid', hi: 'legHi' },
  boots:  { dark: 'bootDark', mid: 'bootToe' },
  hat:    { shadow: 'hatShadow', dark: 'hatDark', mid: 'hatMid', hi: 'hatHi' },
  trim:   { dark: 'trimDark', mid: 'trimMid', hi: 'trimHi' },
  // Headgear "ink": the near-black of a veil mesh, an eye patch, alien eyes.
  // Deliberately NOT the face's own `visor` key — tinting that would draw a bar
  // across the whole face.
  ink:    { mid: 'hatInk' },
};

/** `outfit` paints the whole uniform in one color. */
const OUTFIT_REGIONS = ['helmet', 'jacket', 'legs'];

// The Ranger — ground truth for every pixel the sprite draws.
export const BASE_PALETTE = {
  helmetShadow: '#0f1a0f', helmetDark: '#1a2e1a', helmetMid: '#2d4a2d',
  jacketDark:   '#1a2e1a', jacketMid:  '#2d4a2d', jacketHi:  '#3a5a3a',
  legDark:      '#1a2e1a', legMid:     '#2d4a2d', legHi:     '#3a5a3a',
  bootDark:     '#0a0a0a', bootToe:    '#1e1e1e',
  hatShadow:    '#0f1a0f', hatDark:    '#1a2e1a', hatMid:    '#2d4a2d', hatHi: '#3a5a3a',
  trimDark:     '#8a6a1a', trimMid:    '#d2a52a', trimHi:    '#ffd23f',
  hatInk:       '#14141a',
  skin:         '#c8a878', skinShadow: '#8b6b4a',
  visor:        '#22221a', eye:        '#cc2222', eyeGlint:  '#ff4444',
  gun:          '#888888', gunDark:    '#555555', gunGlint:  '#cccccc',
  beltDark:     '#1a1a0a', buckle:     '#555533',
};

/**
 * Outfit colors → a full sprite palette.
 * `raw` is an escape hatch for one-off keys an outfit wants to nudge directly
 * (eye color, gun) without inventing a region for it.
 */
export function buildPalette(colors = {}, raw = {}) {
  const P = { ...BASE_PALETTE };
  const wanted = { ...colors };

  if (wanted.outfit) {
    for (const r of OUTFIT_REGIONS) if (!wanted[r]) wanted[r] = wanted.outfit;
  }

  for (const [region, hex] of Object.entries(wanted)) {
    const keys = REGION_KEYS[region];
    if (!keys || !hex) continue;
    const shades = ramp(hex);
    for (const [stop, key] of Object.entries(keys)) P[key] = shades[stop];
  }

  return { ...P, ...raw };
}
