import { Sprites } from './sprites.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 48;
    this.facingRight = true;
    this.jumpsLeft = 2;
    this.onGround = false;
    this.health = 4;
    this.maxHealth = 5;
    this.shootCooldown = 0;
    this.shootCooldownMax = 0.25;
    this.rapidFire = false;
    this.speedBoost = false;
    this.shield = false;
    this.shieldTimer = 0;
    this.shieldDuration = 3;
    this.invincibleTimer = 0; // brief invincibility after hit
    this.wasJumping = false;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.tumbling = false;
    this.tumbleAngle = 0;
    this.flipTimer = 0;   // counts down from 0.6 on double-jump
    this.flipAngle = 0;   // 0 → 2π over the flip duration
    this.gravityMult = 1.0;  // modifier hook (e.g. lowGravity sets to 0.45)
    this.jumpMult = 1.0;     // modifier hook (e.g. lowGravity sets to 1.55)
    this.tinted = false;     // true in industrial rounds (3 & 4) — copper tint
    this.boostTimer = 0;     // > 0 → ignore platform collision (boss boost pad)
  }

  update(dt, platforms, keys) {
    const gravity = 1200 * this.gravityMult;
    const maxFall = 800;
    const moveSpeed = this.speedBoost ? 420 : 280;
    const jumpVel = -650 * this.jumpMult;

    // Horizontal movement
    let moving = false;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      this.vx = -moveSpeed;
      this.facingRight = false;
      moving = true;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      this.vx = moveSpeed;
      this.facingRight = true;
      moving = true;
    } else {
      this.vx = 0;
    }

    // Walk animation
    if (moving && this.onGround) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.12) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    // Jump
    const jumpPressed = keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' '];
    if (jumpPressed && !this.wasJumping && this.jumpsLeft > 0) {
      const isDoubleJump = this.jumpsLeft === 1 && !this.onGround;
      this.vy = jumpVel;
      this.jumpsLeft--;
      this.wasJumping = true;
      this._onJump && this._onJump();
      if (isDoubleJump) {
        this.flipTimer = 0.6;
        this.flipAngle = 0;
      }
    }
    if (!jumpPressed) {
      this.wasJumping = false;
    }

    // Apply gravity
    this.vy += gravity * dt;
    if (this.vy > maxFall) this.vy = maxFall;

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Boost-pad pass-through timer
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      // Restore jumps the moment the boost expires so landing feels normal
      if (this.boostTimer <= 0) this.jumpsLeft = 2;
    }

    // Platform collision (skipped while boost-pad timer is active)
    this.onGround = false;
    if (this.boostTimer > 0) return;
    for (const p of platforms) {
      if (this._collidesPlatform(p)) {
        // Landing on top
        if (this.vy > 0) {
          const prevBottom = this.y + this.height - this.vy * dt;
          if (prevBottom <= p.y + 2) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.onGround = true;
            this.jumpsLeft = 2;
          }
        }
        // Hitting from below
        if (this.vy < 0) {
          const prevTop = this.y - this.vy * dt;
          if (prevTop >= p.y + p.height - 2) {
            this.y = p.y + p.height;
            this.vy = 0;
          }
        }
      }
    }

    // Stop tumbling the moment the player lands
    if (this.onGround && this.tumbling) {
      this.tumbling = false;
      this.tumbleAngle = 0;
    }

    // Double-jump flip animation
    if (this.flipTimer > 0) {
      this.flipTimer -= dt;
      this.flipAngle = (1 - Math.max(0, this.flipTimer) / 0.6) * Math.PI * 2;
    }

    // Shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Shield timer
    if (this.shield && this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shield = false;
      }
    }

    // Invincibility timer
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }

  _collidesPlatform(p) {
    return (
      this.x < p.x + p.width &&
      this.x + this.width > p.x &&
      this.y < p.y + p.height &&
      this.y + this.height > p.y
    );
  }

  shoot() {
    const cooldown = this.rapidFire ? this.shootCooldownMax * 0.4 : this.shootCooldownMax;
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = cooldown;
    // Gun tip position
    const gunX = this.facingRight ? this.x + this.width + 4 : this.x - 12;
    const gunY = this.y + this.height * 0.35;
    return {
      x: gunX,
      y: gunY,
      vx: this.facingRight ? 900 : -900,
      vy: 0,
      fromPlayer: true,
      width: 10,
      height: 5
    };
  }

  takeDamage() {
    if (this.shield || this.invincibleTimer > 0) return false;
    this.health--;
    this.invincibleTimer = 1.2;
    return true;
  }

  draw(ctx, cameraX = 0) {
    const x = Math.round(this.x - cameraX);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;

    // Invincibility flicker
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 8) % 2 === 0) {
      return;
    }

    const suffix = this.tinted ? 'Tinted' : '';
    const spriteName = (this.facingRight ? 'playerRight' : 'playerLeft') + suffix;
    const frame = this.onGround ? this.walkFrame : 3;

    // Tumbling fall — spin with distress marker
    if (this.tumbling) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(this.tumbleAngle);
      const tumblingName = (Math.floor(this.tumbleAngle / (Math.PI * 0.5)) % 2 === 0
        ? 'playerRight' : 'playerLeft') + suffix;
      Sprites.draw(ctx, tumblingName, -w / 2, -h / 2, { frame: 3, scale: 2 });
      ctx.rotate(-this.tumbleAngle); // keep text upright
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText('!!', 0, -h / 2 - 4);
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    // Double-jump flip — one clean forward rotation
    if (this.flipTimer > 0) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(this.flipAngle);
      Sprites.draw(ctx, spriteName, -w / 2, -h / 2, { frame: 3, scale: 2 });
      ctx.restore();
    } else {
      Sprites.draw(ctx, spriteName, x, y, { frame, scale: 2 });
    }

    // Shield glow (kept as a visual effect over the sprite)
    if (this.shield) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2 + 8, h / 2 + 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#44aaff';
      ctx.fill();
      ctx.restore();
    }

    // Double-jump indicator (glow under feet when airborne with jumps left)
    if (!this.onGround && this.jumpsLeft > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#aaffaa';
      ctx.fillRect(x + 4, y + h + 2, w - 8, 3);
      ctx.restore();
    }
  }
}
