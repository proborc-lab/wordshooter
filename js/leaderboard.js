import { readJSON, writeJSON } from './storage.js';

const LEADERBOARD_KEY = 'wordshooter_leaderboard';
const PLAYERS_KEY = 'wordshooter_players';

export function getPlayers() {
  const p = readJSON(PLAYERS_KEY, []);
  return Array.isArray(p) ? p : [];
}

export function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const players = getPlayers();
  if (!players.includes(trimmed)) {
    players.push(trimmed);
    writeJSON(PLAYERS_KEY, players);
  }
}

export function getLeaderboard(listName, direction) {
  const key = `${LEADERBOARD_KEY}_${listName}_${direction}`;
  const b = readJSON(key, []);
  return Array.isArray(b) ? b : [];
}

export function submitScore(listName, direction, player, score) {
  const key = `${LEADERBOARD_KEY}_${listName}_${direction}`;
  let board = getLeaderboard(listName, direction);
  const entry = {
    player: player.trim(),
    score,
    date: new Date().toLocaleDateString('en-GB')
  };
  board.push(entry);
  // Sort descending by score
  board.sort((a, b) => b.score - a.score);
  // Keep top 10
  board = board.slice(0, 10);
  writeJSON(key, board);
  return board;
}

// ---- Custom lists ----
const CUSTOM_LISTS_KEY = 'wordshooter_custom_lists';

export function getCustomLists(playerName) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  const l = readJSON(key, []);
  return Array.isArray(l) ? l : [];
}

export function saveCustomList(playerName, list) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  const lists = getCustomLists(playerName);
  const idx = lists.findIndex(l => l.id === list.id);
  if (idx >= 0) lists[idx] = list;
  else lists.push(list);
  writeJSON(key, lists);
}

export function deleteCustomList(playerName, listId) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  const lists = getCustomLists(playerName).filter(l => l.id !== listId);
  writeJSON(key, lists);
}
