import { Sprites } from './sprites.js';

export class Projectile {
  constructor(x, y, vx, vy, fromPlayer) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.width = fromPlayer ? 10 : 8;
    this.height = fromPlayer ? 5 : 4;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Slight gravity for monster projectiles
    if (!this.fromPlayer) {
      this.vy += 200 * dt;
    }
  }

  draw(ctx, cameraX) {
    const sx = this.x - cameraX;
    ctx.save();
    if (this.fromPlayer) {
      // Yellow tracer
      ctx.fillStyle = '#ffee00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 6;
      ctx.fillRect(sx - this.width, this.y - this.height / 2, this.width, this.height);
      // Trail
      ctx.globalAlpha = 0.4;
      ctx.fillRect(sx - this.width * 2.5, this.y - this.height / 2 + 1, this.width * 1.5, this.height - 2);
    } else {
      // Red monster projectile
      ctx.fillStyle = '#ff3322';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(sx - this.vx * 0.02, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  isOffScreen(cameraX, canvasW, canvasH) {
    const sx = this.x - cameraX;
    return sx < -50 || sx > canvasW + 50 || this.y < -50 || this.y > canvasH + 50;
  }

  hitBox(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }
}

export class WordBox {
  constructor(x, y, word, isCorrect) {
    this.x = x;
    this.y = y;
    this.width = 110;
    this.height = 64;
    this.word = word;
    this.isCorrect = isCorrect;
    this.state = 'normal'; // 'normal' | 'hit-correct' | 'hit-wrong' | 'destroyed'
    this.hitTimer = 0;
    this.hitDuration = 0.4;
    this.shakeX = 0;
    this.shakeY = 0;
    this.alive = true;
    this.particles = [];
  }

  update(dt) {
    if (this.state === 'hit-correct' || this.state === 'hit-wrong') {
      this.hitTimer -= dt;
      if (this.state === 'hit-wrong') {
        this.shakeX = (Math.random() - 0.5) * 8;
        this.shakeY = (Math.random() - 0.5) * 4;
      }
      if (this.hitTimer <= 0) {
        if (this.state === 'hit-correct') {
          this.state = 'destroyed';
          this.alive = false;
        } else {
          this.state = 'normal';
          this.shakeX = 0;
          this.shakeY = 0;
        }
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      p.life -= dt;
      return p.life > 0;
    });
  }

  spawnParticles(correct) {
    const color = correct ? '#44ff44' : '#ff4444';
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 200 - 100,
        color,
        size: Math.random() * 5 + 2,
        life: Math.random() * 0.4 + 0.2
      });
    }
  }

  draw(ctx, cameraX) {
    if (this.state === 'destroyed' && this.particles.length === 0) return;

    const sx = Math.round(this.x - cameraX + this.shakeX);
    const sy = Math.round(this.y + this.shakeY);
    const w = this.width;
    const h = this.height;

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life * 2.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (this.state === 'destroyed') return;

    // Box background
    let bgColor = '#2d3a1a';
    let borderColor = '#5a7a3a';
    let textColor = '#c0e090';

    if (this.state === 'hit-correct') {
      const t = this.hitTimer / this.hitDuration;
      bgColor = `rgba(50,180,50,${0.3 + t * 0.4})`;
      borderColor = '#44ff44';
      textColor = '#ffffff';
    } else if (this.state === 'hit-wrong') {
      const t = this.hitTimer / this.hitDuration;
      bgColor = `rgba(180,50,50,${0.3 + t * 0.4})`;
      borderColor = '#ff4444';
      textColor = '#ffffff';
    }

    // Crate body
    ctx.fillStyle = bgColor;
    ctx.fillRect(sx, sy, w, h);

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, w, h);

    // Crate wood lines
    if (this.state === 'normal') {
      ctx.strokeStyle = '#3a4a2a';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy + h / 2);
      ctx.lineTo(sx + w, sy + h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + w / 2, sy);
      ctx.lineTo(sx + w / 2, sy + h);
      ctx.stroke();
      // Diagonal cross
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + 6);
      ctx.lineTo(sx + w - 6, sy + h - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + w - 6, sy + 6);
      ctx.lineTo(sx + 6, sy + h - 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Word text
    ctx.fillStyle = textColor;
    const fontSize = this.word.length > 10 ? 11 : (this.word.length > 7 ? 13 : 15);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.word, sx + w / 2, sy + h / 2);
    ctx.shadowBlur = 0;

    // Correct indicator
    if (this.isCorrect && this.state === 'hit-correct') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('✓', sx + w / 2, sy - 12);
    }
  }

  checkCollision(projectile) {
    if (this.state !== 'normal') return false;
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }

  hit(correct) {
    this.state = correct ? 'hit-correct' : 'hit-wrong';
    this.hitTimer = this.hitDuration;
    this.spawnParticles(correct);
  }
}

