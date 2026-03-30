const LEADERBOARD_KEY = 'wordshooter_leaderboard';
const PLAYERS_KEY = 'wordshooter_players';

export function getPlayers() {
  try {
    const data = localStorage.getItem(PLAYERS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const players = getPlayers();
  if (!players.includes(trimmed)) {
    players.push(trimmed);
    try {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    } catch (e) {
      console.warn('Could not save player:', e);
    }
  }
}

export function getLeaderboard(listName, direction) {
  const key = `${LEADERBOARD_KEY}_${listName}_${direction}`;
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
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
  try {
    localStorage.setItem(key, JSON.stringify(board));
  } catch (e) {
    console.warn('Could not save score:', e);
  }
  return board;
}

// ---- Custom lists ----
const CUSTOM_LISTS_KEY = 'wordshooter_custom_lists';

export function getCustomLists(playerName) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomList(playerName, list) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  const lists = getCustomLists(playerName);
  const idx = lists.findIndex(l => l.id === list.id);
  if (idx >= 0) lists[idx] = list;
  else lists.push(list);
  try {
    localStorage.setItem(key, JSON.stringify(lists));
  } catch (e) {
    console.warn('Could not save custom list:', e);
  }
}

export function deleteCustomList(playerName, listId) {
  const key = `${CUSTOM_LISTS_KEY}_${playerName}`;
  const lists = getCustomLists(playerName).filter(l => l.id !== listId);
  try {
    localStorage.setItem(key, JSON.stringify(lists));
  } catch (e) {
    console.warn('Could not delete custom list:', e);
  }
}
