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
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(sx, barY, w, 4);
      }
    }
  }
}

// ── BatMonster ────────────────────────────────────────────────────────────────
export class BatMonster {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width  = 52;
    this.height = 32;
    this.vx = 55;          // drifts rightward as it escapes
    this.vy = -90;         // rising
    this.alive = true;
    this.health = 1;
    this.animTimer = 0;
    this.fireTimer = 1.4;
    this.fireCooldown = 2.0;
    this.spawnTimer = 0.25;
  }

  update(dt) {
    this.animTimer += dt;
    if (this.spawnTimer > 0) { this.spawnTimer -= dt; return null; }
    this.vy -= 18 * dt;    // accelerates upward
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    if (this.y < -120) this.alive = false;   // escaped off-top
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown + (Math.random() - 0.5) * 0.5;
      // Always shoots to the right
      return new Projectile(
        this.x + this.width, this.y + this.height / 2,
        310, -20 + (Math.random() - 0.5) * 50,
        false
      );
    }
    return null;
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) { this.alive = false; return true; }
    return false;
  }

  draw(ctx, cameraX) {
    if (!this.alive) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const spawnScale = this.spawnTimer > 0 ? (1 - this.spawnTimer / 0.25) : 1;
    if (spawnScale <= 0) return;

    ctx.save();
    ctx.translate(sx + this.width / 2, sy + this.height / 2);
    ctx.scale(spawnScale, spawnScale);

    const t = this.animTimer;
    const flapY = Math.sin(t * 9) * 18;   // wing tip oscillates ±18 px vertically

    // Wings
    ctx.fillStyle = '#3a0066';
    ctx.strokeStyle = '#8822cc';
    ctx.lineWidth = 1;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.bezierCurveTo(-14, flapY - 10, -26, flapY - 2, -28, flapY + 4);
    ctx.bezierCurveTo(-18, flapY + 14, -8,  8, -3, 7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.bezierCurveTo(14, flapY - 10, 26, flapY - 2, 28, flapY + 4);
    ctx.bezierCurveTo(18, flapY + 14,  8,  8,  3, 7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Body
    ctx.fillStyle = '#220044';
    ctx.strokeStyle = '#8822cc';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 2, 8, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Ears
    ctx.fillStyle = '#3a0066';
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-9, -20); ctx.lineTo(-1, -9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 5, -8); ctx.lineTo( 9, -20); ctx.lineTo( 1, -9); ctx.closePath(); ctx.fill();
    // Inner ear
    ctx.fillStyle = '#cc44ff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(-6, -16); ctx.lineTo(-2, -10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 4, -9); ctx.lineTo( 6, -16); ctx.lineTo( 2, -10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // Eyes
    ctx.save();
    ctx.fillStyle = '#ff2200';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
    const eyeP = 0.6 + Math.abs(Math.sin(t * 5)) * 0.4;
    ctx.globalAlpha = eyeP;
    ctx.beginPath(); ctx.arc(-3, 0, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3, 0, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(-3, 0, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3, 0, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Fangs
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath(); ctx.moveTo(-2.5, 9); ctx.lineTo(-4.5, 15); ctx.lineTo(-0.5, 9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 2.5, 9); ctx.lineTo( 4.5, 15); ctx.lineTo( 0.5, 9); ctx.closePath(); ctx.fill();

    ctx.restore();
  }
}

// ── SnakeMonster ──────────────────────────────────────────────────────────────
export class SnakeMonster {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width  = 58;
    this.height = 16;
    this.vx = -60;         // crawls left toward player
    this.vy = 0;
    this.alive = true;
    this.health = 1;
    this.animTimer = 0;
    this.jumpTimer  = 0.9 + Math.random() * 0.8;
    this.hasJumped  = false;
    this.gravity    = 290;
    this.spawnTimer = 0.2;
  }

  update(dt) {
    this.animTimer += dt;
    if (this.spawnTimer > 0) { this.spawnTimer -= dt; return; }
    this.x += this.vx * dt;
    if (!this.hasJumped) {
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0) {
        this.hasJumped = true;
        this.vy = -240;
        this.vx = -90;     // lunges forward faster during jump
      }
    } else {
      this.vy += this.gravity * dt;
      this.y  += this.vy * dt;
    }
    if (this.y > 1400) this.alive = false;   // dropped off-screen
  }

  takeDamage() {
    this.alive = false;
    return true;
  }

  draw(ctx, cameraX) {
    if (!this.alive) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const t  = this.animTimer;
    const spawnScale = this.spawnTimer > 0 ? (1 - this.spawnTimer / 0.2) : 1;
    if (spawnScale <= 0) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(spawnScale, 1);

    const segCount = 8;
    const segW     = 7;

    // Body segments — drawn tail→head (right→left) so head renders on top
    for (let i = segCount; i >= 1; i--) {
      const bx = i * segW;
      const by = Math.sin(t * 5.5 + i * 0.85) * 3.5;
      const r  = 4 + (segCount - i) * 0.25;
      const g  = 80 + i * 7;
      ctx.fillStyle = `rgb(15, ${g}, 20)`;
      ctx.beginPath(); ctx.ellipse(bx, by, r * 1.35, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      // Scale highlight every other segment
      if (i % 2 === 0) {
        ctx.fillStyle = `rgba(50, ${g + 60}, 40, 0.35)`;
        ctx.beginPath(); ctx.ellipse(bx, by, r * 0.8, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Head — leftmost, wider, slightly raised
    const hby = Math.sin(t * 5.5) * 3.5;
    ctx.fillStyle = '#003a10';
    ctx.beginPath(); ctx.ellipse(0, hby, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Head shading
    ctx.fillStyle = '#005518';
    ctx.beginPath(); ctx.ellipse(-2, hby - 1, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill();

    // Eye
    ctx.fillStyle = '#dddd00';
    ctx.beginPath(); ctx.arc(-2, hby - 2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-2, hby - 2, 1,   0, Math.PI * 2); ctx.fill();

    // Tongue (flickers)
    if (Math.floor(t * 6) % 3 !== 0) {
      ctx.strokeStyle = '#ff1155';
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-9, hby); ctx.lineTo(-16, hby); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-16, hby); ctx.lineTo(-20, hby - 3);
      ctx.moveTo(-16, hby); ctx.lineTo(-20, hby + 3);
      ctx.stroke();
    }

    ctx.restore();
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

// ── SpellingBox ───────────────────────────────────────────────────────────────
export class SpellingBox extends WordBox {
  constructor(x, y, word, isCorrect) {
    super(x, y, word, isCorrect);
    this.isSpelling = true;
  }

  draw(ctx, cameraX) {
    if (this.state === 'destroyed' && this.particles.length === 0) return;

    const sx = Math.round(this.x - cameraX + this.shakeX);
    const sy = Math.round(this.y + this.shakeY);
    const w = this.width;
    const h = this.height;

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life * 2.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (this.state === 'destroyed') return;

    let bgColor = '#1a1a3a';
    let borderColor = '#4466cc';
    let glowColor = '#2244ff';
    let textColor = '#aaccff';

    if (this.state === 'hit-correct') {
      const t = this.hitTimer / this.hitDuration;
      bgColor = `rgba(50,180,50,${0.3 + t * 0.4})`;
      borderColor = '#44ff44';
      glowColor = '#44ff44';
      textColor = '#ffffff';
    } else if (this.state === 'hit-wrong') {
      const t = this.hitTimer / this.hitDuration;
      bgColor = `rgba(180,50,50,${0.3 + t * 0.4})`;
      borderColor = '#ff4444';
      glowColor = '#ff4444';
      textColor = '#ffffff';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(sx, sy, w, h);

    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(sx, sy, w, h);
    ctx.restore();

    // Spell-check icon top-left
    ctx.save();
    ctx.fillStyle = '#334488';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ABC', sx + 3, sy + 3);
    ctx.restore();

    ctx.fillStyle = textColor;
    const fontSize = this.word.length > 10 ? 11 : (this.word.length > 7 ? 13 : 15);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.word, sx + w / 2, sy + h / 2);
    ctx.shadowBlur = 0;
  }
}

// ── Boss ──────────────────────────────────────────────────────────────────────
export class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this._baseY = y;
    this.width = 95;
    this.height = 120;
    this.health = 9;
    this.maxHealth = 9;
    this.immune = true;
    this.vulnerableTimer = 0;
    this.phase = 1;
    this.fireTimer = 2.0;
    this.fireCooldown = 2.5;
    this.animTimer = 0;
    this.spawnTimer = 1.5;
    this.alive = true;
    this.headWord = '';
    this.roundCount = 0;
    this.dying = false;
    this.deathTimer = 0;
    this.deathPieces = [];
  }

  update(dt, playerX, playerY) {
    this.animTimer += dt;

    if (this.dying) {
      this.deathTimer += dt;
      for (const p of this.deathPieces) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.g * dt;
        p.angle += p.av * dt;
      }
      return null;
    }

    if (this.spawnTimer > 0) {
      this.spawnTimer -= dt;
      return null;
    }

    // Float sinusoidally
    this.y = this._baseY + Math.sin(this.animTimer * 1.4) * 18;

    // Vulnerability countdown
    if (!this.immune) {
      this.vulnerableTimer = Math.max(0, this.vulnerableTimer - dt);
    }

    // Phase 2 at ≤ 4 HP
    if (this.health <= 4 && this.phase === 1) {
      this.phase = 2;
      this.fireCooldown = 1.4;
    }

    // Fire projectiles
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireCooldown + (Math.random() - 0.5) * 0.4;
      const dx = playerX - (this.x + this.width / 2);
      const dy = playerY - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = this.phase === 2 ? 300 : 240;

      if (this.phase === 2) {
        const angle = Math.atan2(dy, dx);
        const spread = 0.22;
        return [
          new Projectile(this.x + this.width / 2, this.y + this.height / 2,
            Math.cos(angle) * speed, Math.sin(angle) * speed, false),
          new Projectile(this.x + this.width / 2, this.y + this.height / 2,
            Math.cos(angle - spread) * speed, Math.sin(angle - spread) * speed, false),
          new Projectile(this.x + this.width / 2, this.y + this.height / 2,
            Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed, false),
        ];
      } else {
        return new Projectile(
          this.x + this.width / 2, this.y + this.height / 2,
          (dx / dist) * speed, (dy / dist) * speed,
          false
        );
      }
    }
    return null;
  }

  takeDamage() {
    if (this.dying) return false;
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      this.dying = true;
      this.deathTimer = 0;
      this.deathPieces = [
        { type: 'shield',  x: this.x - 22,              y: this.y + this.height * 0.45, vx: -260, vy:  -90, angle: 0, av:  3.5, g: 220 },
        { type: 'scepter', x: this.x + this.width + 12,  y: this.y + this.height * 0.30, vx:  290, vy: -170, angle: 0, av: -2.8, g: 160 },
        { type: 'crown',   x: this.x + this.width / 2,   y: this.y + 12,                 vx:   60, vy: -340, angle: 0, av:  4.2, g: 250 },
      ];
      return true;
    }
    return false;
  }

  draw(ctx, cameraX) {
    if (!this.alive && !this.dying) return;

    const spawnProg = this.spawnTimer > 0 ? Math.max(0, 1 - this.spawnTimer / 1.5) : 1;
    if (spawnProg <= 0) return;

    if (this.dying) {
      this._drawDying(ctx, cameraX);
      return;
    }

    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const cx = sx + w / 2;
    const now = Date.now();

    // Word above head (screen-space, no scaling)
    if (this.immune && this.headWord) {
      ctx.save();
      const pulse = 0.7 + Math.abs(Math.sin(now * 0.003)) * 0.3;
      ctx.globalAlpha = spawnProg * pulse;
      ctx.fillStyle = '#ffeeaa';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.fillText(this.headWord, cx, sy - 14);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // SHOOT label when vulnerable
    if (!this.immune) {
      ctx.save();
      const pulse = 0.5 + Math.abs(Math.sin(now * 0.006)) * 0.5;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 14;
      ctx.fillText('** SHOOT! **', cx, sy - 8);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // All body drawing scaled from center
    ctx.save();
    ctx.translate(cx, sy + h / 2);
    ctx.scale(spawnProg, spawnProg);

    const ox = -w / 2;
    const oy = -h / 2;

    const isP2 = this.phase === 2;
    const robeColor  = isP2 ? '#5a0000' : '#260050';
    const robeAccent = isP2 ? '#991111' : '#5500aa';
    const crownColor = isP2 ? '#cc3300' : '#ccaa00';
    const headColor  = isP2 ? '#994422' : '#cc9966';
    const eyeGlow    = isP2 ? '#ff0000' : '#ff4400';

    // Arcane force-field border (immune = red shroud, vulnerable = green pulse)
    ctx.save();
    if (!this.immune) {
      const gAlpha = 0.35 + Math.abs(Math.sin(this.animTimer * 4)) * 0.35;
      ctx.globalAlpha = gAlpha;
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 7;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 22;
    } else {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
    }
    ctx.strokeRect(ox - 5, oy - 5, w + 10, h + 10);
    ctx.restore();

    // ── SCEPTER (right arm, drawn before body so arm overlaps handle) ──────────
    {
      const stX  = ox + w + 6;   // base X — right of body
      const stY  = oy + 70;      // base Y — mid right arm
      const tipX = ox + w + 20;  // tip X
      const tipY = oy - 48;      // tip Y — well above crown

      const staffColor = isP2 ? '#553300' : '#332255';
      const staffShine = isP2 ? '#884400' : '#6644aa';
      const orbFill    = isP2 ? '#ff6622' : '#bb55ff';
      const orbGlowC   = isP2 ? '#ff2200' : '#8800ee';

      ctx.save();
      // Staff shaft
      ctx.strokeStyle = staffColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(stX, stY); ctx.lineTo(tipX, tipY); ctx.stroke();
      // Highlight edge
      ctx.strokeStyle = staffShine;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(stX - 1, stY); ctx.lineTo(tipX - 1, tipY); ctx.stroke();

      // Crossguard
      ctx.strokeStyle = isP2 ? '#aa4400' : '#7755bb';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(tipX - 9, tipY + 13); ctx.lineTo(tipX + 5, tipY + 13); ctx.stroke();

      // Orb outer glow
      const orbPulse = 0.4 + Math.abs(Math.sin(this.animTimer * 2.5)) * 0.6;
      ctx.globalAlpha = orbPulse * 0.55;
      ctx.fillStyle = orbGlowC;
      ctx.shadowColor = orbGlowC;
      ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(tipX, tipY, 11, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Orb body
      ctx.globalAlpha = 1;
      ctx.fillStyle = orbFill;
      ctx.beginPath(); ctx.arc(tipX, tipY, 7, 0, Math.PI * 2); ctx.fill();
      // Skull face: eyes
      ctx.fillStyle = isP2 ? '#1a0000' : '#110022';
      ctx.beginPath(); ctx.arc(tipX - 2.8, tipY - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tipX + 2.8, tipY - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
      // Skull face: jaw gap
      ctx.strokeStyle = isP2 ? '#1a0000' : '#110022';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(tipX, tipY + 2.5, 3, 0.25, Math.PI - 0.25); ctx.stroke();
      // Orb highlight
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.beginPath(); ctx.ellipse(tipX - 2, tipY - 3, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    // Robe / body
    ctx.fillStyle = robeColor;
    ctx.fillRect(ox, oy + 42, w, h - 42);
    ctx.strokeStyle = robeAccent;
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy + 42, w, h - 42);
    // Center seam
    ctx.beginPath(); ctx.moveTo(0, oy + 42); ctx.lineTo(0, oy + h); ctx.stroke();
    // Horizontal trim
    ctx.beginPath(); ctx.moveTo(ox + 4, oy + 68); ctx.lineTo(ox + w - 4, oy + 68); ctx.stroke();
    // Arcane runes on robe
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = isP2 ? '#ff5500' : '#aa44ff';
    ctx.lineWidth = 1;
    const rune = (rx, ry, s) => {
      ctx.beginPath();
      ctx.moveTo(rx, ry - s); ctx.lineTo(rx + s, ry);
      ctx.lineTo(rx, ry + s); ctx.lineTo(rx - s, ry);
      ctx.closePath(); ctx.stroke();
    };
    rune(ox + 20, oy + 82, 5);
    rune(ox + w - 20, oy + 82, 5);
    rune(0, oy + 98, 4);
    ctx.restore();

    // Arms
    ctx.fillStyle = robeColor;
    ctx.fillRect(ox - 14, oy + 48, 14, 36);
    ctx.fillRect(ox + w,  oy + 48, 14, 36);
    ctx.strokeStyle = robeAccent;
    ctx.strokeRect(ox - 14, oy + 48, 14, 36);
    ctx.strokeRect(ox + w,  oy + 48, 14, 36);

    // ── SHIELD (left arm — slides down and fades when boss becomes vulnerable) ──
    {
      // shieldDrop: 0 = fully shown, 1 = fully gone
      let shieldDrop = 0;
      if (!this.immune) {
        const elapsed = 10 - this.vulnerableTimer; // 0→10 over vulnerability window
        shieldDrop = Math.min(1, elapsed / 2.6);   // drops over 2.6 s
      }
      if (shieldDrop < 1) {
        const shCX = ox - 22;
        const shCY = oy + 58;
        ctx.save();
        ctx.translate(shCX, shCY + shieldDrop * 90);
        ctx.globalAlpha = 1 - shieldDrop;

        const shFill  = isP2 ? '#660000' : '#1a0040';
        const shRim   = isP2 ? '#dd4400' : '#7733cc';
        const shGem   = isP2 ? '#ff7700' : '#cc66ff';

        // Hexagonal shield body
        const shR = 32;
        ctx.fillStyle = shFill;
        ctx.strokeStyle = shRim;
        ctx.lineWidth = 2;
        ctx.shadowColor = shRim;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI / 3) - Math.PI / 6;
          const px = Math.cos(a) * shR;
          const py = Math.sin(a) * shR * 1.18;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner cross detail
        ctx.strokeStyle = shRim;
        ctx.globalAlpha = (1 - shieldDrop) * 0.75;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-shR * 0.55, 0); ctx.lineTo(shR * 0.55, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -shR * 0.65); ctx.lineTo(0, shR * 0.65); ctx.stroke();

        // Central gem
        ctx.globalAlpha = 1 - shieldDrop;
        ctx.fillStyle = shGem;
        ctx.shadowColor = shGem;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Gem highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.ellipse(-1.5, -2, 2, 1.2, -0.4, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }
    }

    // Head
    ctx.fillStyle = headColor;
    ctx.fillRect(ox + 12, oy + 22, w - 24, 24);
    ctx.strokeStyle = isP2 ? '#663311' : '#997744';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 12, oy + 22, w - 24, 24);

    // Crown base
    ctx.fillStyle = crownColor;
    ctx.fillRect(ox + 6, oy + 18, w - 12, 10);

    // Crown prongs (3)
    ctx.fillStyle = crownColor;
    const drawProng = (tipX, tipY, baseL, baseR) => {
      ctx.beginPath();
      ctx.moveTo(baseL, oy + 18); ctx.lineTo(tipX, tipY); ctx.lineTo(baseR, oy + 18);
      ctx.fill();
    };
    drawProng(ox + 16,     oy + 2,  ox + 6,      ox + 26);
    drawProng(0,           oy - 8,  ox + w/2 - 9, ox + w/2 + 9);
    drawProng(ox + w - 16, oy + 2,  ox + w - 26, ox + w - 6);

    // Crown jewels
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.arc(ox + 16,     oy + 10, 3,   0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isP2 ? '#ff4400' : '#ffdd00';
    ctx.beginPath(); ctx.arc(0,           oy + 10, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.arc(ox + w - 16, oy + 10, 3,   0, Math.PI * 2); ctx.fill();

    // ── EVIL EYES (slit pupils, angry inward brows) ───────────────────────────
    {
      const eyeAlpha = 0.75 + Math.abs(Math.sin(this.animTimer * 3)) * 0.25;
      const eyeLX = ox + 24;
      const eyeRX = ox + w - 24;
      const eyeY  = oy + 32;
      const iW    = 9;   // iris half-width
      const iH    = 6;   // iris half-height

      ctx.save();
      ctx.globalAlpha = eyeAlpha;

      // Angry brows — slope inward (inner corners lower)
      ctx.strokeStyle = isP2 ? '#330000' : '#1a0011';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(eyeLX - iW, eyeY - iH - 5); ctx.lineTo(eyeLX + iW - 2, eyeY - iH - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeRX + iW, eyeY - iH - 5); ctx.lineTo(eyeRX - iW + 2, eyeY - iH - 1); ctx.stroke();

      // Iris glow
      ctx.fillStyle = eyeGlow;
      ctx.shadowColor = eyeGlow;
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.ellipse(eyeLX, eyeY, iW, iH, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(eyeRX, eyeY, iW, iH, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Vertical slit pupils
      ctx.fillStyle = '#000';
      const slit = (ex) => {
        ctx.beginPath();
        ctx.moveTo(ex,       eyeY - iH + 1);
        ctx.lineTo(ex + 2.5, eyeY);
        ctx.lineTo(ex,       eyeY + iH - 1);
        ctx.lineTo(ex - 2.5, eyeY);
        ctx.closePath();
        ctx.fill();
      };
      slit(eyeLX); slit(eyeRX);

      // Corneal highlight
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.ellipse(eyeLX - 2, eyeY - 2, 3, 2, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(eyeRX - 2, eyeY - 2, 3, 2, -0.4, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    ctx.restore(); // end scale/translate

    // Local health bar
    const barW = w * 0.9;
    const barX = sx + (w - barW) / 2;
    const barY = sy - 10;
    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barW, 5);
    ctx.fillStyle = isP2 ? '#ff3300' : '#cc2222';
    ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), 5);
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, 5);
  }

  _drawDying(ctx, cameraX) {
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const isP2 = this.phase === 2;

    // Fading body (disappears over first 1.5 s)
    const bodyAlpha = Math.max(0, 1 - this.deathTimer / 1.5);
    if (bodyAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = bodyAlpha;
      ctx.translate(sx + w / 2, sy + h / 2);
      const ox = -w / 2, oy = -h / 2;
      const robeColor  = isP2 ? '#5a0000' : '#260050';
      const robeAccent = isP2 ? '#991111' : '#5500aa';
      const crownColor = isP2 ? '#cc3300' : '#ccaa00';
      const headColor  = isP2 ? '#994422' : '#cc9966';
      const eyeGlow    = isP2 ? '#ff0000' : '#ff4400';
      // Robe
      ctx.fillStyle = robeColor;
      ctx.fillRect(ox, oy + 42, w, h - 42);
      ctx.strokeStyle = robeAccent; ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy + 42, w, h - 42);
      ctx.beginPath(); ctx.moveTo(0, oy + 42); ctx.lineTo(0, oy + h); ctx.stroke();
      // Arms
      ctx.fillStyle = robeColor;
      ctx.fillRect(ox - 14, oy + 48, 14, 36);
      ctx.fillRect(ox + w,  oy + 48, 14, 36);
      ctx.strokeStyle = robeAccent;
      ctx.strokeRect(ox - 14, oy + 48, 14, 36);
      ctx.strokeRect(ox + w,  oy + 48, 14, 36);
      // Head
      ctx.fillStyle = headColor;
      ctx.fillRect(ox + 12, oy + 22, w - 24, 24);
      // Crown base only (prongs flew away)
      ctx.fillStyle = crownColor;
      ctx.fillRect(ox + 6, oy + 18, w - 12, 10);
      // Eyes — wide/shocked in death
      ctx.save();
      ctx.fillStyle = eyeGlow;
      ctx.shadowColor = eyeGlow; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(ox + 24, oy + 32, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ox + w - 24, oy + 32, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ox + 24,     oy + 32, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + w - 24, oy + 32, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.restore();
    }

    // Flying pieces — full alpha 0–4 s, fade out 4–5 s
    const pieceAlpha = Math.max(0, 1 - Math.max(0, this.deathTimer - 4));
    if (pieceAlpha > 0) {
      for (const p of this.deathPieces) {
        ctx.save();
        ctx.globalAlpha = pieceAlpha;
        this._drawDeathPiece(ctx, p, cameraX);
        ctx.restore();
      }
    }
  }

  _drawDeathPiece(ctx, piece, cameraX) {
    const sx = piece.x - cameraX;
    const isP2 = this.phase === 2;
    ctx.save();
    ctx.translate(sx, piece.y);
    ctx.rotate(piece.angle);

    if (piece.type === 'shield') {
      const shR = 32;
      ctx.fillStyle = isP2 ? '#660000' : '#1a0040';
      ctx.strokeStyle = isP2 ? '#dd4400' : '#7733cc';
      ctx.lineWidth = 2;
      ctx.shadowColor = isP2 ? '#dd4400' : '#7733cc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI / 3) - Math.PI / 6;
        i === 0 ? ctx.moveTo(Math.cos(a) * shR, Math.sin(a) * shR * 1.18)
                : ctx.lineTo(Math.cos(a) * shR, Math.sin(a) * shR * 1.18);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isP2 ? '#dd4400' : '#7733cc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-shR * 0.55, 0); ctx.lineTo(shR * 0.55, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -shR * 0.65); ctx.lineTo(0, shR * 0.65); ctx.stroke();
      ctx.fillStyle = isP2 ? '#ff7700' : '#cc66ff';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();

    } else if (piece.type === 'scepter') {
      const staffColor = isP2 ? '#553300' : '#332255';
      const orbFill    = isP2 ? '#ff6622' : '#bb55ff';
      const orbGlow    = isP2 ? '#ff2200' : '#8800ee';
      ctx.strokeStyle = staffColor; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, -44); ctx.stroke();
      ctx.strokeStyle = isP2 ? '#884400' : '#6644aa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-1, 22); ctx.lineTo(-1, -44); ctx.stroke();
      // Crossguard
      ctx.strokeStyle = isP2 ? '#aa4400' : '#7755bb'; ctx.lineWidth = 2.5; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(-10, -31); ctx.lineTo(6, -31); ctx.stroke();
      // Orb glow
      ctx.save();
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = orbGlow; ctx.shadowColor = orbGlow; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0, -44, 11, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = orbFill;
      ctx.beginPath(); ctx.arc(0, -44, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isP2 ? '#1a0000' : '#110022';
      ctx.beginPath(); ctx.arc(-2.8, -46, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 2.8, -46, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isP2 ? '#1a0000' : '#110022'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, -42.5, 3, 0.25, Math.PI - 0.25); ctx.stroke();

    } else if (piece.type === 'crown') {
      const crownColor = isP2 ? '#cc3300' : '#ccaa00';
      ctx.fillStyle = crownColor;
      ctx.fillRect(-22, -4, 44, 12);
      // Prongs
      const prong = (tx, ty, bl, br) => {
        ctx.beginPath(); ctx.moveTo(bl, -4); ctx.lineTo(tx, ty); ctx.lineTo(br, -4); ctx.fill();
      };
      prong(-14, -20, -22, -6);
      prong(  0, -28,  -9,  9);
      prong( 14, -20,   6, 22);
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.arc(-14, 2, 3,   0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isP2 ? '#ff4400' : '#ffdd00';
      ctx.beginPath(); ctx.arc(  0, 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.arc( 14, 2, 3,   0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
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
