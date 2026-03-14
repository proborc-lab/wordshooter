export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not available:', e);
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _tone(frequency, type, duration, gainValue, startTime, detune = 0) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    if (detune) osc.detune.setValueAtTime(detune, startTime);
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  _noise(duration, gainValue, startTime) {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.start(startTime);
    source.stop(startTime + duration + 0.01);
  }

  playShoot() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    // Short burst: descending noise + tone
    this._tone(880, 'square', 0.05, 0.15, t);
    this._tone(440, 'square', 0.08, 0.1, t + 0.02);
    this._noise(0.06, 0.08, t);
  }

  playCorrect() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    // Ascending happy notes
    this._tone(523, 'sine', 0.12, 0.2, t);
    this._tone(659, 'sine', 0.12, 0.2, t + 0.1);
    this._tone(784, 'sine', 0.18, 0.25, t + 0.2);
  }

  playWrong() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    // Descending buzzer
    this._tone(220, 'sawtooth', 0.15, 0.2, t);
    this._tone(180, 'sawtooth', 0.15, 0.2, t + 0.1);
    this._tone(140, 'sawtooth', 0.2, 0.2, t + 0.2);
  }

  playMonsterFire() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    this._tone(150, 'sawtooth', 0.1, 0.12, t);
    this._noise(0.08, 0.06, t);
  }

  playPlayerHit() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    this._tone(100, 'sawtooth', 0.3, 0.3, t);
    this._noise(0.25, 0.15, t);
  }

  playJump() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playStreak(count) {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;

    if (count >= 30) {
      // Grand fanfare
      const melody = [523, 659, 784, 1047, 784, 1047, 1047];
      const times = [0, 0.12, 0.24, 0.36, 0.5, 0.62, 0.74];
      melody.forEach((freq, i) => {
        this._tone(freq, 'sine', 0.15, 0.3, t + times[i]);
        this._tone(freq * 1.5, 'triangle', 0.08, 0.15, t + times[i]);
      });
    } else if (count >= 20) {
      // Medium fanfare
      const melody = [523, 659, 784, 1047];
      melody.forEach((freq, i) => {
        this._tone(freq, 'sine', 0.15, 0.25, t + i * 0.13);
      });
    } else if (count >= 10) {
      // Small fanfare
      const melody = [523, 659, 784];
      melody.forEach((freq, i) => {
        this._tone(freq, 'sine', 0.15, 0.2, t + i * 0.12);
      });
    }
  }

  playGameOver() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    // Descending dramatic
    const notes = [392, 349, 294, 261, 220, 196, 164, 130];
    notes.forEach((freq, i) => {
      this._tone(freq, 'sawtooth', 0.25, 0.2, t + i * 0.18);
    });
  }

  playVictory() {
    if (!this.ctx || !this.enabled) return;
    this._resume();
    const t = this.ctx.currentTime;
    // Victory fanfare
    const melody = [523, 523, 523, 659, 523, 659, 784];
    const dur =   [0.1,  0.1,  0.1,  0.4,  0.1,  0.1,  0.6];
    let offset = 0;
    melody.forEach((freq, i) => {
      this._tone(freq, 'sine', dur[i], 0.3, t + offset);
      this._tone(freq * 1.26, 'triangle', dur[i], 0.12, t + offset);
      offset += dur[i] + 0.05;
    });
  }
}