export class BonusBox extends WordBox {
  constructor(x, y, reward) {
    const rewardLabels = {
      doubleScore: '2x SCORE',
      plusHeart: '+HEART',
      plusTime: '+TIME',
      rapidFire: 'RAPID',
      shield: 'SHIELD'
    };
    super(x, y, rewardLabels[reward] || reward, false);
    this.width = 100;
    this.height = 56;
    this.reward = reward;
    this.isBonusBox = true;
    this.pulseTimer = 0;
  }

  update(dt) {
    super.update(dt);
    this.pulseTimer += dt;
  }

  draw(ctx, cameraX) {
    if (this.state === 'destroyed' && this.particles.length === 0) return;

    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const w = this.width;
    const h = this.height;

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life * 2.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (this.state === 'destroyed') return;

    // Golden pulsing box
    const pulse = 0.7 + Math.sin(this.pulseTimer * 4) * 0.3;
    ctx.save();

    let bgColor = `rgba(120, 90, 0, ${0.6 + pulse * 0.2})`;
    let borderColor = `hsl(45, 100%, ${40 + pulse * 30}%)`;

    if (this.state === 'hit-correct') {
      bgColor = 'rgba(200,200,50,0.8)';
      borderColor = '#ffffff';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(sx, sy, w, h);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10 * pulse;
    ctx.strokeRect(sx, sy, w, h);
    ctx.shadowBlur = 0;

    // Star icon
    ctx.fillStyle = `hsl(45, 100%, ${60 + pulse * 20}%)`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ ' + this.word + ' ★', sx + w / 2, sy + h / 2);

    ctx.restore();
  }
}

export class Monster {
  constructor(x, y, spawnedFromBox) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 50;
    this.spawnedFromBox = spawnedFromBox;
    this.fireTimer = 1.5;
    this.fireCooldown = 2.5;
    this.vx = -40; // moves left toward player area
    this.health = 2;
    this.alive = true;
    this.animTimer = 0;
    this.eyeTimer = 0;
    this.dropShadowY = 0;
    this.spawnTimer = 0.3; // brief spawn animation
  }

  update(dt, playerX) {
    this.animTimer += dt;
    this.eyeTimer += dt;
    if (this.spawnTimer > 0) {
      this.spawnTimer -= dt;
      return null;
    }

    // Move toward player horizontally, hover up and down
    const dx = playerX - (this.x + this.width / 2);
    const dir = dx < 0 ? -1 : 1;
    this.vx = dir * 45;
    this.x += this.vx * dt;
    this.y += Math.sin(this.animTimer * 2) * 30 * dt;

    // Fire projectile
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown + (Math.random() - 0.5);
      // Aim toward player
      const angle = Math.atan2(0, dx); // horizontal mostly
      const speed = 280;
      return new Projectile(
        this.x + this.width / 2,
        this.y + this.height / 2,
        dir * -speed,
        -60 + (Math.random() - 0.5) * 40,
        false
      );
    }
    return null;
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx, cameraX) {
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const w = this.width;
    const h = this.height;

    // Spawn scale-up animation
    const spawnScale = this.spawnTimer > 0 ? (1 - this.spawnTimer / 0.3) : 1;
    if (spawnScale <= 0) return;

    // Animation frame alternates at ~2 fps based on eye pulse
    const frame = Math.floor(this.eyeTimer * 2) % 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(sx + w / 2, sy + h / 2);
    ctx.scale(spawnScale, spawnScale);
    Sprites.draw(ctx, 'monster', -w / 2, -h / 2, { frame, scale: 2 });
    // Eye glow overlay (additive shimmer)
    const eyeAlpha = 0.15 + Math.abs(Math.sin(this.eyeTimer * 5)) * 0.2;
    ctx.globalAlpha = eyeAlpha;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-w / 2 + 6, -h / 2 + 12, 10, 6);  // left eye glow
    ctx.fillRect(-w / 2 + 24, -h / 2 + 12, 10, 6); // right eye glow
    ctx.restore();

    // Health bar (drawn at fixed position, unaffected by spawn scale)
    if (spawnScale >= 1) {
      const barY = sy - 8;
      if (this.health < 2) {
        ctx.fillStyle = '#aa1111';
        ctx.fillRect(sx, barY, w, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(sx, barY, w / 2, 4);
      } else {
        ctx.fillStyle = '#228822';
        ctx.fillRect(sx, barY, w, 4);
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(sx, barY, w, 4);
      }
    }
  }
}

