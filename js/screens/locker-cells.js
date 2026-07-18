/**
 * locker-cells.js — What a cosmetic looks like inside a locker grid cell.
 *
 * One entry per cosmetic type. The locker draws the frame, the name and the
 * price; this only draws the ART, centered on (cx, cy). A new cosmetic type =
 * one entry here, and the locker itself needs no changes.
 */

import { Sprites } from '../sprites.js';
import { drawPlayer, skinKey } from '../cosmetics/skins.js';

export const CELL_ART = {
  skin(ctx, item, cx, cy) {
    const s = 2;                       // 16×24 body → 32×48
    drawPlayer(ctx, skinKey(item.id, true, false), cx - 8 * s, cy - 12 * s, { scale: s });
  },

  follower(ctx, item, cx, cy) {
    if (item.__none) {
      ctx.fillStyle = '#7fa07f';
      ctx.fillRect(cx - 10, cy - 2, 20, 3);   // a dash: "nothing"
      return;
    }
    const s = 3;                       // 12×12 → 36×36
    const key = `follower_${(item.params && item.params.sprite) || 'ghost'}`;
    Sprites.draw(ctx, key, cx - 6 * s, cy - 6 * s, { scale: s });
  },

  /**
   * No single frame captures an effect, so show its colors as a spray. A
   * box-anim carries no colors of its own — its palette is in the closing
   * burst, or in the wash it paints over the box.
   */
  hitEffect(ctx, item, cx, cy) {
    const p = item.params || {};
    const colors = p.colors
      || (p.burst && p.burst.colors)
      || (p.tint && [p.tint.color])
      || (p.beamColor && [p.beamColor])
      || ['#44ff44'];
    const spots = [
      [0, -14, 5], [-13, -6, 4], [12, -7, 4], [-8, 6, 6],
      [9, 5, 5], [0, 0, 7], [-17, 3, 3], [16, -1, 3],
    ];
    spots.forEach(([dx, dy, size], i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(cx + dx - size / 2, cy + dy - size / 2, size, size);
    });
  },
};
