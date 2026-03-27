import { Level } from './level.js';
import { Player } from './player.js';
import { WordBox, BonusBox, Monster, BatMonster, SnakeMonster, Janitor, Projectile, Turret, Medkit, Mine, Boss, SpellingBox, BossKey, PowerPickup } from './entities.js';
import { shuffle, generateMisspellings } from './words.js';
import { drawHUD, drawRedOverlay, drawBossHUD } from './ui.js';

const UPGRADES = [
  { id: 'rapidFire', label: 'RAPID FIRE', desc: 'Faster shooting' },
  { id: 'shield', label: 'SHIELD', desc: 'Block one hit' },
  { id: 'speedBoost', label: 'SPEED BOOST', desc: 'Move faster' },
  { id: 'plusHeart', label: '+1 HEART', desc: 'Extra health' },
  { id: 'doubleScore', label: '2x SCORE', desc: 'Double points' }
];

export class Game {
  constructor(canvas, wordList, direction, playerName, audio, leaderboard, speed = 'normal', lang1 = 'A', lang2 = 'B', listName = 'unknown', onGameOver = null, modifier = null, round = 1) {
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
      super_easy: { scroll: 40,  timerFactor: 2.2 },
      slow:       { scroll: 65,  timerFactor: 1.6 },
      normal:     { scroll: 120, timerFactor: 1.0 },
      fast:       { scroll: 190, timerFactor: 0.65 }
    };
    const sp = speedPresets[speed] || speedPresets.normal;
    this.speedFactor = sp.timerFactor;
    this._scrollSpeed = sp.scroll;
    this.superEasy = speed === 'super_easy';

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
    if (this.superEasy) this.level.initSuperEasyRail();
    this.player = new Player(150, canvas.height - 200);
    this.cameraX = 0;
    this.running = true;
    this.paused = false;
    this.gameOver = false;
    this.victory = false;
    this.keys = {};
    this.mouseDown = false;
    this.touchShootHeld = false;
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
    this.powerPickups = [];
    this._powerSpawnDone = false;
    this.powerupText = null;
    this.powerupTimer = 0;
    this.respawnPauseTimer = 0;
    this.boss = null;
    this.spellingBoxes = [];
    this.bossKey = null;
    this.startDelay = 2;
    this.knifeTimer = 0;
    this.knifeUp = false;   // true → upward slash (triggered while airborne)
    this.lastTime = null;
    this.animId = null;
    this._listName = listName;
    this._onGameOver = onGameOver;
    this.modifier = modifier;
    this.round = round;
    this.noPeekTimer = 0;
    // Blackout
    this.blackoutCycle = 0;
    this.blackoutDark  = false;
    this.blackoutFlash = 0;
    // Box Impostors
    this._impostorFlicker = 0;
    // Janitor
    this.janitor = null;
    this.janitorSpawnTimer = 20;
    // Lightning
    this.lightningPhase = 'idle';
    this.lightningTimer = 5 + Math.random() * 4;
    this.lightningWarningPlatforms = [];
    this.lightningStrikeTimer = 0;
    // Wandering Monsters
    this.wanderSpawnTimer = 8 + Math.random() * 4;

    // Pedagogical feedback overlays
    this.correctPairText  = null;  // "✓ hond → dog"
    this.correctPairTimer = 0;
    this.wrongRevealText  = null;  // "✗ hond → dog"
    this.wrongRevealTimer = 0;

    // Apply modifier effects that need to be set up once at game start
    if (this.modifier === 'lowGravity') {
      this.player.gravityMult = 0.78;
      this.player.jumpMult = 1.22;
    }

    // Rounds 3 & 4 — industrial world (reversed direction runs)
    if (round >= 3) {
      this.level.theme = 'industrial';
      this.player.tinted = true;
    }

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
      if (!this.boss) this._spawnBoss();
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

    // No-Peek: reset visibility timer
    this.noPeekTimer = 2.5;

    // Boxes Move: assign oscillating velocity to each word box
    if (this.modifier === 'boxesMove') {
      const spd = 40 + Math.random() * 30;
      for (const box of this.boxes) {
        if (!(box instanceof BonusBox)) {
          box.vx = spd * (Math.random() < 0.5 ? 1 : -1);
          box.bounceLeft  = box.x - 55;
          box.bounceRight = box.x + 55;
        }
      }
    }

    // Double Trouble: correct box requires 2 hits; all boxes show 2 pips so
    // the correct one isn't identifiable by the indicator alone
    if (this.modifier === 'doubleTrouble') {
      for (const box of this.boxes) {
        box.hitsNeeded = 2;
        box.hitsRemaining = 2;  // wrong boxes still die in 1 hit — see collision code
      }
    }

    // Box Impostors: one wrong box steals the correct answer's text
    if (this.modifier === 'boxImpostors') {
      for (const box of this.boxes) { box.isImpostor = false; box.isReal = false; }
      const correct = this.boxes.find(b => b.isCorrect);
      const wrongs  = this.boxes.filter(b => !b.isCorrect && !(b instanceof BonusBox));
      if (correct && wrongs.length > 0) {
        const imp = wrongs[Math.floor(Math.random() * wrongs.length)];
        imp.isImpostor = true;
        imp.word       = correct.word;
        correct.isReal = true;
      }
    }

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

