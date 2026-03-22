import { loadWordLists, fetchWordList } from './words.js';
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
    currentGame.level.groundY = canvas.height - 60;
    currentGame.level.tiers = [
      canvas.height - 80,
      canvas.height - 175,
      canvas.height - 275,
      canvas.height - 375,
      canvas.height - 470,
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
// List-select navigation state (persists across back-navigation)
let _lsLangPair = '';
let _lsCategory = '';
let _lsSearch = '';
let currentGame = null;
let lastScore = 0;
let lastVictory = false;
let currentRound = 1;
let activeModifier = null;
let _round2Modifier = null; // remember round-2 modifier to exclude it from round 4
let _originalDirection = ''; // remember round-1 direction for resetting
const audio = new AudioManager();

// Title-screen animation state (module-level so we can cancel/remove on re-entry)
let _titleAnimId = null;
let _titleKeyHandler = null;
let _titleClickHandler = null;

// Overlay element for HTML menus
const overlay = document.getElementById('overlay');

// Touch controls — only visible on touch devices during gameplay
const touchControls = document.getElementById('touch-controls');
const isTouchDevice = () => navigator.maxTouchPoints > 0;

// Android virtual keyboard: when the visual viewport shrinks (keyboard opened),
// scroll the focused input into view so it isn't hidden behind the keyboard.
// Also track zoom level to show/hide the reset-zoom button.
const resetZoomBtn = document.getElementById('reset-zoom-btn');

function _handleViewportChange() {
  // Show reset-zoom button whenever the user has zoomed in
  if (window.visualViewport && resetZoomBtn) {
    resetZoomBtn.classList.toggle('hidden', window.visualViewport.scale <= 1.05);
  }

  // Scroll focused input into view when keyboard opens
  setTimeout(() => {
    const focused = document.activeElement;
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) {
      focused.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, 100);
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', _handleViewportChange);
  window.visualViewport.addEventListener('scroll', _handleViewportChange);
}

if (resetZoomBtn) {
  resetZoomBtn.addEventListener('click', () => {
    // Force-reset zoom by briefly locking maximum-scale=1, then restoring
    const meta = document.querySelector('meta[name="viewport"]');
    const original = meta.content;
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    setTimeout(() => { meta.content = original; }, 100);
    resetZoomBtn.classList.add('hidden');
  });
}

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

  // Cancel any previous title animation loop and input listeners
  if (_titleAnimId !== null) { cancelAnimationFrame(_titleAnimId); _titleAnimId = null; }
  if (_titleKeyHandler)   { window.removeEventListener('keydown', _titleKeyHandler); _titleKeyHandler = null; }
  if (_titleClickHandler) { canvas.removeEventListener('click', _titleClickHandler); _titleClickHandler = null; }

  // Draw title on canvas with animation
  let titleAnim = 0;

  const drawTitle = (ts) => {
    if (currentScreen !== SCREENS.TITLE) {
      _titleAnimId = null;
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
    ctx.fillText('UITGELEERD', cw / 2, ch / 2 - 40);
    ctx.fillStyle = '#cc2222';
    ctx.shadowColor = `rgba(200,50,50,${glowIntensity})`;
    ctx.fillText('?', cw / 2, ch / 2 + 40);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#6a9a6a';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Vocabulary Shooting Drills', cw / 2, ch / 2 + 90);

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
    ctx.fillText('v1.0 © Uitgeleerd?', cw - 10, ch - 10);

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

    _titleAnimId = requestAnimationFrame(drawTitle);
  };
  _titleAnimId = requestAnimationFrame(drawTitle);

  // Transition on any key/click
  const onAny = () => {
    if (currentScreen !== SCREENS.TITLE) return;
    window.removeEventListener('keydown', onAny);
    canvas.removeEventListener('click', onAny);
    _titleKeyHandler = null;
    _titleClickHandler = null;
    audio.init();
    goToScreen(SCREENS.PLAYER_SELECT);
  };
  _titleKeyHandler = onAny;
  _titleClickHandler = onAny;
  window.addEventListener('keydown', onAny);
  canvas.addEventListener('click', onAny);
}

// ---- PLAYER SELECT ----
function renderPlayerSelect() {
  const players = LB.getPlayers();

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-title">UITGELEERD</div>
      <div class="menu-subtitle">?</div>
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

  // Only auto-focus on non-touch devices; on Android programmatic focus
  // before a user gesture suppresses the virtual keyboard.
  if (!isTouchDevice()) input.focus();

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
  return (wordLists && wordLists._flat) ? wordLists._flat : [];
}

// Category icon lookup
function _catIcon(cat) {
  const icons = { Theme: '🎨', Homework: '📚', 'Exam prep': '📝', CEFR: '🏆', Community: '👥' };
  return icons[cat] || '📂';
}

// Bind global search box (re-renders on input; used in lang-pair & category steps)
function _bindGlobalSearch() {
  const input = document.getElementById('listSearch');
  if (!input) return;
  input.value = _lsSearch;
  input.addEventListener('input', e => {
    _lsSearch = e.target.value;
    renderListSelect();
    // Restore focus after DOM rebuild
    const fresh = document.getElementById('listSearch');
    if (fresh) { fresh.focus(); fresh.setSelectionRange(fresh.value.length, fresh.value.length); }
  });
}

// Bind list-pick click on any [data-list] button
function _bindListPick() {
  overlay.querySelector('.menu-panel').addEventListener('click', e => {
    const btn = e.target.closest('[data-list]');
    if (btn) {
      selectedList = btn.dataset.list;
      _lsSearch = '';
      goToScreen(SCREENS.DIRECTION_SELECT);
    }
  });
}

function renderListSelect() {
  const flat    = getManifest();
  const hier    = (wordLists && wordLists._manifest) || {};

  // ── Global search (≥2 chars) ────────────────────────────────────────────
  if (_lsSearch.length >= 2) {
    const q = _lsSearch.toLowerCase();
    const results = flat.filter(e =>
      e.label.toLowerCase().includes(q) ||
      (e.subtitle || '').toLowerCase().includes(q) ||
      (e.group || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.langPair || '').toLowerCase().includes(q)
    );
    const resultBtns = results.length
      ? results.map(e => `
          <button class="menu-btn" data-list="${e.id}">
            ${e.label}
            <span style="font-size:11px;opacity:0.6;margin-left:8px">${e.langPair || ''} · ${e.category || ''}</span>
          </button>`).join('')
      : '<div style="color:#4a6a4a;font-size:13px;padding:16px 0">No results found</div>';

    showOverlay(`
      <div class="menu-panel">
        <div class="menu-section-title">Soldier: ${selectedPlayer}</div>
        <div class="menu-title" style="font-size:32px;margin-bottom:6px">CHOOSE MISSION</div>
        <input class="menu-input" id="listSearch" type="search" placeholder="Search all lists…" autocomplete="off" />
        <div style="color:#6a9a6a;font-size:12px;margin:4px 0 12px;letter-spacing:1px">${results.length} result${results.length !== 1 ? 's' : ''}</div>
        <div style="max-height:52vh;overflow-y:auto">${resultBtns}</div>
        <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">✕ Clear search</button>
      </div>
    `);
    _bindGlobalSearch();
    _bindListPick();
    document.getElementById('backBtn').addEventListener('click', () => { _lsSearch = ''; renderListSelect(); });
    return;
  }

  // ── Step 1: Language pair ────────────────────────────────────────────────
  if (!_lsLangPair) {
    // Build pair buttons from hierarchical manifest (or flat fallback)
    const pairCounts = {};
    for (const e of flat) {
      pairCounts[e.langPair] = (pairCounts[e.langPair] || 0) + 1;
    }
    // Collect pair meta (lang1/lang2) from hierarchical manifest or flat entries
    const pairMeta = {};
    if (!Array.isArray(hier)) {
      for (const [key, p] of Object.entries(hier)) {
        pairMeta[key] = { lang1: p.lang1, lang2: p.lang2 };
      }
    } else {
      for (const e of flat) {
        if (!pairMeta[e.langPair]) pairMeta[e.langPair] = { lang1: e.lang1, lang2: e.lang2 };
      }
    }

    const pairBtns = Object.entries(pairCounts).map(([key, count]) => {
      const m = pairMeta[key] || {};
      return `<button class="menu-btn" data-langpair="${key}">
        ${m.lang1 || key} ↔ ${m.lang2 || ''}
        <span style="font-size:11px;opacity:0.6;margin-left:8px">${count} list${count !== 1 ? 's' : ''}</span>
      </button>`;
    }).join('');

    showOverlay(`
      <div class="menu-panel">
        <div class="menu-section-title">Soldier: ${selectedPlayer}</div>
        <div class="menu-title" style="font-size:32px;margin-bottom:6px">CHOOSE MISSION</div>
        <input class="menu-input" id="listSearch" type="search" placeholder="Search all lists…" autocomplete="off" />
        <div class="menu-section-title">Language pair</div>
        ${pairBtns}
        <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">← BACK</button>
      </div>
    `);
    _bindGlobalSearch();
    overlay.querySelector('.menu-panel').addEventListener('click', e => {
      const btn = e.target.closest('[data-langpair]');
      if (btn) { _lsLangPair = btn.dataset.langpair; renderListSelect(); }
    });
    document.getElementById('backBtn').addEventListener('click', () => goToScreen(SCREENS.PLAYER_SELECT));
    return;
  }

  // Shared: entries for this language pair
  const pairFlat = flat.filter(e => e.langPair === _lsLangPair);
  const lang1 = pairFlat[0]?.lang1 || _lsLangPair;
  const lang2 = pairFlat[0]?.lang2 || '';

  // ── Step 2: Category ─────────────────────────────────────────────────────
  if (!_lsCategory) {
    const catCounts = {};
    for (const e of pairFlat) { catCounts[e.category] = (catCounts[e.category] || 0) + 1; }
    const catBtns = Object.entries(catCounts).map(([cat, count]) =>
      `<button class="menu-btn" data-cat="${cat}">
        ${_catIcon(cat)} ${cat}
        <span style="font-size:11px;opacity:0.6;margin-left:8px">${count} list${count !== 1 ? 's' : ''}</span>
      </button>`
    ).join('');

    showOverlay(`
      <div class="menu-panel">
        <div class="menu-section-title">${lang1} ↔ ${lang2}</div>
        <div class="menu-title" style="font-size:32px;margin-bottom:6px">CHOOSE MISSION</div>
        <input class="menu-input" id="listSearch" type="search" placeholder="Search all lists…" autocomplete="off" />
        <div class="menu-section-title">Category</div>
        ${catBtns}
        <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">← Language</button>
      </div>
    `);
    _bindGlobalSearch();
    overlay.querySelector('.menu-panel').addEventListener('click', e => {
      const btn = e.target.closest('[data-cat]');
      if (btn) { _lsCategory = btn.dataset.cat; renderListSelect(); }
    });
    document.getElementById('backBtn').addEventListener('click', () => { _lsLangPair = ''; renderListSelect(); });
    return;
  }

  // ── Step 3: List items (with inline local search) ────────────────────────
  const catFlat = pairFlat.filter(e => e.category === _lsCategory);

  // Group entries
  const groups = {};
  for (const e of catFlat) {
    const g = e.group || '';
    if (!groups[g]) groups[g] = [];
    groups[g].push(e);
  }

  let listHtml = '';
  for (const [groupName, entries] of Object.entries(groups)) {
    if (groupName) {
      listHtml += `<div class="list-group-header">${groupName}</div>`;
    }
    listHtml += entries.map(e =>
      `<button class="menu-btn" data-list="${e.id}"
          data-terms="${(e.label + ' ' + (e.subtitle || '') + ' ' + groupName).toLowerCase()}">
        ${e.label}
        ${e.subtitle ? `<span style="font-size:11px;opacity:0.6;margin-left:8px">${e.subtitle}</span>` : ''}
      </button>`
    ).join('');
  }

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-section-title">${lang1} ↔ ${lang2} › ${_catIcon(_lsCategory)} ${_lsCategory}</div>
      <div class="menu-title" style="font-size:32px;margin-bottom:6px">CHOOSE MISSION</div>
      <input class="menu-input" id="listSearch" type="search" placeholder="Search in ${_lsCategory}…" autocomplete="off" />
      <div id="listItems" style="max-height:52vh;overflow-y:auto">${listHtml}</div>
      <button class="menu-btn back-btn" id="backBtn" style="font-size:13px">← Category</button>
    </div>
  `);

  // Local inline search — filters visible items without re-rendering
  document.getElementById('listSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const container = document.getElementById('listItems');
    container.querySelectorAll('[data-list]').forEach(btn => {
      btn.style.display = (!q || btn.dataset.terms.includes(q)) ? '' : 'none';
    });
    // Hide group headers whose children are all hidden
    container.querySelectorAll('.list-group-header').forEach(header => {
      let sib = header.nextElementSibling;
      let anyVisible = false;
      while (sib && !sib.classList.contains('list-group-header')) {
        if (sib.style.display !== 'none') anyVisible = true;
        sib = sib.nextElementSibling;
      }
      header.style.display = anyVisible ? '' : 'none';
    });
  });

  _bindListPick();
  document.getElementById('backBtn').addEventListener('click', () => { _lsCategory = ''; renderListSelect(); });
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
        <button class="menu-btn speed-btn${selectedSpeed==='super_easy'?' selected':''}" data-speed="super_easy" style="flex:1;font-size:13px">🐸 Frog</button>
        <button class="menu-btn speed-btn${selectedSpeed==='slow'?' selected':''}" data-speed="slow"  style="flex:1;font-size:13px">🐢 Turtle</button>
        <button class="menu-btn speed-btn${selectedSpeed==='normal'?' selected':''}" data-speed="normal" style="flex:1;font-size:13px">🐅 Tiger</button>
        <button class="menu-btn speed-btn${selectedSpeed==='fast'?' selected':''}" data-speed="fast"  style="flex:1;font-size:13px">🦅 Falcon</button>
      </div>
      <div class="menu-section-title" style="margin-top:24px">Controls</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;font-size:12px;color:#8ab08a;text-align:left;margin:0 8px 16px">
        <span><kbd style="color:#c0e090">← → / A D</kbd> Move</span>
        <span><kbd style="color:#c0e090">Z / Ctrl / Click</kbd> Shoot</span>
        <span><kbd style="color:#c0e090">↑ / W / Space</kbd> Jump</span>
        <span><kbd style="color:#c0e090">Shift</kbd> Knife (melee)</span>
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
      _originalDirection = selectedDirection;
      currentRound = 1;
      activeModifier = null;
      _round2Modifier = null;
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

// ---- BONUS ROUND PROGRESSION ----
const MODIFIER_INFO = {
  boxesMove:         { icon: '⇄', name: 'BOXES MOVE',          desc: 'The answer boxes slide back and forth — aim carefully!' },
  mirrorWorld:       { icon: '↔', name: 'MIRROR WORLD',        desc: 'Left and right are swapped. Your brain will fight you.' },
  doubleTrouble:     { icon: '✦', name: 'DOUBLE TROUBLE',      desc: 'The correct box needs two hits before it counts.' },
  noPeek:            { icon: '👁', name: 'NO-PEEK',             desc: 'The prompt vanishes after 2.5 seconds. Remember it fast!' },
  lowGravity:        { icon: '↑', name: 'LOW GRAVITY',         desc: 'Lighter jumps — platforms feel further apart.' },
  blackout:          { icon: '🌑', name: 'BLACKOUT',            desc: 'Every 8 seconds the screen goes dark. A small glow around you remains.' },
  boxImpostors:      { icon: '🎭', name: 'BOX IMPOSTORS',       desc: 'One wrong box is wearing a disguise. The real answer has a subtle tell.' },
  janitor:           { icon: '🧹', name: 'THE JANITOR',          desc: 'A mop-wielding NPC strolls through, erasing wrong boxes. Knife him to stun him.' },
  lightningCrashes:  { icon: '⚡', name: 'LIGHTNING CRASHES',   desc: 'A platform flashes yellow — then a bolt strikes. Stand on it for a free launch.' },
  wanderingMonsters: { icon: '👾', name: 'WANDERING MONSTERS',  desc: 'Random enemies wander in from the right every 8–12 seconds.' },
};

function _advanceRound() {
  currentRound++;
  const pool = [
    'boxesMove', 'mirrorWorld', 'doubleTrouble', 'noPeek', 'lowGravity',
    'blackout', 'boxImpostors', 'janitor', 'lightningCrashes', 'wanderingMonsters'
  ];
  if (currentRound === 2 || currentRound === 4) {
    const exclude = currentRound === 4 ? _round2Modifier : activeModifier;
    const available = pool.filter(m => m !== exclude);
    activeModifier = available[Math.floor(Math.random() * available.length)];
    if (currentRound === 2) _round2Modifier = activeModifier;
  } else {
    activeModifier = null;
  }
  if (currentRound === 3) {
    _originalDirection = selectedDirection;
    selectedDirection = selectedDirection === 'a-to-b' ? 'b-to-a' : 'a-to-b';
  }
  _showModifierBanner(activeModifier, currentRound, startGame);
}

function _showModifierBanner(modifier, round, onDone) {
  const info = modifier ? MODIFIER_INFO[modifier] : null;
  const listEntry = getManifest().find(e => e.id === selectedList) || {};
  const l1 = listEntry.lang1 || 'A', l2 = listEntry.lang2 || 'B';
  const dirLabel = selectedDirection === 'a-to-b' ? `${l1} → ${l2}` : `${l2} → ${l1}`;

  const modifierBlock = info ? `
    <div style="font-size:64px;margin:8px 0;line-height:1">${info.icon}</div>
    <div style="font-size:32px;font-weight:bold;color:#44ff44;letter-spacing:4px;margin-bottom:12px">${info.name}</div>
    <div style="font-size:15px;color:#c0ffc0;margin-bottom:20px;line-height:1.5">${info.desc}</div>
  ` : `
    <div style="font-size:64px;margin:8px 0;line-height:1">↔</div>
    <div style="font-size:28px;font-weight:bold;color:#44aaff;letter-spacing:3px;margin-bottom:12px">REVERSED DIRECTION</div>
    <div style="font-size:15px;color:#aaddff;margin-bottom:20px;line-height:1.5">Translate ${dirLabel} — the other way around.</div>
  `;

  showOverlay(`
    <div style="text-align:center;padding:40px 32px;max-width:480px">
      <div style="font-size:12px;color:#6a9a6a;letter-spacing:3px;margin-bottom:16px">ROUND ${round} / 4 — BONUS MISSION UNLOCKED</div>
      ${modifierBlock}
      <div style="font-size:12px;color:#4a7a4a;letter-spacing:2px" id="banner-skip">TAP OR WAIT...</div>
    </div>
  `);

  let remaining = 3;
  const skipEl = document.getElementById('banner-skip');

  const tick = setInterval(() => {
    remaining--;
    if (skipEl) skipEl.textContent = remaining > 0 ? `TAP OR WAIT ${remaining}...` : '';
    if (remaining <= 0) {
      clearInterval(tick);
      onDone();
    }
  }, 1000);

  overlay.addEventListener('click', function dismiss() {
    clearInterval(tick);
    overlay.removeEventListener('click', dismiss);
    onDone();
  }, { once: true });
}

// ---- START GAME ----
async function startGame() {
  // Dev override: ?mod=<modifierKey> forces a specific modifier (any round)
  const _devMod = new URLSearchParams(window.location.search).get('mod');
  if (_devMod && _devMod in MODIFIER_INFO) {
    activeModifier = _devMod;
    if (currentRound < 2) currentRound = 2;
  }

  hideOverlay();
  currentScreen = SCREENS.PLAYING;
  if (touchControls) {
    touchControls.classList.toggle('hidden', !isTouchDevice());
  }

  // Lazy-load the CSV if not yet cached
  if (!wordLists[selectedList]) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4a7a4a';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING MISSION...', canvas.width / 2, canvas.height / 2);
    const entry = getManifest().find(e => e.id === selectedList) || { id: selectedList };
    wordLists[selectedList] = await fetchWordList(entry);
  }

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

  // SM-11: capture reference so a stale callback from a previous game is ignored
  let thisGame;
  const onGameOver = (score, won) => {
    if (currentGame !== thisGame) return;
    lastScore = score;
    lastVictory = won;
    currentGame = null;
    goToScreen(SCREENS.GAME_OVER);
  };

  thisGame = currentGame = new Game(
    canvas, wordList, selectedDirection, selectedPlayer,
    audio, LB, selectedSpeed,
    listMeta.lang1 || 'A', listMeta.lang2 || 'B',
    selectedList, onGameOver, activeModifier, currentRound
  );

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

  // Undeniable Victory: player has beaten all 4 rounds
  const trueVictory = lastVictory && currentRound === 4;
  // Bonus offer: player won and more rounds remain
  const offerBonus = lastVictory && currentRound < 4;

  const roundLabels = {
    2: `Bonus Round: <span style="color:#ff88ff">${_modifierDisplayName(activeModifier) || '???'}</span>`,
    3: 'Round 3: <span style="color:#44aaff">Reversed Direction</span>',
    4: `Final Round: <span style="color:#ff88ff">${_modifierDisplayName(activeModifier) || '???'}</span> + Reversed`,
  };
  const nextRoundLabel = roundLabels[currentRound + 1] || '';

  const countdownHtml = offerBonus ? `
    <div id="bonus-countdown-wrap">
      <div id="bonus-countdown">10</div>
      <div id="bonus-countdown-label">🎁 Click to unlock Bonus Mission!</div>
      <div style="font-size:12px;color:#88cc88;margin-top:4px">${nextRoundLabel}</div>
    </div>
  ` : '';

  const trueVictoryHtml = trueVictory ? `
    <div style="color:#ffd700;font-size:38px;font-weight:bold;letter-spacing:3px;margin:8px 0;text-shadow:0 0 24px #ffaa00">UNDENIABLE VICTORY!</div>
    <div style="color:#aaffcc;font-size:14px;margin-bottom:16px">The Spelling Overlord has been mastered in all four rounds!</div>
    <div style="color:#88ccff;font-size:13px;margin-bottom:20px;font-style:italic">Are you strong enough to face it again?</div>
    <button class="menu-btn" id="playAgainBtn" style="border-color:#ffd700;color:#ffd700">▶ FACE IT AGAIN (Round 1)</button>
  ` : `
    <button class="menu-btn" id="playAgainBtn">▶ PLAY AGAIN</button>
  `;

  showOverlay(`
    <div class="menu-panel">
      <div class="menu-title" style="color:${lastVictory ? '#44ff44' : '#cc2222'};font-size:36px">
        ${lastVictory ? '★ MISSION COMPLETE' : '✗ GAME OVER'}
      </div>
      <div class="menu-subtitle">${listLabel} · ${dirLabel}</div>
      <div style="color:#a0e080;font-size:28px;margin:16px 0;font-weight:bold">${lastScore} pts</div>
      ${rankText ? `<div style="color:#ffdd00;font-size:14px;margin-bottom:12px">${rankText}</div>` : ''}
      ${countdownHtml}
      ${trueVictoryHtml}
      <button class="menu-btn" id="changeListBtn">🔄 CHANGE MISSION</button>
      <button class="menu-btn" id="lbBtn2">📊 LEADERBOARD</button>
      <button class="menu-btn back-btn" id="titleBtn">⌂ MAIN MENU</button>
    </div>
  `);

  // Countdown logic
  if (offerBonus) {
    let secs = 10;
    const cdEl    = document.getElementById('bonus-countdown');
    const cdWrap  = document.getElementById('bonus-countdown-wrap');

    const tick = setInterval(() => {
      secs--;
      if (cdEl) cdEl.textContent = secs;
      if (secs <= 0) {
        clearInterval(tick);
        if (cdWrap) cdWrap.style.display = 'none';
      }
    }, 1000);

    const onBonusClick = () => {
      clearInterval(tick);
      _advanceRound();
    };
    cdWrap.addEventListener('click', onBonusClick);
  }

  document.getElementById('playAgainBtn').addEventListener('click', () => {
    if (trueVictory) {
      // Reset to round 1 with original direction
      currentRound = 1;
      activeModifier = null;
      _round2Modifier = null;
      if (_originalDirection) selectedDirection = _originalDirection;
      _originalDirection = '';
    }
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

function _modifierDisplayName(mod) {
  const names = {
    boxesMove:         'Boxes Move',
    mirrorWorld:       'Mirror World',
    doubleTrouble:     'Double Trouble',
    noPeek:            'No-Peek',
    lowGravity:        'Low Gravity',
    blackout:          'Blackout',
    boxImpostors:      'Box Impostors',
    janitor:           'The Janitor',
    lightningCrashes:  'Lightning Crashes',
    wanderingMonsters: 'Wandering Monsters',
  };
  return names[mod] || null;
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
    <div class="menu-panel" style="max-height:90vh;overflow-y:auto">
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
  // Reset round progression when leaving a run entirely
  if (screen === SCREENS.LIST_SELECT || screen === SCREENS.TITLE || screen === SCREENS.PLAYER_SELECT) {
    currentRound = 1;
    activeModifier = null;
    _round2Modifier = null;
    _originalDirection = '';
  }
  // Reset list-select navigation when going all the way back to title/player
  if (screen === SCREENS.TITLE || screen === SCREENS.PLAYER_SELECT) {
    _lsLangPair = '';
    _lsCategory = '';
    _lsSearch = '';
  }
  currentScreen = screen;
  if (touchControls) {
    touchControls.classList.toggle('hidden', screen !== SCREENS.PLAYING || !isTouchDevice());
  }
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
