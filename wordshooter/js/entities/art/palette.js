/**
 * art/palette.js — The shared colour palette every follower is drawn from.
 *
 * Shared on purpose: it keeps the whole cast looking like one set, however many
 * themes we add. A follower grid is nothing but these chars.
 *
 *   .  transparent   K  outline/black   W  white        w  white-shade
 *   R  red           r  dark red        O  orange       Y  yellow
 *   G  green         g  dark green      B  blue         b  dark blue
 *   C  cyan          P  purple          M  pink         N  brown
 *   S  silver        D  dark grey       E  eye-dark     L  glint/white-hot
 */

export const SIZE = 12;

export const PALETTE = {
  K: '#1a1a22', W: '#f0f4ff', w: '#a9cef0', R: '#e04030', r: '#a02818',
  O: '#ff8c1a', Y: '#ffd23f', G: '#4ac850', g: '#2a8a38', B: '#4a9ae0',
  b: '#2a5aa0', C: '#7fe8f0', P: '#a05ad0', M: '#f070b0', N: '#8a5a2a',
  S: '#9aa6b8', D: '#5a6472', E: '#26405c', L: '#ffffff',
};
