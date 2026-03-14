import { Level } from './level.js';
import { Player } from './player.js';
import { WordBox, BonusBox, Monster, Projectile, Turret, Medkit, Mine } from './entities.js';
import { shuffle } from './words.js';
import { drawHUD, drawRedOverlay } from './ui.js';

const UPGRADES = [
  { id: 'rapidFire', label: 'RAPID FIRE', desc: 'Faster shooting' },
  { id: 'shield', label: 'SHIELD', desc: 'Block one hit' },
  { id: 'speedBoost', label: 'SPEED BOOST', desc: 'Move faster' },
  { id: 'plusHeart', label: '+1 HEART', desc: 'Extra health' },
  { id: 'doubleScore', label: '2x SCORE', desc: 'Double points' }
];

export class Game {
  constructor(canvas, wordList, direction, playerName, audio, leaderboard, speed = 'normal', lang1 = 'A', lang2 = 'B') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.direction = direction; // 'a-to-b' or 'b-to-a'
    this.lang1 = lang1;
    this.lang2 = lang2;
    this.playerName = playerName;
    this.audio = audio;
    this.leaderboard = leaderboard;

    // Speed setting — affects scroll rate and word timer
    const speedPresets = {
      slow:   { scroll: 65,  timerFactor: 1.6 },
      normal: { scroll: 120, timerFactor: 1.0 },
      fast:   { scroll: 190, timerFactor: 0.65 }
    };
    const sp = speedPresets[speed] || speedPresets.normal;
    this.speedFactor = sp.timerFactor;
    this._scrollSpeed = sp.scroll;

    this.words = shuffle([...wordList]);
    this.currentWordIndex = 0;
    this.totalWords = this.words.length;
    this.score = 0;
    this.combo = 0;
    this.consecutiveWrong = 0;
    this.correctCount = 0;
    this.multiplier = 1;
    this.timerMax = this.getTimerMax();
    this.timer = this.timerMax;
    this.redIntensity = 0;
    this.boxes = [];
    this.monsters = [];
    this.projectiles = [];
    this.level = new Level(canvas);
    this.level.scrollSpeed = sp.scroll;
    this.player = new Player(150, canvas.height - 200);
    this.cameraX = 0;
    this.running = true;
    this.paused = false;
    this.gameOver = false;
    this.victory = false;
    this.keys = {};
    this.mouseDown = false;
    this.repeatQueue = [];
    this.upgradeText = null;
    this.upgradeTimer = 0;
    this.upgradeActive = null;
    this.doubleScore = false;
    this.doubleScoreTimer = 0;
    this.streakNotify = false;
    this.streakNotifyTimer = 0;
    this.turrets = [];
    this.medkits = [];
    this.mines = [];
    this.respawnPauseTimer = 0;
    this.startDelay = 2;
    this.knifeTimer = 0;
    this.lastTime = null;
    this.animId = null;

    // Player sound hooks
    this.player._onJump = () => this.audio.playJump();

    // Setup input
    this._setupInput();