    // Point 11 + Point 3: correct pair flash + TTS
    const _cw = this.getCurrentWord();
    if (_cw) {
      const prompt = this.direction === 'a-to-b' ? _cw.a : _cw.b;
      const answer = this.direction === 'a-to-b' ? _cw.b : _cw.a;
      this.correctPairText  = `✓ ${prompt} → ${answer}`;
      this.correctPairTimer = 1.0;

      const answerLang = this.direction === 'a-to-b' ? this.lang2 : this.lang1;
      const LANG_CODES = { Dutch:'nl-NL', English:'en-GB', Deutsch:'de-DE', French:'fr-FR', Frysk:'fy' };
      this.audio.speak(answer, LANG_CODES[answerLang] || 'en-GB');
    }

    // Power pickup spawn (rounds 2–4 only, once per round)
    if (!this._powerSpawnDone && this.round >= 2) {
      const ideal = this.round === 2 ? 15 : this.round === 3 ? 10 : 12;
      const threshold = Math.min(ideal, Math.max(1, this.totalWords - 1));
      if (this.correctCount >= threshold) {
        const type = this.round === 2 ? 'diamond'
                   : this.round === 3 ? 'flask'
                   : Math.random() < 0.5 ? 'diamond' : 'flask';
        this._powerSpawnDone = true;  // set before spawn to prevent re-entry
        this._spawnPowerPickup(type);
      }
    }

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

    // Check if all words done — spawn boss instead of immediate victory
    if (this.currentWordIndex >= this.words.length && this.repeatQueue.length === 0) {
      if (!this.boss) setTimeout(() => this._spawnBoss(), 500);
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

    // Point 1: reveal correct answer after wrong hit
    const _ww = this.getCurrentWord();
    if (_ww) {
      const prompt = this.direction === 'a-to-b' ? _ww.a : _ww.b;
      const answer = this.direction === 'a-to-b' ? _ww.b : _ww.a;
      this.wrongRevealText  = `✗ ${prompt} → ${answer}`;
      this.wrongRevealTimer = 1.8;
    }

    // RE-01: accumulate red tint per wrong answer
    this.redIntensity = Math.min(1, this.redIntensity + 0.2);

    // Spawn a random monster type from the wrong box
    const mx = box.x + box.width / 2 - 20;
    const roll = Math.random();
    let monster;
    if (roll < 0.34) {
      monster = new Monster(mx, box.y - 60, box);
    } else if (roll < 0.67) {
      monster = new BatMonster(mx, box.y - 40);
    } else {
      // Find the platform the box sits on so the snake can patrol it
      const platY = box.y + box.height + 5;
      const spawnPlat = this.level.getPlatformsInView().find(
        p => !p.isGround && Math.abs(p.y - platY) < 20
          && p.x <= box.x + box.width && p.x + p.width >= box.x);
      monster = new SnakeMonster(mx, box.y + box.height - 10, spawnPlat || null);
    }
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
    const chosen = UPGRADES[Math.floor(Math.random() * UPGRADES.length)];

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

  _spawnBoss() {
    if (this.boss || this.gameOver || this.victory) return;
    // Lock scroll for the entire boss fight
    this.respawnPauseTimer = Infinity;
    this.timer = Infinity;
    // Clear normal gameplay entities
    this.boxes = [];
    this.monsters = [];
    // Spawn boss arena platforms
    this.level.spawnBossArena(this.cameraX);
    // Position boss above center of arena — anchored to tier 4 so it stays
    // reachable on large screens (fixed pixel offset rather than % of height)
    const bossX = this.cameraX + this.canvas.width * 0.55;
    const bossY = Math.max(20, this.level.tiers[4] - 180);
    this.boss = new Boss(bossX, bossY);
    this.audio.playBossAppear();
    // Start first round after spawn animation
    setTimeout(() => this._startBossRound(), 1700);
  }

  _startBossRound() {
    if (!this.boss || !this.boss.alive) return;
    this.spellingBoxes = [];
    this.boss.immune = true;
    this.boss.vulnerableTimer = 0;
    this.boss.roundCount++;
    // Pick a random word from the full list
    const word = this.words[Math.floor(Math.random() * this.words.length)];
    this.boss.headWord = this.direction === 'a-to-b' ? word.a : word.b;
    const answer = this.direction === 'a-to-b' ? word.b : word.a;
    const misspellings = generateMisspellings(answer, 3, { prioritizeVoiced: true });
    const items = shuffle([
      { word: answer, isCorrect: true },
      ...misspellings.map(m => ({ word: m, isCorrect: false }))
    ]);
    this.spellingBoxes = items.map(it => new SpellingBox(0, 0, it.word, it.isCorrect));
    // Place directly on boss-arena platforms (sorted left to right)
    const arenaPlats = this.level.getAllPlatforms()
      .filter(p => p.isBossArena)
      .sort((a, b) => a.x - b.x);
    for (let i = 0; i < this.spellingBoxes.length && i < arenaPlats.length; i++) {
      const p = arenaPlats[i];
      const box = this.spellingBoxes[i];
      box.x = p.x + (p.width - box.width) / 2;
      box.y = p.y - box.height - 5;
    }

    // Spawn 2 medkits on the navigation (non-spelling) platforms so they
    // don't obscure the spelling boxes
    const navPlats = this.level.getAllPlatforms()
      .filter(p => p.decorated && !p.isBossArena && !p.isSuperEasyRail)
      .sort((a, b) => a.x - b.x);
    const mkPlats = navPlats.slice(0, 2);
    for (const p of mkPlats) {
      this.medkits.push(new Medkit(p.x + p.width / 2 - 14 + (Math.random() - 0.5) * (p.width * 0.5), p.y - 36));
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
    if (this.victory) return;
    this.boss = null;
    this.spellingBoxes = [];
    this.bossKey = null;
    this.respawnPauseTimer = 0;
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

      // Knife — either Shift key hits any box in melee reach
      if (e.code === 'ShiftRight' || e.code === 'ShiftLeft') {
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
      this._resumeAudio();
    };

    this._mouseupHandler = () => {
      this.mouseDown = false;
    };

    window.addEventListener('keydown', this._keydownHandler);
    window.addEventListener('keyup', this._keyupHandler);
    this.canvas.addEventListener('mousedown', this._mousedownHandler);
    this.canvas.addEventListener('mouseup', this._mouseupHandler);

    // ---- On-screen touch controls ----
    // Use AbortController so all listeners are torn down cleanly in destroy().
    this._touchAbort = new AbortController();
    const { signal } = this._touchAbort;

    // Helper: hold a key while a button is pressed, release on lift/cancel.
    const holdKey = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.keys[key] = true;
        this._resumeAudio();
      }, { signal });
      btn.addEventListener('pointerup',     () => { this.keys[key] = false; }, { signal });
      btn.addEventListener('pointercancel', () => { this.keys[key] = false; }, { signal });
    };

