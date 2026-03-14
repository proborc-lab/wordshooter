import { loadWordLists } from './words.js';
import { AudioManager } from './audio.js';
import { Game } from './game.js';
import * as LB from './leaderboard.js';

// ---- Canvas setup ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  if (currentGame) {
    // Update level tiers
    currentGame.level.groundY = canvas.height - 60;
    currentGame.level.tiers = [
      canvas.height - 80,
      canvas.height - 200,
      canvas.height - 320
    ];
  }
  if (currentScreen !== 'PLAYING') {
    renderCurrentScreen();
  }
});

// ---- State ----
const SCREENS = {
  TITLE: 'TITLE',
  PLAYER_SELECT: 'PLAYER_SELECT',
  LIST_SELECT: 'LIST_SELECT',
  DIRECTION_SELECT: 'DIRECTION_SELECT',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  LEADERBOARD: 'LEADERBOARD'
};

let currentScreen = SCREENS.TITLE;
let wordLists = null;
let selectedPlayer = '';
let selectedList = '';
let selectedDirection = '';
let selectedSpeed = 'normal';
let currentGame = null;
let lastScore = 0;
let lastVictory = false;
const audio = new AudioManager();

// Overlay element for HTML menus
const overlay = document.getElementById('overlay');

// ---- Screen rendering ----
function renderCurrentScreen() {
  switch (currentScreen) {
    case SCREENS.TITLE:          renderTitle(); break;
    case SCREENS.PLAYER_SELECT:  renderPlayerSelect(); break;
    case SCREENS.LIST_SELECT:    renderListSelect(); break;
    case SCREENS.DIRECTION_SELECT: renderDirectionSelect(); break;
    case SCREENS.GAME_OVER:      renderGameOver(); break;
    case SCREENS.LEADERBOARD:    renderLeaderboard(); break;
    default:                     break;
  }
}

function showOverlay(html) {
  overlay.innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.innerHTML = '';
  overlay.classList.add('hidden');
}

// ---- TITLE SCREEN ----
function renderTitle() {
  hideOverlay();

  // Draw title on canvas with animation
  let titleAnim = 0;
  let titleAnimId = null;

  const drawTitle = (ts) => {
    if (currentScreen !== SCREENS.TITLE) {
      cancelAnimationFrame(titleAnimId);
      return;
    }
    titleAnim += 0.016;
    const cw = canvas.width;
    const ch = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cw, ch);

    // Grid lines
    ctx.strokeStyle = 'rgba(74,122,74,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (let y = 0; y < ch; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }

    // Scanlines
    for (let y = 0; y < ch; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, y, cw, 2);
    }

    // Title glow
    const glowIntensity = 0.7 + Math.sin(titleAnim * 2) * 0.3;
    ctx.save();
    ctx.shadowColor = `rgba(74,170,74,${glowIntensity})`;
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#4a7a4a';
    ctx.font = `bold ${Math.min(96, cw * 0.1)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WORD', cw / 2, ch / 2 - 80);
    ctx.fillStyle = '#cc2222';
    ctx.shadowColor = `rgba(200,50,50,${glowIntensity})`;
    ctx.fillText('SHOOTER', cw / 2, ch / 2);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#6a9a6a';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DUTCH · ENGLISH · VOCABULARY · TRAINING', cw / 2, ch / 2 + 70);

    // Blinking start prompt
    if (Math.floor(titleAnim * 2) % 2 === 0) {
      ctx.fillStyle = '#a0e080';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('[ PRESS ANY KEY OR CLICK TO START ]', cw / 2, ch / 2 + 120);
    }

    // Version
    ctx.fillStyle = '#333';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('v1.0 © Wordshooter', cw - 10, ch - 10);

    // Corner decorations
    ctx.strokeStyle = '#2d4a2d';
    ctx.lineWidth = 2;
    const corner = 30;
    [[0,0],[cw,0],[0,ch],[cw,ch]].forEach(([cx,cy]) => {
      const sx = cx === 0 ? 1 : -1;
      const sy = cy === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + sx * corner, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * corner);
      ctx.stroke();
    });

    titleAnimId = requestAnimationFrame(drawTitle);
  };
  titleAnimId = requestAnimationFrame(drawTitle);

  // Transition on any key/click
  const onAny = () => {
    if (currentScreen !== SCREENS.TITLE) return;
    window.removeEventListener('keydown', onAny);
    canvas.removeEventListener('click', onAny);
    audio.init();
    goToScreen(SCREENS.PLAYER_SELECT);
  };
  window.addEventListener('keydown', onAny);
  canvas.addEventListener('click', onAny);
}

// ---- PLAYER SELECT ----
function renderPlayerSelect() {
  const players = LB.getPlayers();

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-title">WORD</div>
      <div class="menu-subtitle">SHOOTER</div>
      <div class="menu-section-title">Select or Create Player</div>
      <input class="menu-input" id="playerInput" type="text" placeholder="Enter name..." maxlength="20" autocomplete="off" />
      <button class="menu-btn" id="playBtn">▶ PLAY AS NEW</button>
      ${players.length > 0 ? `
        <div class="menu-section-title">Existing Players</div>
        <div class="player-list" id="playerList">
          ${players.map(p => `<button class="menu-btn" data-player="${p}">${p}</button>`).join('')}
        </div>
      ` : ''}
      <button class="menu-btn" id="lbBtn" style="margin-top:20px; font-size:13px">📊 LEADERBOARD</button>
    </div>
  `);

  const input = document.getElementById('playerInput');
  const playBtn = document.getElementById('playBtn');

  input.focus();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      selectPlayer(input.value.trim());
    }
  });

  playBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      selectPlayer(input.value.trim());
    } else {
      input.style.borderColor = '#cc2222';
      input.focus();
    }
  });

  // Click existing player
  const pl = document.getElementById('playerList');
  if (pl) {
    pl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-player]');
      if (btn) {
        selectPlayer(btn.dataset.player);
      }
    });
  }

  document.getElementById('lbBtn').addEventListener('click', () => {
    goToScreen(SCREENS.LEADERBOARD);
  });
}