    // Spawn first word
    this.spawnCurrentWord();
  }

  getBoxCount() {
    if (this.currentWordIndex < 9) return 3;
    if (this.currentWordIndex < 17) return 4;
    return 5;
  }

  getTimerMax() {
    const base = this.currentWordIndex < 10 ? 12 : this.currentWordIndex < 18 ? 8 : 6;
    return Math.round(base * (this.speedFactor || 1));
  }

  getCurrentWord() {
    if (this.repeatQueue.length > 0) {
      return this.repeatQueue[0];
    }
    if (this.currentWordIndex >= this.words.length) return null;
    return this.words[this.currentWordIndex];
  }

  getPrompt() {
    const w = this.getCurrentWord();
    if (!w) return '';
    return this.direction === 'a-to-b' ? w.a : w.b;
  }

  getAnswer() {
    const w = this.getCurrentWord();
    if (!w) return '';
    return this.direction === 'a-to-b' ? w.b : w.a;
  }

  spawnCurrentWord() {
    if (this.gameOver || this.victory) return;
    // Clear existing boxes
    this.boxes = [];

    const currentWord = this.getCurrentWord();
    if (!currentWord) {
      // Game complete!
      this._triggerVictory();
      return;
    }

    this.timerMax = this.getTimerMax();
    this.timer = this.timerMax;

    const n = this.getBoxCount();
    const answer = this.getAnswer();

    // Get distractors from word list (not the current word)
    const distractors = this.words
      .filter(w => {
        const val = this.direction === 'a-to-b' ? w.b : w.a;
        return val !== answer;
      })
      .map(w => this.direction === 'a-to-b' ? w.b : w.a);

    const shuffledDistractors = shuffle(distractors).slice(0, n - 1);

    // Create boxes
    const correctIdx = Math.floor(Math.random() * n);
    const allWords = [];
    let distractorCount = 0;
    for (let i = 0; i < n; i++) {
      if (i === correctIdx) {
        allWords.push({ word: answer, isCorrect: true });
      } else {
        allWords.push({ word: shuffledDistractors[distractorCount++] || answer + '?', isCorrect: false });
      }
    }

    // Create WordBox instances at placeholder positions
    for (const item of allWords) {
      const box = new WordBox(0, 0, item.word, item.isCorrect);
      this.boxes.push(box);
    }

    // Place on platforms ahead of camera
    const placeFrom = this.cameraX + this.canvas.width * 0.5;
    this.level.placeWordBoxes(this.boxes, placeFrom);

    // Occasionally spawn a bonus box
    if (this.correctCount > 0 && this.correctCount % 7 === 0) {
      this._spawnBonusBox(placeFrom + this.canvas.width * 0.8);
    }
  }

  _spawnBonusBox(nearX) {
    const rewards = ['rapidFire', 'shield', 'speedBoost', 'plusHeart'];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const bonus = new BonusBox(nearX, this.canvas.height - 350, reward);
    this.boxes.push(bonus);
  }

  onCorrectHit() {
    this.combo++;
    this.consecutiveWrong = 0;
    // RE-01: correct answer reduces red tint
    this.redIntensity = Math.max(0, this.redIntensity - 0.3);

    // Multiplier
    if (this.combo >= 5) this.multiplier = 4;
    else if (this.combo >= 3) this.multiplier = 3;
    else if (this.combo >= 2) this.multiplier = 2;
    else this.multiplier = 1;

    // Score
    const baseScore = 100;
    const timeBonus = Math.floor(Math.min(this.timer, this.timerMax) * 5);
    const earned = (baseScore + timeBonus) * this.multiplier * (this.doubleScore ? 2 : 1);
    this.score += earned;

    this.correctCount++;
    this.audio.playCorrect();

    // Streak milestones
    if (this.combo === 10 || this.combo === 20 || this.combo === 30) {
      this.audio.playStreak(this.combo);
      this.streakNotify = true;
      this.streakNotifyTimer = 1.5;
    }

    // HT-02/03: raise max hearts at 6 and 12 correct answers
    if (this.correctCount === 6)  this.player.maxHealth = 6;
    if (this.correctCount === 12) this.player.maxHealth = 7;

    // WB-07: +0.5 heart on every correct answer, capped at maxHealth
    if (this.player.health < this.player.maxHealth) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.5);
    }

    // Upgrade at milestones 5, 10, 15, 20
    if (this.correctCount % 5 === 0) {
      this._offerUpgrade();
    }

    // Remove wrong boxes immediately
    for (const box of this.boxes) {
      if (!box.isCorrect && box.state === 'normal' && !(box instanceof BonusBox)) {
        box.state = 'destroyed';
        box.alive = false;
      }
    }

    // Advance to next word
    if (this.repeatQueue.length > 0) {
      this.repeatQueue.shift();
    } else {
      this.currentWordIndex++;
    }

    // Prevent timer from firing during the spawn delay
    this.timer = Infinity;

    // Check if all words done
    if (this.currentWordIndex >= this.words.length && this.repeatQueue.length === 0) {
      setTimeout(() => this._triggerVictory(), 500);
      return;
    }

    // Spawn next word after brief delay
    setTimeout(() => this.spawnCurrentWord(), 600);
  }

  onWrongHit(box) {
    this.combo = 0;
    this.multiplier = 1;
    this.consecutiveWrong++;
    this.audio.playWrong();

    // RE-01: accumulate red tint per wrong answer
    this.redIntensity = Math.min(1, this.redIntensity + 0.2);

    // Spawn monster from the wrong box
    const monster = new Monster(
      box.x + box.width / 2 - 20,
      box.y - 60,
      box
    );
    this.monsters.push(monster);

    // Add to repeat queue after 2 consecutive wrongs
    if (this.consecutiveWrong >= 2) {
      const current = this.getCurrentWord();
      if (current && !this.repeatQueue.find(w => w.a === current.a)) {
        this.repeatQueue.push(current);
      }
    }

    // DP-06: 5 consecutive wrong answers = instant game over regardless of hearts
    if (this.consecutiveWrong >= 5) {
      this._triggerGameOver();
    }
  }

  _offerUpgrade() {
    // Pick 1 upgrade randomly
    const pool = [...UPGRADES];
    const chosen = shuffle(pool)[0];

    this.upgradeText = chosen.label;
    this.upgradeTimer = 3;

    if (chosen.id === 'rapidFire') {
      this.player.rapidFire = true;
      setTimeout(() => { this.player.rapidFire = false; }, 15000);
    } else if (chosen.id === 'shield') {
      this.player.shield = true;
      this.player.shieldTimer = 15;
    } else if (chosen.id === 'speedBoost') {
      this.player.speedBoost = true;
      setTimeout(() => { this.player.speedBoost = false; }, 12000);
    } else if (chosen.id === 'plusHeart') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
    } else if (chosen.id === 'doubleScore') {
      this.doubleScore = true;
      this.doubleScoreTimer = 20;
    }
  }

  _triggerGameOver() {
    this.gameOver = true;
    this.running = false;
    this.audio.playGameOver();
    // Submit score
    if (this.leaderboard) {
      this.leaderboard.submitScore(
        this._listName || 'unknown',
        this.direction,
        this.playerName,
        this.score
      );
    }
    setTimeout(() => {
      this._onGameOver && this._onGameOver(this.score, false);
    }, 1500);
  }

  _triggerVictory() {
    this.victory = true;
    this.running = false;
    this.audio.playVictory();
    // Submit score
    if (this.leaderboard) {
      this.leaderboard.submitScore(
        this._listName || 'unknown',
        this.direction,
        this.playerName,
        this.score
      );
    }
    setTimeout(() => {
      this._onGameOver && this._onGameOver(this.score, true);
    }, 2000);
  }

  _setupInput() {
    this._keydownHandler = (e) => {
      this.keys[e.key] = true;

      // Prevent page scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Shoot
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Control') {
        this._tryShoot();
      }

      // Knife — Right Shift hits any box in melee reach
      if (e.code === 'ShiftRight') {
        this._tryKnife();
      }

      // Pause
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.paused = !this.paused;
      }
    };

    this._keyupHandler = (e) => {
      this.keys[e.key] = false;
    };

    this._mousedownHandler = (e) => {
      this.mouseDown = true;
      this._tryShoot();
      // Resume AudioContext on user gesture
      if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
        this.audio.ctx.resume();
      }
    };

    this._mouseupHandler = () => {
      this.mouseDown = false;
    };

    window.addEventListener('keydown', this._keydownHandler);
    window.addEventListener('keyup', this._keyupHandler);
    this.canvas.addEventListener('mousedown', this._mousedownHandler);
    this.canvas.addEventListener('mouseup', this._mouseupHandler);
  }

  _tryShoot() {
    const proj = this.player.shoot();
    if (proj) {
      this.projectiles.push(new Projectile(proj.x, proj.y, proj.vx, proj.vy, true));
      this.audio.playShoot();
    }
  }

  _tryKnife() {
    if (this.gameOver || this.victory || this.paused) return;
    this.knifeTimer = 0.18; // show slash for 180 ms
    const reach = 80;
    const pCY = this.player.y + this.player.height / 2;
    for (const box of this.boxes) {
      if (!box.alive || box.state !== 'normal') continue;
      const bCX = box.x + box.width / 2;
      const bCY = box.y + box.height / 2;
      const inFront = this.player.facingRight
        ? bCX > this.player.x && bCX < this.player.x + this.player.width + reach
        : bCX < this.player.x + this.player.width && bCX > this.player.x - reach;
      if (inFront && Math.abs(pCY - bCY) < 72) {
        this.audio.playShoot();
        if (box instanceof BonusBox) {
          box.hit(true);
          this._applyBonusReward(box.reward);
        } else if (box.isCorrect) {
          box.hit(true);
          this.onCorrectHit();
        } else {
          box.hit(false);
          this.onWrongHit(box);
        }
        break;
      }
    }
  }

  _respawnPlayer() {
    // Find the nearest on-screen platform to land on
    const targetX = this.cameraX + this.canvas.width * 0.25;
    const candidates = this.level.getAllPlatforms()
      .filter(p => !p.isGround
               && p.x + p.width > this.cameraX + 40
               && p.x < this.cameraX + this.canvas.width * 0.55)
      .sort((a, b) =>
        Math.abs(a.x + a.width / 2 - targetX) - Math.abs(b.x + b.width / 2 - targetX));

    if (candidates.length > 0) {
      const p = candidates[0];
      this.player.x = p.x + (p.width - this.player.width) / 2;
      this.player.y = p.y - this.player.height;
    } else {
      // Fallback: just above ground level
      this.player.x = this.cameraX + this.canvas.width * 0.2;
      this.player.y = this.level.groundY - this.player.height - 4;
    }
    this.player.vy = 0;
    this.player.vx = 0;
    // Brief invincibility so player isn't immediately hit again
    this.player.invincibleTimer = Math.max(this.player.invincibleTimer, 1.5);
  }

  _decoratePlatforms() {
    const ahead = this.cameraX + this.canvas.width;
    const limit = ahead + 1400;
    for (const p of this.level.getAllPlatforms()) {
      if (p.decorated || p.isGround) continue;
      if (p.x + p.width < ahead) { p.decorated = true; continue; } // already behind view
      if (p.x > limit) continue; // too far ahead to decorate yet
      p.decorated = true;
      const r = Math.random();
      if (r < 0.12) {
        // Turret on the right edge of the platform
        this.turrets.push(new Turret(p.x + p.width - 28, p.y - 18));
      } else if (r < 0.22) {
        // Medkit hovering above platform centre
        this.medkits.push(new Medkit(p.x + p.width / 2 - 9, p.y - 26));
      } else if (r < 0.34) {
        // Mine sitting flush on platform surface
        const mx = p.x + 12 + Math.random() * Math.max(0, p.width - 28);
        this.mines.push(new Mine(mx, p.y - 14));
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this._keydownHandler);
    window.removeEventListener('keyup', this._keyupHandler);
    this.canvas.removeEventListener('mousedown', this._mousedownHandler);
    this.canvas.removeEventListener('mouseup', this._mouseupHandler);
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  update(dt) {
    if (this.paused || !this.running) return;

    // Cap dt to avoid huge jumps
    dt = Math.min(dt, 0.05);

    // Auto-shoot if mouse held
    if (this.mouseDown) {
      const proj = this.player.shoot();
      if (proj) {
        this.projectiles.push(new Projectile(proj.x, proj.y, proj.vx, proj.vy, true));
        this.audio.playShoot();
      }
    }

    // Camera scrolls automatically — paused at start and briefly after a respawn
    if (this.startDelay > 0) {
      this.startDelay -= dt;
    } else if (this.respawnPauseTimer > 0) {
      this.respawnPauseTimer -= dt;
    } else {
      this.cameraX += this.level.scrollSpeed * dt;
      // Player can also push camera forward by moving right
      const playerScreenX = this.player.x - this.cameraX;
      if (playerScreenX > this.canvas.width * 0.65) {
        this.cameraX = this.player.x - this.canvas.width * 0.65;
      }
    }

    // Player can't go behind camera
    if (this.player.x < this.cameraX + 20) {
      this.player.x = this.cameraX + 20;
      this.player.vx = Math.max(0, this.player.vx);
    }

    // Player fell off the bottom of the level
    if (this.player.y > this.canvas.height + 100) {
      if (this.player.takeDamage()) {
        this.audio.playPlayerHit();
        this.redIntensity = 1;
        if (this.player.health <= 0) {
          this._triggerGameOver();
          return;
        }
      }
      // Place player on a real platform and freeze scroll for 2s
      this._respawnPlayer();
      this.respawnPauseTimer = 2;
    }

    // Update level
    this.level.update(dt, this.cameraX);

    // Update player
    const visiblePlatforms = this.level.getPlatformsInView();
    this.player.update(dt, visiblePlatforms, this.keys);

    // Difficulty scaling and platform decoration
    const newDiff = this.correctCount >= 10 ? 2 : this.correctCount >= 5 ? 1 : 0;
    if (newDiff !== this.level.difficulty) this.level.difficulty = newDiff;
    if (this.correctCount >= 5) this._decoratePlatforms();

    // Carry player along with horizontally moving platforms
    if (this.player.onGround) {
      for (const p of visiblePlatforms) {
        if (p.moveVx === undefined) continue;
        if (this.player.x + this.player.width > p.x &&
            this.player.x < p.x + p.width &&
            Math.abs(this.player.y + this.player.height - p.y) < 6) {
          this.player.x += p.moveVx * dt;
          break;
        }
      }
    }

    // Update turrets
    for (const t of this.turrets) {
      const proj = t.update(dt,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2);
      if (proj) {
        this.projectiles.push(proj);
        this.audio.playMonsterFire();
      }
    }

    // Update medkits and mines
    for (const mk of this.medkits) mk.update(dt);
    for (const mine of this.mines) mine.update(dt);

    // Timer countdown
    this.timer -= dt;
    if (this.timer <= 0) {
      // Prevent re-triggering every frame during the spawn delay
      this.timer = Infinity;
      // TM-04: timer expiry costs a heart directly
      this.redIntensity = Math.min(1, this.redIntensity + 0.2); // RE-01
      this.combo = 0;
      this.multiplier = 1;
      this.audio.playWrong();

      if (this.player.takeDamage()) {
        this.audio.playPlayerHit();
        this.redIntensity = 1;
        if (this.player.health <= 0) {
          this._triggerGameOver();
          return;
        }
      }

      // Advance PAST the current word first, then queue it for a later retry
      const current = this.getCurrentWord();
      if (current) {
        if (this.repeatQueue.length > 0 && this.repeatQueue[0] === current) {
          // Word came from the repeat queue — remove it from the front
          this.repeatQueue.shift();
        } else {
          // Word came from the main list — move the index forward
          this.currentWordIndex++;
        }
        // Schedule a retry at the end of the queue (dedup)
        if (!this.repeatQueue.some(w => w.a === current.a)) {
          this.repeatQueue.push(current);
        }
      }

      setTimeout(() => this.spawnCurrentWord(), 400);
    }

    // Update projectiles
    for (const proj of this.projectiles) {
      proj.update(dt);
    }

    // Update boxes
    for (const box of this.boxes) {
      box.update(dt);
    }

    // Update monsters
    const newProjectiles = [];
    for (const monster of this.monsters) {
      const result = monster.update(dt, this.player.x + this.player.width / 2);
      if (result) {
        newProjectiles.push(result);
        this.audio.playMonsterFire();
      }
    }
    this.projectiles.push(...newProjectiles);

    // Red overlay fade
    if (this.redIntensity > 0) {
      this.redIntensity = Math.max(0, this.redIntensity - dt * 1.5);
    }

    // Upgrade timer
    if (this.upgradeTimer > 0) {
      this.upgradeTimer -= dt;
    }

    // Knife animation timer
    if (this.knifeTimer > 0) {
      this.knifeTimer -= dt;
    }

    // Streak notify timer
    if (this.streakNotifyTimer > 0) {
      this.streakNotifyTimer -= dt;
      if (this.streakNotifyTimer <= 0) {
        this.streakNotify = false;
      }
    }

    // Double score timer
    if (this.doubleScoreTimer > 0) {
      this.doubleScoreTimer -= dt;
      if (this.doubleScoreTimer <= 0) {
        this.doubleScore = false;
      }
    }

    // === Collision detection ===

    // Player projectile vs WordBox
    for (const proj of this.projectiles) {
      if (!proj.fromPlayer || !proj.alive) continue;
      for (const box of this.boxes) {
        if (!box.alive || box.state !== 'normal') continue;
        if (box.checkCollision(proj)) {
          proj.alive = false;

          if (box instanceof BonusBox) {
            // Collect bonus
            box.hit(true);
            this._applyBonusReward(box.reward);
          } else if (box.isCorrect) {
            box.hit(true);
            this.onCorrectHit();
          } else {
            box.hit(false);
            this.onWrongHit(box);
          }
          break;
        }
      }
    }

    // Player projectile vs Monster
    for (const proj of this.projectiles) {
      if (!proj.fromPlayer || !proj.alive) continue;
      for (const monster of this.monsters) {
        if (!monster.alive) continue;
        if (
          proj.x < monster.x + monster.width &&
          proj.x + proj.width > monster.x &&
          proj.y < monster.y + monster.height &&
          proj.y + proj.height > monster.y
        ) {
          proj.alive = false;
          monster.takeDamage();
          if (!monster.alive) {
            this.score += 50;
          }
        }
      }
    }

    // Player projectile vs Turret
    for (const proj of this.projectiles) {
      if (!proj.fromPlayer || !proj.alive) continue;
      for (const t of this.turrets) {
        if (!t.alive) continue;
        if (proj.x < t.x + t.width && proj.x + proj.width > t.x &&
            proj.y < t.y + t.height && proj.y + proj.height > t.y) {
          proj.alive = false;
          if (t.takeDamage()) this.score += 75;
          break;
        }
      }
    }

    // Player vs Medkit
    for (const mk of this.medkits) {
      if (!mk.alive) continue;
      if (this.player.x < mk.x + mk.width && this.player.x + this.player.width > mk.x &&
          this.player.y < mk.y + mk.height && this.player.y + this.player.height > mk.y) {
        mk.alive = false;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.5);
        this.audio.playCorrect();
      }
    }

    // Player vs Mine
    for (const mine of this.mines) {
      if (!mine.alive || mine.triggered) continue;
      if (this.player.x < mine.x + mine.width && this.player.x + this.player.width > mine.x &&
          this.player.y < mine.y + mine.height && this.player.y + this.player.height > mine.y) {
        mine.trigger();
        if (this.player.takeDamage()) {
          this.audio.playPlayerHit();
          this.redIntensity = 0.8;
          if (this.player.health <= 0) { this._triggerGameOver(); return; }
        }
      }
    }

    // Monster / turret projectile vs Player
    for (const proj of this.projectiles) {
      if (proj.fromPlayer || !proj.alive) continue;
      if (
        proj.x < this.player.x + this.player.width &&
        proj.x + proj.width > this.player.x &&
        proj.y < this.player.y + this.player.height &&
        proj.y + proj.height > this.player.y
      ) {
        proj.alive = false;
        if (this.player.takeDamage()) {
          this.audio.playPlayerHit();
          this.redIntensity = 0.8;
          if (this.player.health <= 0) {
            this._triggerGameOver();
            return;
          }
        }
      }
    }

    // Clean up dead entities
    this.projectiles = this.projectiles.filter(p =>
      p.alive && !p.isOffScreen(this.cameraX, this.canvas.width, this.canvas.height)
    );
    // MO-10: cull alive monsters that have drifted far off-screen left
    this.monsters = this.monsters.filter(m =>
      m.alive && m.x + m.width >= this.cameraX - 400
    );
    this.boxes = this.boxes.filter(b => b.alive || b.particles.length > 0);
    this.turrets = this.turrets.filter(t => t.alive);
    this.medkits = this.medkits.filter(mk => mk.alive);
    this.mines = this.mines.filter(mine => mine.alive);
  }

  _applyBonusReward(reward) {
    this.audio.playCorrect();
    if (reward === 'plusHeart') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
      this.upgradeText = '+1 HEART';
    } else if (reward === 'doubleScore') {
      this.doubleScore = true;
      this.doubleScoreTimer = 15;
      this.upgradeText = '2x SCORE (15s)';
    } else if (reward === 'plusTime') {
      this.timer = Math.min(this.timerMax, this.timer + 4);
      this.upgradeText = '+4 SECONDS';
    } else if (reward === 'rapidFire') {
      this.player.rapidFire = true;
      setTimeout(() => { this.player.rapidFire = false; }, 12000);
      this.upgradeText = 'RAPID FIRE';
    } else if (reward === 'shield') {
      this.player.shield = true;
      this.player.shieldTimer = 10;
      this.upgradeText = 'SHIELD ACTIVE';
    }
    this.upgradeTimer = 2.5;
  }

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Draw level background and platforms
    this.level.draw(ctx);

    // Draw boxes
    for (const box of this.boxes) {
      box.draw(ctx, this.cameraX);
    }

    // Draw monsters
    for (const monster of this.monsters) {
      monster.draw(ctx, this.cameraX);
    }

    // Draw turrets, medkits, mines
    for (const t of this.turrets)   t.draw(ctx, this.cameraX);
    for (const mk of this.medkits)  mk.draw(ctx, this.cameraX);
    for (const mine of this.mines)  mine.draw(ctx, this.cameraX);

    // Draw player
    this.player.draw(ctx, this.cameraX);

    // Knife slash effect
    if (this.knifeTimer > 0) {
      const alpha = this.knifeTimer / 0.18;
      const px = Math.round(this.player.x - this.cameraX);
      const py = Math.round(this.player.y);
      const pw = this.player.width;
      const ph = this.player.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffff88';
      ctx.shadowBlur = 10;
      const x0 = this.player.facingRight ? px + pw      : px;
      const x1 = this.player.facingRight ? px + pw + 58 : px - 58;
      ctx.beginPath(); ctx.moveTo(x0, py + ph * 0.15); ctx.lineTo(x1, py + ph * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, py + ph * 0.40); ctx.lineTo(x1, py + ph * 0.80); ctx.stroke();
      ctx.restore();
    }

    // Start delay countdown
    if (this.startDelay > 0) {
      const count = Math.ceil(this.startDelay);
      const fade = Math.min(1, this.startDelay * 2);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#a0e080';
      ctx.font = `bold ${Math.round(80 - (2 - this.startDelay) * 20)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 12;
      ctx.fillText(count, cw / 2, ch / 2 - 20);
      ctx.font = 'bold 20px monospace';
      ctx.fillText('GET READY', cw / 2, ch / 2 + 50);
      ctx.restore();
    }

    // Respawn pause indicator
    if (this.respawnPauseTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.respawnPauseTimer * 1.5);
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText('▶ SCROLL PAUSED — REGROUP', cw / 2, ch / 2 + 40);
      ctx.restore();
    }

    // Draw projectiles
    for (const proj of this.projectiles) {
      proj.draw(ctx, this.cameraX);
    }

    // Red overlay for damage
    drawRedOverlay(ctx, this.redIntensity);

    // HUD
    const hudState = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      score: this.score,
      combo: this.combo,
      multiplier: this.multiplier,
      timer: this.timer,
      timerMax: this.timerMax,
      prompt: this.getPrompt(),
      direction: this.direction,
      correctCount: this.correctCount,
      totalWords: this.totalWords,
      upgradeText: this.upgradeText,
      upgradeTimer: this.upgradeTimer,
      streakNotify: this.streakNotify,
      streakNotifyTimer: this.streakNotifyTimer,
      shield: this.player.shield,
      rapidFire: this.player.rapidFire,
      speedBoost: this.player.speedBoost,
      lang1: this.lang1,
      lang2: this.lang2
    };
    drawHUD(ctx, hudState);

    // Paused overlay
    if (this.paused) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#4a7a4a';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', cw / 2, ch / 2);
      ctx.fillStyle = '#6a9a6a';
      ctx.font = '18px monospace';
      ctx.fillText('P / ESC to resume', cw / 2, ch / 2 + 55);
      ctx.restore();
    }

    // Game over overlay
    if (this.gameOver) {
      this._drawGameOverOverlay(false);
    }

    // Victory overlay
    if (this.victory) {
      this._drawGameOverOverlay(true);
    }
  }

  _drawGameOverOverlay(won) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = won ? '#0a1a0a' : '#1a0a0a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = 1;

    if (won) {
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 60px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00aa00';
      ctx.shadowBlur = 20;
      ctx.fillText('MISSION COMPLETE!', cw / 2, ch / 2 - 40);
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 60px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#aa0000';
      ctx.shadowBlur = 20;
      ctx.fillText('GAME OVER', cw / 2, ch / 2 - 40);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a0e080';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`Score: ${this.score}`, cw / 2, ch / 2 + 30);

    ctx.fillStyle = '#6a8a6a';
    ctx.font = '18px monospace';
    ctx.fillText(`Words correct: ${this.correctCount}/${this.totalWords}`, cw / 2, ch / 2 + 70);

    ctx.restore();
  }

  start() {
    this.lastTime = null;
    const loop = (timestamp) => {
      if (!this.running && !this.gameOver && !this.victory) return;

      if (this.lastTime === null) {
        this.lastTime = timestamp;
      }
      const dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      this.update(dt);
      this.draw();

      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }
}
