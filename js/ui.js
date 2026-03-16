export function drawHeart(ctx, x, y, size, fillType) {
  // fillType: 'full', 'half', 'empty'
  const s = size;
  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);

  // Clip for half
  if (fillType === 'half') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-s, -s, s, s * 2);
    ctx.clip();
  }

  // Heart shape
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.6, -s * 0.2, -s * 0.6, -s * 0.65, 0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.6, -s * 0.65, s * 0.6, -s * 0.2, 0, s * 0.3);
  ctx.closePath();

  if (fillType === 'full' || fillType === 'half') {
    ctx.fillStyle = '#cc2222';
    ctx.fill();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (fillType === 'half') {
    ctx.restore();
    // Right half outline
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.2, -s * 0.6, -s * 0.65, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.6, -s * 0.65, s * 0.6, -s * 0.2, 0, s * 0.3);
    ctx.closePath();
    ctx.strokeStyle = '#882222';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (fillType === 'empty') {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.2, -s * 0.6, -s * 0.65, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.6, -s * 0.65, s * 0.6, -s * 0.2, 0, s * 0.3);
    ctx.closePath();
    ctx.strokeStyle = '#553333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawHUD(ctx, gameState) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;

  // === Top panel background ===
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#0a150a';
  ctx.fillRect(0, 0, cw, 80);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Border line
  ctx.fillStyle = '#2d4a2d';
  ctx.fillRect(0, 80, cw, 2);

  // === Hearts (top-left) ===
  const heartSize = 20;
  const heartGap = 4;
  const heartsX = 14;
  const heartsY = 14;

  for (let i = 0; i < gameState.maxHealth; i++) {
    const hx = heartsX + i * (heartSize + heartGap);
    const hy = heartsY;
    const hearts = gameState.health;
    if (i < Math.floor(hearts)) {
      drawHeart(ctx, hx, hy, heartSize, 'full');
    } else if (i < hearts) {
      drawHeart(ctx, hx, hy, heartSize, 'half');
    } else {
      drawHeart(ctx, hx, hy, heartSize, 'empty');
    }
  }

  // Shield indicator
  if (gameState.shield) {
    ctx.fillStyle = '#44aaff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHIELD', heartsX, heartsY + heartSize + 10);
  }

  // RapidFire indicator
  if (gameState.rapidFire) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('RAPID', heartsX + (gameState.shield ? 60 : 0), heartsY + heartSize + 10);
  }

  // SpeedBoost indicator
  if (gameState.speedBoost) {
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const offsetX = (gameState.shield ? 60 : 0) + (gameState.rapidFire ? 60 : 0);
    ctx.fillText('SPEED', heartsX + offsetX, heartsY + heartSize + 10);
  }

  // === Score (top-right) ===
  ctx.fillStyle = '#a0e080';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${gameState.score}`, cw - 14, 14);

  // Score label
  ctx.fillStyle = '#6a8a6a';
  ctx.font = '11px monospace';
  ctx.fillText('SCORE', cw - 14, 38);

  // Combo/Multiplier
  if (gameState.combo > 1) {
    ctx.fillStyle = gameState.multiplier > 2 ? '#ffdd00' : '#ffaa44';
    ctx.font = `bold ${Math.min(18, 12 + gameState.combo)}px monospace`;
    ctx.fillText(`x${gameState.multiplier} COMBO ${gameState.combo}`, cw - 14, 52);
  }

  // === Current word (centered top) — hidden during boss fight or No-Peek ===
  const prompt = (gameState.bossMode || gameState.promptVisible === false) ? '' : gameState.prompt;
  if (prompt) {
    // Arrow pointing direction
    const l1 = gameState.lang1 || 'A', l2 = gameState.lang2 || 'B';
    const dirLabel = gameState.direction === 'a-to-b' ? `${l1} → ${l2}` : `${l2} → ${l1}`;
    ctx.fillStyle = '#4a6a4a';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(dirLabel, cw / 2, 6);

    // The word to translate
    ctx.fillStyle = '#e0ffe0';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#44aa44';
    ctx.shadowBlur = 8;
    ctx.fillText(prompt, cw / 2, 35);
    ctx.shadowBlur = 0;
  }

  // === Round indicator + modifier badge (bottom strip of HUD) ===
  if (gameState.round > 1) {
    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`ROUND ${gameState.round} / 4`, 14, 78);
  }

  if (gameState.modifier) {
    const modifierLabels = {
      boxesMove:    '⇄ BOXES MOVE',
      mirrorWorld:  '↔ MIRROR WORLD',
      doubleTrouble:'✦ DOUBLE TROUBLE',
      noPeek:       '👁 NO-PEEK',
      lowGravity:   '↑ LOW GRAVITY',
    };
    const label = modifierLabels[gameState.modifier] || gameState.modifier.toUpperCase();
    ctx.fillStyle = '#ff88ff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, cw - 14, 78);
  }

  // === Timer bar + progress (hidden during boss fight) ===
  if (!gameState.bossMode) {
    const timerBarX = cw / 2 - 120;
    const timerBarY = 62;
    const timerBarW = 240;
    const timerBarH = 10;

    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(timerBarX, timerBarY, timerBarW, timerBarH);

    const timerRatio = Math.max(0, gameState.timer / gameState.timerMax);
    const timerColor = timerRatio > 0.5 ? '#44aa44' :
                       timerRatio > 0.25 ? '#aaaa00' : '#cc2222';
    ctx.fillStyle = timerColor;
    ctx.fillRect(timerBarX, timerBarY, timerBarW * timerRatio, timerBarH);

    ctx.strokeStyle = '#2d4a2d';
    ctx.lineWidth = 1;
    ctx.strokeRect(timerBarX, timerBarY, timerBarW, timerBarH);

    ctx.fillStyle = '#6a8a6a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.ceil(gameState.timer)}s`, cw / 2, timerBarY + timerBarH + 2);

    // Progress indicator
    ctx.fillStyle = '#4a6a4a';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${gameState.correctCount}/${gameState.totalWords}`, cw - 14, 72);
  }

  // === Upgrade notification ===
  if (gameState.upgradeText && gameState.upgradeTimer > 0) {
    const alpha = Math.min(1, gameState.upgradeTimer * 2);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Banner
    const bw = 300;
    const bh = 50;
    const bx = (cw - bw) / 2;
    const by = ch / 2 - 80;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UPGRADE!', cw / 2, by + 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(gameState.upgradeText, cw / 2, by + 36);

    ctx.restore();
  }

  // === Streak indicator ===
  if (gameState.streakNotify && gameState.streakNotifyTimer > 0) {
    const alpha = Math.min(1, gameState.streakNotifyTimer * 3);
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#ffdd00';
    ctx.font = `bold ${28 + Math.floor(gameState.combo / 5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 15;
    ctx.fillText(`🔥 ${gameState.combo} STREAK!`, cw / 2, ch / 2 - 120);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

export function drawBossHUD(ctx, boss) {
  const cw = ctx.canvas.width;
  const now = Date.now();
  const isP2 = boss.phase === 2;
  const isVulnerable = !boss.immune;

  // Dark top strip background
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = isP2 ? '#1a0000' : '#0d0020';
  ctx.fillRect(0, 0, cw, 30);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Health bar
  const barW = Math.floor(cw * 0.62);
  const barH = 18;
  const barX = Math.floor((cw - barW) / 2);
  const barY = 5;

  // Bar background
  ctx.fillStyle = '#1a0000';
  ctx.fillRect(barX, barY, barW, barH);

  // Bar fill
  const hRatio = Math.max(0, boss.health / boss.maxHealth);
  let barFill;
  if (isVulnerable) {
    const p = 0.45 + Math.abs(Math.sin(now * 0.006)) * 0.4;
    barFill = `hsl(120, 90%, ${Math.round(35 + p * 20)}%)`;
  } else {
    barFill = isP2 ? '#cc2200' : '#aa1133';
  }
  ctx.fillStyle = barFill;
  ctx.fillRect(barX, barY, Math.round(barW * hRatio), barH);

  // HP pip markers (every 3 HP)
  ctx.strokeStyle = '#00000055';
  ctx.lineWidth = 1;
  for (let i = 3; i < boss.maxHealth; i += 3) {
    const px = barX + Math.round(barW * (i / boss.maxHealth));
    ctx.beginPath(); ctx.moveTo(px, barY); ctx.lineTo(px, barY + barH); ctx.stroke();
  }

  // Bar border + glow
  ctx.save();
  if (isVulnerable) {
    ctx.shadowColor = '#00ff44';
    ctx.shadowBlur = 12;
  }
  ctx.strokeStyle = isP2 ? '#ff3300' : '#880044';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.restore();

  // Label centred on bar
  ctx.save();
  ctx.font = `bold 11px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  ctx.fillStyle = isP2 ? '#ff8844' : '#ffaacc';
  const label = isP2 ? '\u26A1 SPELLING OVERLORD — ENRAGED \u26A1' : '\u26A1 SPELLING OVERLORD \u26A1';
  ctx.fillText(label, cw / 2, barY + barH / 2);
  ctx.restore();

  // Vulnerability flash beneath bar
  if (isVulnerable) {
    ctx.save();
    const pulse = 0.5 + Math.abs(Math.sin(now * 0.007)) * 0.5;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    ctx.fillText(`\u25BA\u25BA SHOOT THE BOSS! ${Math.ceil(boss.vulnerableTimer)}s \u25C4\u25C4`, cw / 2, barY + barH + 3);
    ctx.restore();
  }
}

export function drawRedOverlay(ctx, intensity) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.6, intensity * 0.6);
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}