// ── Turret ────────────────────────────────────────────────────────────────────
export class Turret {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 26;
    this.height = 18;
    this.alive = true;
    this.health = 1;
    this.fireTimer = 1.5 + Math.random() * 2;
    this.fireCooldown = 3 + Math.random() * 0.8;
    this.aimX = x - 200;
    this.aimY = y;
  }

  update(dt, playerX, playerY) {
    if (!this.alive) return null;
    this.aimX = playerX;
    this.aimY = playerY;
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown;
      const dx = playerX - (this.x + this.width / 2);
      const dy = playerY - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 750) {
        const speed = 240;
        return new Projectile(
          this.x + this.width / 2, this.y,
          (dx / dist) * speed, (dy / dist) * speed,
          false
        );
      }
    }
    return null;
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) this.alive = false;
    return !this.alive;
  }

  draw(ctx, cameraX) {
    if (!this.alive) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const cx = sx + this.width / 2;
    const cy = sy + this.height / 2;

    // Body
    ctx.fillStyle = '#3a4a2a';
    ctx.fillRect(sx, sy, this.width, this.height);
    ctx.strokeStyle = '#6a7a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, this.width, this.height);

    // Barrel pointing toward last known player position
    const angle = Math.atan2(
      this.aimY - (this.y + this.height / 2),
      this.aimX - (this.x + this.width / 2)
    );
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#555533';
    ctx.fillRect(2, -3, 16, 6);
    ctx.restore();

    // Blinking targeting light
    const blink = Math.floor(Date.now() / 400) % 2;
    ctx.fillStyle = blink ? '#ff2200' : '#881100';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Medkit ────────────────────────────────────────────────────────────────────
export class Medkit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.alive = true;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bobTimer += dt * 2;
  }

  draw(ctx, cameraX) {
    if (!this.alive) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y + Math.sin(this.bobTimer) * 3);
    ctx.fillStyle = '#cc1111';
    ctx.fillRect(sx, sy, 18, 18);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, 18, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 7, sy + 3, 4, 12);
    ctx.fillRect(sx + 3, sy + 7, 12, 4);
  }
}

// ── Mine ──────────────────────────────────────────────────────────────────────
export class Mine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 14;
    this.alive = true;
    this.triggered = false;
    this.triggerTimer = 0;
  }

  update(dt) {
    if (this.triggered) {
      this.triggerTimer -= dt;
      if (this.triggerTimer <= 0) this.alive = false;
    }
  }

  trigger() {
    if (this.triggered) return;
    this.triggered = true;
    this.triggerTimer = 0.4;
  }

  draw(ctx, cameraX) {
    if (!this.alive) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const cx = sx + 8;
    const cy = sy + 7;

    if (this.triggered) {
      ctx.save();
      ctx.globalAlpha = this.triggerTimer / 0.4;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Body
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      ctx.strokeStyle = '#884400';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7);
        ctx.lineTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
        ctx.stroke();
      }
      // Blinking LED
      const blink = Math.floor(Date.now() / 600) % 2;
      ctx.fillStyle = blink ? '#ff0000' : '#440000';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