    holdKey('tc-left',  this.modifier === 'mirrorWorld' ? 'ArrowRight' : 'ArrowLeft');
    holdKey('tc-right', this.modifier === 'mirrorWorld' ? 'ArrowLeft'  : 'ArrowRight');
    holdKey('tc-jump',  'ArrowUp');

    const shootBtn = document.getElementById('tc-shoot');
    if (shootBtn) {
      shootBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.touchShootHeld = true;
        this._tryShoot();
        this._resumeAudio();
      }, { signal });
      shootBtn.addEventListener('pointerup',     () => { this.touchShootHeld = false; }, { signal });
      shootBtn.addEventListener('pointercancel', () => { this.touchShootHeld = false; }, { signal });
    }

    const knifeBtn = document.getElementById('tc-knife');
    if (knifeBtn) {
      knifeBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this._tryKnife();
      }, { signal });
    }

    const pauseBtn = document.getElementById('tc-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.paused = !this.paused;
      }, { signal });
    }
  }

  _resumeAudio() {
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
      this.audio.ctx.resume();
    }
  }

  _fireProjectile() {
    const proj = this.player.shoot();
    if (!proj) return;
    // In Mirror World the canvas is flipped but world coords are not.
    // For facingRight=false the gun tip maps to player.x-12 in world, which
    // visually appears 12 px outside the player on the wrong side.
    // Correct it to player.x-4 (just past the visual gun muzzle).
    if (this.modifier === 'mirrorWorld' && !this.player.facingRight) {
      proj.x = this.player.x - 4;
    }
    const piercing = this.player.piercingShotTimer > 0;
    this.projectiles.push(new Projectile(proj.x, proj.y, proj.vx, proj.vy, true, piercing));
    this.audio.playShoot();
  }

  _tryShoot() {
    this._fireProjectile();
  }

  _tryKnife() {
    if (this.gameOver || this.victory || this.paused) return;
    this.knifeTimer = 0.18;
    this.knifeUp = !this.player.onGround;
    this.audio.playShoot();

    const reach = 65;
    const px = this.player.x;
    const pw = this.player.width;
    const pCX = px + pw / 2;
    const pCY = this.player.y + this.player.height / 2;

    const inReach = (cx, cy) => {
      if (this.knifeUp) {
        // Upward slash: wide arc above the player
        return Math.abs(pCX - cx) < reach && cy < pCY && cy > pCY - 110;
      }
      const inFront = this.player.facingRight
        ? cx > px && cx < px + pw + reach
        : cx < px + pw && cx > px - reach;
      return inFront && Math.abs(pCY - cy) < 72;
    };

    // Boxes
    for (const box of this.boxes) {
      if (!box.alive || box.state !== 'normal') continue;
      if (inReach(box.x + box.width / 2, box.y + box.height / 2)) {
        if (box instanceof BonusBox) {
          box.hit(true);
          this._applyBonusReward(box.reward);
        } else if (box.isCorrect) {
          // Double Trouble: first knife hit only chips the box
          if (box.hitsNeeded && box.hitsRemaining > 1) {
            box.hitsRemaining--;
            box.hit(false);
          } else {
            box.hit(true);
            this.onCorrectHit();
          }
        } else {
          box.hit(false);
          this.onWrongHit(box);
        }
        return;
      }
    }

    // SpellingBoxes (boss fight)
    for (const sb of this.spellingBoxes) {
      if (!sb.alive || sb.state !== 'normal') continue;
      if (inReach(sb.x + sb.width / 2, sb.y + sb.height / 2)) {
        if (sb.isCorrect) {
          sb.hit(true);
          this.boss.immune = false;
          this.boss.vulnerableTimer = 10;
          for (const other of this.spellingBoxes) {
            if (!other.isCorrect && other.alive) { other.state = 'destroyed'; other.alive = false; }
          }
          this.audio.playCorrect();
          this.audio.playBossVulnerable();
        } else {
          sb.hit(false);
          this.audio.playWrong();
          if (this.player.takeDamage()) {
            this.audio.playPlayerHit();
            this.redIntensity = 0.8;
            if (this.player.health <= 0) { this._triggerGameOver(); return; }
          }
        }
        return;
      }
    }

    // Boss body (only when vulnerable)
    if (this.boss && !this.boss.immune && this.boss.alive) {
      if (inReach(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2)) {
        if (this.boss.takeDamage()) {
          this.spellingBoxes = [];
          this.audio.playBossDeath();
        }
        return;
      }
    }

    // Turrets — one knife hit destroys them
    for (const t of this.turrets) {
      if (!t.alive) continue;
      if (inReach(t.x + t.width / 2, t.y + t.height / 2)) {
        if (t.takeDamage()) this.score += 75;
        return;
      }
    }

    // Monsters — one knife hit does 1 damage (same as a bullet)
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (inReach(m.x + m.width / 2, m.y + m.height / 2)) {
        m.takeDamage();
        if (!m.alive) this.score += 50;
        return;
      }
    }

    // Janitor — knife hit stuns
    if (this.modifier === 'janitor' && this.janitor && this.janitor.alive) {
      if (inReach(this.janitor.x + 24, this.janitor.y + 40)) {
        this.janitor.stun();
        return;
      }
    }
  }

  _respawnPlayer() {
    // Find the nearest on-screen platform to land on
    const targetX = this.cameraX + this.canvas.width * 0.25;
    const candidates = this.level.getAllPlatforms()
      .filter(p => !p.isGround
               && !p.isSuperEasyRail
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
    this.player.tumbling = false;
    this.player.tumbleAngle = 0;
    // Reset word timer so player has a full attempt after respawn
    this.timerMax = this.getTimerMax();
    this.timer = this.timerMax;
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
        this.turrets.push(new Turret(p.x + p.width - 28, p.y - 36));
      } else if (r < 0.22) {
        // Medkit hovering above platform centre
        this.medkits.push(new Medkit(p.x + p.width / 2 - 14 + (Math.random() - 0.5) * (p.width * 0.5), p.y - 26));
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
    this._touchAbort?.abort();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  update(dt) {
    if (this.paused || !this.running) return;

    // Cap dt to avoid huge jumps
    dt = Math.min(dt, 0.05);

    // Auto-shoot if mouse or touch shoot button held
    if (this.mouseDown || this.touchShootHeld) {
      this._fireProjectile();
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

    // Start tumbling well before the player disappears off the bottom
    if (this.player.y + this.player.height > this.level.groundY - 80 && !this.player.tumbling) {
      this.player.tumbling = true;
      this.player.tumbleAngle = 0;
    }
    if (this.player.tumbling) {
      // Spin speed increases with fall velocity for a satisfying tumble
      this.player.tumbleAngle += (Math.PI * 2 + Math.abs(this.player.vy) * 0.004) * dt;
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
      if (!this.boss) this.respawnPauseTimer = 2;
    }

    // Update level
    this.level.update(dt, this.cameraX);

    // Update player
    const visiblePlatforms = this.level.getPlatformsInView();
    const effectiveKeys = this.modifier === 'mirrorWorld' ? {
      ...this.keys,
      ArrowLeft:  this.keys['ArrowRight'],
      ArrowRight: this.keys['ArrowLeft'],
      a: this.keys['d'], A: this.keys['D'],
      d: this.keys['a'], D: this.keys['A'],
    } : this.keys;
    const wasOnGround = this.player.onGround;
    this.player.update(dt, visiblePlatforms, effectiveKeys);

    // Boost pad — launch player upward and enable pass-through for ~1.1 s
    if (!wasOnGround && this.player.onGround && this.player.boostTimer <= 0) {
      for (const p of visiblePlatforms) {
        if (!p.isBoostPad) continue;
        if (this.player.x + this.player.width > p.x &&
            this.player.x < p.x + p.width &&
            Math.abs(this.player.y + this.player.height - p.y) < 8) {
          this.player.vy = -1350;
          this.player.onGround = false;
          this.player.jumpsLeft = 0;        // no extra jumps during boost
          this.player.boostTimer = 1.1;
          this.player.tumbling = false;
          this.player.tumbleAngle = 0;
          this.audio.playJump();
          break;
        }
      }
    }

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
      // Boxes Move modifier: oscillate box x position
      if (box.vx !== undefined) {
        box.x += box.vx * dt;
        if (box.x <= box.bounceLeft || box.x >= box.bounceRight) box.vx = -box.vx;
      }
    }

    // No-Peek: count down prompt visibility timer
    if (this.modifier === 'noPeek' && this.noPeekTimer > 0) {
      this.noPeekTimer -= dt;
    }

    // Blackout
    if (this.modifier === 'blackout') {
      this.blackoutCycle = (this.blackoutCycle + dt) % 10;
      this.blackoutFlash = (this.blackoutCycle >= 7.5 && this.blackoutCycle < 8.0)
        ? (8.0 - this.blackoutCycle) / 0.5 : 0;
      this.blackoutDark = this.blackoutCycle >= 8.0;
    }

    // Box Impostors flicker
    if (this.modifier === 'boxImpostors') {
      this._impostorFlicker += dt;
      for (const box of this.boxes) {
        if (box.isReal) box._realFlicker = Math.floor(this._impostorFlicker / 0.15) % 2 === 0;
      }
    }

    // Janitor (gate: !this.boss)
    if (this.modifier === 'janitor' && !this.boss) {
      if (!this.janitor || !this.janitor.alive) {
        this.janitorSpawnTimer -= dt;
        if (this.janitorSpawnTimer <= 0) {
          this.janitorSpawnTimer = 20;
          this.janitor = new Janitor(this.cameraX + 60, this.level.groundY - 80);
          this.janitor.vx = this.level.scrollSpeed + 60;
        }
      }
      if (this.janitor && this.janitor.alive) {
        this.janitor.update(dt);

        // Gravity
        this.janitor.vy += 900 * dt;
        this.janitor.y  += this.janitor.vy * dt;

        // Ground collision
        this.janitor.onGround = false;
        if (this.janitor.y + this.janitor.height >= this.level.groundY) {
          this.janitor.y = this.level.groundY - this.janitor.height;
          this.janitor.vy = 0;
          this.janitor.onGround = true;
        }

        // Platform collision (top surface only, while falling)
        if (!this.janitor.onGround && this.janitor.vy >= 0) {
          for (const p of this.level.getPlatformsInView()) {
            if (p.isGround) continue;
            if (this.janitor.x + this.janitor.width > p.x &&
                this.janitor.x < p.x + p.width &&
                this.janitor.y + this.janitor.height >= p.y &&
                this.janitor.y < p.y) {
              this.janitor.y = p.y - this.janitor.height;
              this.janitor.vy = 0;
              this.janitor.onGround = true;
              break;
            }
          }
        }

        // Jump toward any wrong box that is above and ahead
        if (this.janitor.onGround && this.janitor.stunTimer <= 0) {
          const target = this.boxes.find(b =>
            b.alive && b.state === 'normal' && !b.isCorrect && !(b instanceof BonusBox) &&
            b.x + b.width > this.janitor.x &&
            b.x < this.janitor.x + 300 &&
            b.y + b.height < this.janitor.y - 20
          );
          if (target) {
            this.janitor.vy = -700;
            this.janitor.onGround = false;
          }
        }

        // Cull once off the right edge
        if (this.janitor.x > this.cameraX + this.canvas.width + 100) this.janitor.alive = false;

        // Sweep wrong boxes on contact
        if (this.janitor.stunTimer <= 0) {
          for (const box of this.boxes) {
            if (!box.alive || box.state !== 'normal') continue;
            if (box.isCorrect || box instanceof BonusBox) continue;
            if (this.janitor.x < box.x + box.width &&
                this.janitor.x + this.janitor.width > box.x &&
                this.janitor.y < box.y + box.height &&
                this.janitor.y + this.janitor.height > box.y) {
              box.state = 'destroyed'; box.alive = false;
            }
          }
        }
      }
    }

    // Lightning Crashes
    if (this.modifier === 'lightningCrashes') {
      if (this.lightningPhase === 'idle') {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          const cands = this.level.getPlatformsInView().filter(p => !p.isGround && !p.isBossArena);
          if (cands.length) {
            const shuffle = [...cands].sort(() => Math.random() - 0.5);
            this.lightningWarningPlatforms = shuffle.slice(0, Math.random() < 0.5 ? 2 : 1);
            this.lightningPhase = 'warning';
            this.lightningTimer = 1.5;
          } else { this.lightningTimer = 5 + Math.random() * 4; }
        }
      } else if (this.lightningPhase === 'warning') {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          this.lightningPhase = 'strike';
          this.lightningStrikeTimer = 0.5;
          for (const p of this.lightningWarningPlatforms) {
            const onPlat = this.player.x + this.player.width > p.x &&
                           this.player.x < p.x + p.width &&
                           Math.abs(this.player.y + this.player.height - p.y) < 10;
            if (onPlat) { this.player.vy = -700; this.player.onGround = false; break; }
          }
        }
      } else if (this.lightningPhase === 'strike') {
        this.lightningStrikeTimer -= dt;
        if (this.lightningStrikeTimer <= 0) {
          this.lightningPhase = 'idle';
          this.lightningWarningPlatforms = [];
          this.lightningTimer = 5 + Math.random() * 4;
        }
      }
    }

    // Wandering Monsters (gate: !this.boss)
    if (this.modifier === 'wanderingMonsters' && !this.boss) {
      this.wanderSpawnTimer -= dt;
      if (this.wanderSpawnTimer <= 0) {
        const spawnX = this.cameraX + this.canvas.width + 60;
        const farPlats = this.level.getPlatformsInView()
          .filter(p => !p.isGround && Math.abs(p.y - this.player.y) > 200);
        const spawnY = farPlats.length
          ? farPlats[Math.floor(Math.random() * farPlats.length)].y - 50
          : this.canvas.height - 140;
        const roll = Math.random();
        this.monsters.push(roll < 0.34
          ? new Monster(spawnX, spawnY, null)
          : roll < 0.67
            ? new BatMonster(spawnX, spawnY)
            : new SnakeMonster(spawnX, spawnY));
        this.wanderSpawnTimer = 8 + Math.random() * 4;
      }
    }

    // Update monsters
    const newProjectiles = [];
    const visiblePlats = this.level.getPlatformsInView();
    for (const monster of this.monsters) {
      const result = monster.update(dt, this.player.x + this.player.width / 2, visiblePlats);
      if (result) {
        newProjectiles.push(result);
        this.audio.playMonsterFire();
      }
    }
    this.projectiles.push(...newProjectiles);

    // Boss update
    if (this.boss) {
      const playerCX = this.player.x + this.player.width / 2;
      const playerCY = this.player.y + this.player.height / 2;
      const bossResult = this.boss.update(dt, playerCX, playerCY);
      if (bossResult) {
        if (Array.isArray(bossResult)) {
          this.projectiles.push(...bossResult);
          this.audio.playMonsterFire();
        } else {
          this.projectiles.push(bossResult);
          this.audio.playMonsterFire();
        }
      }
      // Update spelling boxes
      for (const sb of this.spellingBoxes) sb.update(dt);

      // Death animation complete → drop the key
      if (this.boss.dying && this.boss.deathTimer > 7 && !this.bossKey) {
        this.bossKey = new BossKey(
          this.boss.x + this.boss.width / 2 - 11,
          this.boss.y + this.boss.height / 2
        );
      }

      // Vulnerability timeout → start new round (not if already dying)
      if (!this.boss.dying && !this.boss.immune && this.boss.vulnerableTimer <= 0) {
        this.boss.immune = true;
        this._startBossRound();
      }
    }

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

    if (this.correctPairTimer > 0) this.correctPairTimer -= dt;
    if (this.wrongRevealTimer  > 0) this.wrongRevealTimer  -= dt;

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

    // Power-up banner timer
    if (this.powerupTimer > 0) this.powerupTimer -= dt;

    // Update power pickups
    for (const pp of this.powerPickups) pp.update(dt);

    // === Collision detection ===

    // Player projectiles vs world (single pass: boxes → monsters → turrets)
    for (const proj of this.projectiles) {
      if (!proj.fromPlayer || !proj.alive) continue;

      // vs WordBox / BonusBox
      for (const box of this.boxes) {
        if (!box.alive || box.state !== 'normal') continue;
        if (proj.hitTargets && proj.hitTargets.has(box)) continue;
        if (box.checkCollision(proj)) {
          if (!proj.piercing) proj.alive = false;
          else proj.hitTargets.add(box);
          if (box instanceof BonusBox) {
            box.hit(true);
            this._applyBonusReward(box.reward);
          } else if (box.isCorrect) {
            // Double Trouble: first hit only chips the box
            if (box.hitsNeeded && box.hitsRemaining > 1) {
              box.hitsRemaining--;
              box.hit(false);
              if (!proj.piercing) break; else continue;
            }
            box.hit(true);
            this.onCorrectHit();
          } else {
            box.hit(false);
            this.onWrongHit(box);
          }
          if (!proj.piercing) break;
        }
      }
      if (!proj.alive) continue;

      // vs Monster
      for (const monster of this.monsters) {
        if (!monster.alive) continue;
        if (proj.hitTargets && proj.hitTargets.has(monster)) continue;
        if (proj.x < monster.x + monster.width &&
            proj.x + proj.width > monster.x &&
            proj.y < monster.y + monster.height &&
            proj.y + proj.height > monster.y) {
          if (!proj.piercing) proj.alive = false;
          else proj.hitTargets.add(monster);
          monster.takeDamage();
          if (!monster.alive) this.score += 50;
          if (!proj.piercing) break;
        }
      }
      if (!proj.alive) continue;

      // vs Turret
      for (const t of this.turrets) {
        if (!t.alive) continue;
        if (proj.hitTargets && proj.hitTargets.has(t)) continue;
        if (proj.x < t.x + t.width && proj.x + proj.width > t.x &&
            proj.y < t.y + t.height && proj.y + proj.height > t.y) {
          if (!proj.piercing) proj.alive = false;
          else proj.hitTargets.add(t);
          if (t.takeDamage()) this.score += 75;
          if (!proj.piercing) break;
        }
      }
    }

    // Player projectiles vs SpellingBoxes and Boss
    if (this.boss) {
      for (const proj of this.projectiles) {
        if (!proj.fromPlayer || !proj.alive) continue;

        // vs SpellingBox
        for (const sb of this.spellingBoxes) {
          if (!sb.alive || sb.state !== 'normal') continue;
          if (proj.hitTargets && proj.hitTargets.has(sb)) continue;
          if (sb.checkCollision(proj)) {
            if (!proj.piercing) proj.alive = false;
            else proj.hitTargets.add(sb);
            if (sb.isCorrect) {
              sb.hit(true);
              this.boss.immune = false;
              this.boss.vulnerableTimer = 10;
              // Destroy remaining wrong boxes
              for (const other of this.spellingBoxes) {
                if (!other.isCorrect && other.alive) {
                  other.state = 'destroyed';
                  other.alive = false;
                }
              }
              this.audio.playCorrect();
              this.audio.playBossVulnerable();
            } else {
              sb.hit(false);
              this.audio.playWrong();
              if (this.player.takeDamage()) {
                this.audio.playPlayerHit();
                this.redIntensity = 0.8;
                if (this.player.health <= 0) { this._triggerGameOver(); return; }
              }
            }
            if (!proj.piercing) break;
          }
        }
        if (!proj.alive) continue;

        // vs Boss body (only when vulnerable)
        if (!this.boss.immune && this.boss.alive) {
          if (proj.hitTargets && proj.hitTargets.has(this.boss)) continue;
          if (proj.x < this.boss.x + this.boss.width &&
              proj.x + proj.width > this.boss.x &&
              proj.y < this.boss.y + this.boss.height &&
              proj.y + proj.height > this.boss.y) {
            if (!proj.piercing) proj.alive = false;
            else proj.hitTargets.add(this.boss);
            if (this.boss.takeDamage()) {
              this.spellingBoxes = [];
              this.audio.playBossDeath();
            }
          }
        }
      }
    }

    // Boss key update + player pickup
    if (this.bossKey && this.bossKey.alive) {
      this.bossKey.update(dt, this.level.getPlatformsInView());
      if (this.player.x < this.bossKey.x + this.bossKey.width &&
          this.player.x + this.player.width > this.bossKey.x &&
          this.player.y < this.bossKey.y + this.bossKey.height &&
          this.player.y + this.player.height > this.bossKey.y) {
        this.bossKey.alive = false;
        this._triggerVictory();
        return;
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

    // Player vs PowerPickup
    for (const pp of this.powerPickups) {
      if (!pp.alive) continue;
      if (this.player.x < pp.x + pp.width && this.player.x + this.player.width > pp.x &&
          this.player.y < pp.y + pp.height && this.player.y + this.player.height > pp.y) {
        pp.alive = false;
        this._applyPowerPickup(pp.type);
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

    // Player vs SnakeMonster (contact damage — snake is destroyed on impact)
    for (const m of this.monsters) {
      if (!m.alive || !(m instanceof SnakeMonster)) continue;
      if (this.player.x < m.x + m.width  && this.player.x + this.player.width  > m.x &&
          this.player.y < m.y + m.height && this.player.y + this.player.height > m.y) {
        m.alive = false;
        if (this.player.takeDamage()) {
          this.audio.playPlayerHit();
          this.redIntensity = 0.8;
          if (this.player.health <= 0) { this._triggerGameOver(); return; }
        }
      }
    }

    // Enemy projectiles vs Player
    for (const proj of this.projectiles) {
      if (proj.fromPlayer || !proj.alive) continue;
      if (proj.x < this.player.x + this.player.width &&
          proj.x + proj.width > this.player.x &&
          proj.y < this.player.y + this.player.height &&
          proj.y + proj.height > this.player.y) {
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
    this.powerPickups = this.powerPickups.filter(pp => pp.alive);
    this.mines = this.mines.filter(mine => mine.alive);
    this.spellingBoxes = this.spellingBoxes.filter(b => b.alive || b.particles.length > 0);
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

  _spawnPowerPickup(type) {
    const targetX = this.cameraX + this.canvas.width * 0.6;
    const candidates = this.level.getAllPlatforms()
      .filter(p => !p.isGround
               && p.x + p.width > this.cameraX + 80
               && p.x < this.cameraX + this.canvas.width)
      .sort((a, b) =>
        Math.abs(a.x + a.width / 2 - targetX) - Math.abs(b.x + b.width / 2 - targetX));
    if (candidates.length === 0) return;
    const p = candidates[0];
    const offset = (Math.random() - 0.5) * p.width * 0.5;
    const pp = new PowerPickup(p.x + p.width / 2 - 11 + offset, p.y - 44, type);
    this.powerPickups.push(pp);
  }

  _applyPowerPickup(type) {
    if (type === 'diamond') {
      this.player.piercingShotTimer = 8;
      this.powerupText = '◆ PIERCING SHOT';
    } else {
      this.player.powerInvincibleTimer = 6;
      const hasFloat = this.modifier !== 'lowGravity';
      if (hasFloat) this.player.floatTimer = 6;
      this.powerupText = hasFloat ? '⚗ INVINCIBILITY + FLOAT' : '⚗ INVINCIBILITY';
    }
    this.powerupTimer = 3;
    this.audio.playCorrect();
  }

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Mirror World: flip the entire game world horizontally
    if (this.modifier === 'mirrorWorld') {
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }

    // Draw level background and platforms
    this.level.draw(ctx);

    // Draw boxes
    for (const box of this.boxes) {
      box.draw(ctx, this.cameraX);
    }

    // Draw spelling boxes (boss fight)
    for (const sb of this.spellingBoxes) {
      sb.draw(ctx, this.cameraX);
    }

    // Draw boss (behind player)
    if (this.boss) {
      this.boss.draw(ctx, this.cameraX);
    }

    // Draw monsters
    for (const monster of this.monsters) {
      monster.draw(ctx, this.cameraX);
    }

    // Janitor
    if (this.modifier === 'janitor' && this.janitor && this.janitor.alive)
      this.janitor.draw(ctx, this.cameraX);

    // Draw turrets, medkits, mines
    for (const t of this.turrets)    t.draw(ctx, this.cameraX);
    for (const mk of this.medkits)   mk.draw(ctx, this.cameraX);
    for (const pp of this.powerPickups) pp.draw(ctx, this.cameraX);
    for (const mine of this.mines)  mine.draw(ctx, this.cameraX);
    if (this.bossKey)               this.bossKey.draw(ctx, this.cameraX);

    // Draw player
    this.player.draw(ctx, this.cameraX);

    // Lightning warning platform flash (inside mirror transform)
    if (this.modifier === 'lightningCrashes' && this.lightningWarningPlatforms.length &&
        this.lightningPhase === 'warning') {
      const flashOn = Math.floor(this.lightningTimer * 6) % 2 === 0;
      ctx.save();
      ctx.strokeStyle = flashOn ? '#ffffff' : '#ffee00';
      ctx.shadowColor = flashOn ? '#ffffff' : '#ffcc00';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      for (const p of this.lightningWarningPlatforms) {
        ctx.strokeRect(p.x - this.cameraX, p.y, p.width, p.height);
      }
      ctx.restore();
    }

    // Knife slash effect — drawn inside the mirror transform so coords are correct
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
      if (this.knifeUp) {
        // Upward arc: two lines sweeping up from shoulder level
        const cx = px + pw / 2;
        ctx.beginPath(); ctx.moveTo(cx - 22, py + ph * 0.30); ctx.lineTo(cx + 10, py - 44); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx +  2, py + ph * 0.15); ctx.lineTo(cx + 34, py - 34); ctx.stroke();
      } else {
        // Forward sweep
        const x0 = this.player.facingRight ? px + pw * 0.5      : px + pw * 0.5;
        const x1 = this.player.facingRight ? px + pw * 0.5 + 50 : px + pw * 0.5 - 50;
        ctx.beginPath(); ctx.moveTo(x0, py + ph * 0.15); ctx.lineTo(x1, py + ph * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, py + ph * 0.40); ctx.lineTo(x1, py + ph * 0.80); ctx.stroke();
      }
      ctx.restore();
    }

    // Draw projectiles — inside mirror transform so they appear at correct world positions
    for (const proj of this.projectiles) {
      proj.draw(ctx, this.cameraX);
    }

    if (this.modifier === 'mirrorWorld') {
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

    // Respawn pause indicator (not during boss fight)
    if (this.respawnPauseTimer > 0 && !this.boss) {
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

    // Red overlay for damage
    drawRedOverlay(ctx, this.redIntensity);

    // Blackout overlay
    if (this.modifier === 'blackout') {
      if (this.blackoutFlash > 0) {
        ctx.save();
        ctx.globalAlpha = this.blackoutFlash * 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
      if (this.blackoutDark) {
        const px = Math.round(this.player.x - this.cameraX + this.player.width / 2);
        const py = Math.round(this.player.y + this.player.height / 2);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.93)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = 'destination-out';
        const g = ctx.createRadialGradient(px, py, 0, px, py, 120);
        g.addColorStop(0,   'rgba(0,0,0,1)');
        g.addColorStop(0.7, 'rgba(0,0,0,0.85)');
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }
    }

    // Lightning bolt (strike phase)
    if (this.modifier === 'lightningCrashes' &&
        this.lightningPhase === 'strike' && this.lightningWarningPlatforms.length) {
      const alpha = this.lightningStrikeTimer / 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#aaccff';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3;
      for (const p of this.lightningWarningPlatforms) {
        const bx = p.x - this.cameraX + p.width / 2;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx + 18, p.y * 0.3);
        ctx.lineTo(bx - 14, p.y * 0.6);
        ctx.lineTo(bx + 10, p.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Epic VICTORY message during boss death animation (seconds 5–7)
    if (this.boss && this.boss.dying && this.boss.deathTimer > 5) {
      const vt = this.boss.deathTimer - 5;           // 0 → 2
      const alpha = Math.min(1, vt / 0.35);
      const pulse = 1 + Math.sin(vt * 6) * 0.03;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Dark vignette behind text
      ctx.fillStyle = 'rgba(0, 10, 0, 0.55)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.translate(cw / 2, ch / 2);
      ctx.scale(pulse, pulse);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Outer glow
      ctx.shadowColor = '#996600';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#ccaa44';
      ctx.font = 'bold 108px monospace';
      ctx.fillText('VICTORY!', 0, -28);
      // Sub-line
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#aaffcc';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('The Spelling Overlord has been defeated!', 0, 52);
      ctx.restore();
    }

    // HUD
    const hudState = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      score: this.score,
      combo: this.combo,
      multiplier: this.multiplier,
      timer: this.timer,
      timerMax: this.timerMax,
      prompt: this.boss ? '' : this.getPrompt(),
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
      powerInvincible: this.player.powerInvincibleTimer > 0,
      piercingShot: this.player.piercingShotTimer > 0,
      floatActive: this.player.floatTimer > 0,
      powerupText: this.powerupText,
      powerupTimer: this.powerupTimer,
      lang1: this.lang1,
      lang2: this.lang2,
      bossMode: !!this.boss,
      modifier: this.modifier,
      round: this.round,
      promptVisible: this.modifier !== 'noPeek' || this.noPeekTimer > 0,
      correctPairText:  this.correctPairText,
      correctPairTimer: this.correctPairTimer,
      wrongRevealText:  this.wrongRevealText,
      wrongRevealTimer: this.wrongRevealTimer,
    };
    drawHUD(ctx, hudState);
    if (this.boss) {
      drawBossHUD(ctx, this.boss);
    }

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
      ctx.fillText('PAUSED', cw / 2, ch / 2 - 30);

      // Controls reminder
      const controls = [
        ['← → / A D', 'Move'],
        ['↑ / W / Space', 'Jump  (double jump in air)'],
        ['Z / Ctrl / Click', 'Shoot'],
        ['Shift', 'Knife (melee)'],
        ['P / ESC', 'Pause / Resume'],
      ];
      ctx.font = '14px monospace';
      const colX = cw / 2 - 160;
      let cy2 = ch / 2 + 20;
      for (const [key, action] of controls) {
        ctx.fillStyle = '#a0e080';
        ctx.textAlign = 'right';
        ctx.fillText(key, colX + 140, cy2);
        ctx.fillStyle = '#6a9a6a';
        ctx.textAlign = 'left';
        ctx.fillText(action, colX + 155, cy2);
        cy2 += 22;
      }
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