function selectPlayer(name) {
  selectedPlayer = name;
  LB.addPlayer(name);
  goToScreen(SCREENS.LIST_SELECT);
}

// ---- LIST SELECT ----
function getManifest() {
  // Prefer the manifest loaded from manifest.json
  if (wordLists && wordLists._manifest && wordLists._manifest.length > 0) {
    return wordLists._manifest;
  }
  // Fallback: derive from the keys that loadWordLists actually populated
  return Object.keys(wordLists || {})
    .filter(k => k !== '_manifest' && Array.isArray(wordLists[k]))
    .map(k => ({ id: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));
}

function renderListSelect() {
  const manifest = getManifest();
  const listBtns = manifest.map(e => {
    const langs = (e.lang1 && e.lang2) ? `<span style="font-size:11px;opacity:0.7;margin-left:8px">${e.lang1} ↔ ${e.lang2}</span>` : '';
    return `<button class="menu-btn" data-list="${e.id}">${e.label}${langs}</button>`;
  }).join('');

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-section-title">Soldier: ${selectedPlayer}</div>
      <div class="menu-title" style="font-size:32px;margin-bottom:6px">CHOOSE MISSION</div>
      <div class="menu-subtitle">Select vocabulary list</div>
      ${listBtns}
      <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">← BACK</button>
    </div>
  `);

  overlay.querySelector('.menu-panel').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-list]');
    if (btn) {
      selectedList = btn.dataset.list;
      goToScreen(SCREENS.DIRECTION_SELECT);
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    goToScreen(SCREENS.PLAYER_SELECT);
  });
}

// ---- DIRECTION SELECT ----
function renderDirectionSelect() {
  const manifest = getManifest();
  const entry = manifest.find(e => e.id === selectedList) || { label: selectedList };
  const missionLabel = entry.label;
  showOverlay(`
    <div class="menu-panel">
      <div class="menu-section-title">Mission: ${missionLabel}</div>
      <div class="menu-title" style="font-size:32px;margin-bottom:6px">DIRECTION</div>
      <div class="menu-subtitle">Which way to translate?</div>
      <button class="menu-btn" data-dir="a-to-b">${entry.lang1 || 'A'} → ${entry.lang2 || 'B'}</button>
      <button class="menu-btn" data-dir="b-to-a">${entry.lang2 || 'B'} → ${entry.lang1 || 'A'}</button>
      <div class="menu-section-title" style="margin-top:24px">Game Speed</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
        <button class="menu-btn speed-btn${selectedSpeed==='slow'?' selected':''}" data-speed="slow"  style="flex:1;font-size:13px">🐢 SLOW</button>
        <button class="menu-btn speed-btn${selectedSpeed==='normal'?' selected':''}" data-speed="normal" style="flex:1;font-size:13px">🎯 NORMAL</button>
        <button class="menu-btn speed-btn${selectedSpeed==='fast'?' selected':''}" data-speed="fast"  style="flex:1;font-size:13px">⚡ FAST</button>
      </div>
      <div class="menu-section-title" style="margin-top:24px">Controls</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;font-size:12px;color:#8ab08a;text-align:left;margin:0 8px 16px">
        <span><kbd style="color:#c0e090">← → / A D</kbd> Move</span>
        <span><kbd style="color:#c0e090">Z / Ctrl / Click</kbd> Shoot</span>
        <span><kbd style="color:#c0e090">↑ / W / Space</kbd> Jump</span>
        <span><kbd style="color:#c0e090">Right Shift</kbd> Knife (melee)</span>
        <span><kbd style="color:#c0e090">double jump</kbd> in the air</span>
        <span><kbd style="color:#c0e090">P / ESC</kbd> Pause</span>
      </div>
      <div class="menu-section-title">High Scores</div>
      ${_renderMiniLeaderboard(selectedList)}
      <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">← BACK</button>
    </div>
  `);

  overlay.querySelector('.menu-panel').addEventListener('click', (e) => {
    const speedBtn = e.target.closest('[data-speed]');
    if (speedBtn) {
      selectedSpeed = speedBtn.dataset.speed;
      overlay.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('selected'));
      speedBtn.classList.add('selected');
      return;
    }
    const dirBtn = e.target.closest('[data-dir]');
    if (dirBtn) {
      selectedDirection = dirBtn.dataset.dir;
      startGame();
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    goToScreen(SCREENS.LIST_SELECT);
  });
}

function _renderMiniLeaderboard(listName) {
  const dirs = ['a-to-b', 'b-to-a'];
  const entry = getManifest().find(e => e.id === listName) || {};
  const l1 = entry.lang1 || 'A';
  const l2 = entry.lang2 || 'B';
  let html = '<div style="display:flex;gap:16px;justify-content:center">';
  for (const dir of dirs) {
    const board = LB.getLeaderboard(listName, dir);
    const label = dir === 'a-to-b' ? `${l1}→${l2}` : `${l2}→${l1}`;
    html += `<div style="flex:1">
      <div style="font-size:11px;color:#6a9a6a;margin-bottom:6px">${label}</div>`;
    if (board.length === 0) {
      html += '<div style="color:#333;font-size:12px">No scores yet</div>';
    } else {
      board.slice(0, 3).forEach((entry, i) => {
        const medals = ['🥇','🥈','🥉'];
        html += `<div style="font-size:12px;color:#a0c8a0;margin:2px 0">${medals[i]||''} ${entry.player}: ${entry.score}</div>`;
      });
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ---- START GAME ----
function startGame() {
  hideOverlay();
  currentScreen = SCREENS.PLAYING;

  // Clear canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cleanup previous game
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }

  const wordList = wordLists[selectedList];

  const listMeta = getManifest().find(e => e.id === selectedList) || {};
  currentGame = new Game(canvas, wordList, selectedDirection, selectedPlayer, audio, LB, selectedSpeed, listMeta.lang1 || 'A', listMeta.lang2 || 'B');
  currentGame._listName = selectedList;

  // SM-11: capture reference so a stale callback from a previous game is ignored
  const thisGame = currentGame;
  currentGame._onGameOver = (score, won) => {
    if (currentGame !== thisGame) return;
    lastScore = score;
    lastVictory = won;
    currentGame = null;
    goToScreen(SCREENS.GAME_OVER);
  };

  currentGame.start();
}

// ---- GAME OVER ----
function renderGameOver() {
  const board = LB.getLeaderboard(selectedList, selectedDirection);
  const rank = board.findIndex(e => e.player === selectedPlayer && e.score === lastScore) + 1;
  const rankText = rank > 0 ? `Your rank: #${rank}` : '';

  const listEntry = getManifest().find(e => e.id === selectedList) || { label: selectedList };
  const listLabel = listEntry.label;
  const dirEntry = getManifest().find(e => e.id === selectedList) || {};
  const l1 = dirEntry.lang1 || 'A', l2 = dirEntry.lang2 || 'B';
  const dirLabel = selectedDirection === 'a-to-b' ? `${l1} → ${l2}` : `${l2} → ${l1}`;

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-title" style="color:${lastVictory ? '#44ff44' : '#cc2222'};font-size:36px">
        ${lastVictory ? '★ MISSION COMPLETE' : '✗ GAME OVER'}
      </div>
      <div class="menu-subtitle">${listLabel} · ${dirLabel}</div>
      <div style="color:#a0e080;font-size:28px;margin:16px 0;font-weight:bold">${lastScore} pts</div>
      ${rankText ? `<div style="color:#ffdd00;font-size:14px;margin-bottom:12px">${rankText}</div>` : ''}
      <button class="menu-btn" id="playAgainBtn">▶ PLAY AGAIN</button>
      <button class="menu-btn" id="changeListBtn">🔄 CHANGE MISSION</button>
      <button class="menu-btn" id="lbBtn2">📊 LEADERBOARD</button>
      <button class="menu-btn back-btn" id="titleBtn">⌂ MAIN MENU</button>
    </div>
  `);

  document.getElementById('playAgainBtn').addEventListener('click', () => {
    startGame();
  });

  document.getElementById('changeListBtn').addEventListener('click', () => {
    goToScreen(SCREENS.LIST_SELECT);
  });

  document.getElementById('lbBtn2').addEventListener('click', () => {
    goToScreen(SCREENS.LEADERBOARD);
  });

  document.getElementById('titleBtn').addEventListener('click', () => {
    goToScreen(SCREENS.TITLE);
  });
}

// ---- LEADERBOARD ----
function renderLeaderboard() {
  const manifest = getManifest();
  const lists = manifest.map(e => e.id);
  const dirs = ['a-to-b', 'b-to-a'];
  const listLabels = Object.fromEntries(manifest.map(e => [e.id, e.label]));
  const entryMap   = Object.fromEntries(manifest.map(e => [e.id, e]));

  let tabsHtml = '';
  let contentHtml = '';

  // Create tabs for each list+direction
  let first = true;
  for (const list of lists) {
    const e = entryMap[list] || {};
    const l1 = e.lang1 || 'A';
    const l2 = e.lang2 || 'B';
    const dirLabels = { 'a-to-b': `${l1}→${l2}`, 'b-to-a': `${l2}→${l1}` };
    for (const dir of dirs) {
      const id = `${list}_${dir}`;
      const board = LB.getLeaderboard(list, dir);
      tabsHtml += `<button class="menu-btn ${first ? 'selected' : ''}"
        style="font-size:11px;padding:6px 10px;margin:2px"
        data-tab="${id}">${listLabels[list]} ${dirLabels[dir]}</button>`;

      const rows = board.length === 0
        ? '<tr><td colspan="3" style="color:#333;text-align:center">No scores</td></tr>'
        : board.map((e, i) => `
            <tr>
              <td>${i + 1}.</td>
              <td>${e.player}</td>
              <td style="text-align:right">${e.score}</td>
              <td style="text-align:right;font-size:11px;color:#4a6a4a">${e.date}</td>
            </tr>`).join('');

      contentHtml += `
        <div class="lb-content" id="tab_${id}" style="display:${first ? 'block' : 'none'}">
          <table class="leaderboard-table">
            <thead><tr><th>#</th><th>Player</th><th style="text-align:right">Score</th><th style="text-align:right">Date</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      first = false;
    }
  }

  showOverlay(`
    <div class="menu-panel" style="min-width:500px;max-height:90vh;overflow-y:auto">
      <div class="menu-title" style="font-size:28px">LEADERBOARD</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin:12px 0;justify-content:center">
        ${tabsHtml}
      </div>
      ${contentHtml}
      <button class="menu-btn back-btn" id="backBtn">← BACK</button>
    </div>
  `);

  // Tab switching
  overlay.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('selected'));
      overlay.querySelectorAll('.lb-content').forEach(c => c.style.display = 'none');
      btn.classList.add('selected');
      document.getElementById('tab_' + btn.dataset.tab).style.display = 'block';
    });
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    if (lastScore > 0) {
      goToScreen(SCREENS.GAME_OVER);
    } else {
      goToScreen(SCREENS.PLAYER_SELECT);
    }
  });
}

// ---- Screen transition ----
function goToScreen(screen) {
  currentScreen = screen;
  renderCurrentScreen();
}

// ---- Boot ----
async function boot() {
  // Draw loading screen on canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#4a7a4a';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2);

  try {
    wordLists = await loadWordLists();
  } catch (e) {
    console.error('Failed to load word lists:', e);
    // Fallback already handled in loadWordLists
    wordLists = { holidays: [], police: [], school: [] };
  }

  // Start at title
  goToScreen(SCREENS.TITLE);
}

document.addEventListener('DOMContentLoaded', boot);
