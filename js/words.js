export function parseCSV(text) {
  const unquote = s => {
    s = s.trim();
    return (s.startsWith('"') && s.endsWith('"')) ? s.slice(1, -1).trim() : s;
  };
  return text.trim().split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      line = line.trim();
      let a, rest;
      if (line.startsWith('"')) {
        // Quoted first field — find its closing quote, then skip separator
        const closeA = line.indexOf('"', 1);
        a = line.slice(1, closeA).trim();
        rest = line.slice(closeA + 1).replace(/^\s*,\s*/, '');
      } else {
        // Unquoted first field — split on first comma
        const comma = line.indexOf(',');
        a = line.slice(0, comma).trim();
        rest = line.slice(comma + 1).trim();
      }
      return { a, b: unquote(rest) };
    });
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FALLBACK = {
  holidays: [
    { a: 'vakantie', b: 'holiday' },
    { a: 'strand', b: 'beach' },
    { a: 'zee', b: 'sea' },
    { a: 'zon', b: 'sun' },
    { a: 'zwemmen', b: 'swimming' },
    { a: 'koffer', b: 'suitcase' },
    { a: 'vliegtuig', b: 'airplane' },
    { a: 'hotel', b: 'hotel' },
    { a: 'reizen', b: 'travel' },
    { a: 'kaart', b: 'map' },
    { a: 'paspoort', b: 'passport' },
    { a: 'tent', b: 'tent' },
    { a: 'kamperen', b: 'camping' },
    { a: 'souvenirs', b: 'souvenirs' },
    { a: 'vertrek', b: 'departure' },
    { a: 'aankomst', b: 'arrival' },
    { a: 'zwembad', b: 'swimming pool' },
    { a: 'zonnebril', b: 'sunglasses' },
    { a: 'snorkelen', b: 'snorkeling' },
    { a: 'rondleiding', b: 'tour' }
  ],
  police: [
    { a: 'politie', b: 'police' },
    { a: 'agent', b: 'officer' },
    { a: 'wapen', b: 'weapon' },
    { a: 'pistool', b: 'gun' },
    { a: 'handboei', b: 'handcuff' },
    { a: 'arresteren', b: 'arrest' },
    { a: 'verdachte', b: 'suspect' },
    { a: 'bewijs', b: 'evidence' },
    { a: 'misdaad', b: 'crime' },
    { a: 'gevangenis', b: 'prison' },
    { a: 'patrouille', b: 'patrol' },
    { a: 'beschermen', b: 'protect' },
    { a: 'aanval', b: 'attack' },
    { a: 'explosief', b: 'explosive' },
    { a: 'missie', b: 'mission' },
    { a: 'commando', b: 'commando' },
    { a: 'commandant', b: 'commander' },
    { a: 'radar', b: 'radar' },
    { a: 'uniform', b: 'uniform' },
    { a: 'grens', b: 'border' }
  ],
  school: [
    { a: 'school', b: 'school' },
    { a: 'klas', b: 'class' },
    { a: 'leraar', b: 'teacher' },
    { a: 'leerling', b: 'pupil' },
    { a: 'boek', b: 'book' },
    { a: 'huiswerk', b: 'homework' },
    { a: 'toets', b: 'test' },
    { a: 'cijfer', b: 'grade' },
    { a: 'rekenen', b: 'maths' },
    { a: 'lezen', b: 'reading' },
    { a: 'schrijven', b: 'writing' },
    { a: 'pauze', b: 'break' },
    { a: 'gymzaal', b: 'gymnasium' },
    { a: 'bibliotheek', b: 'library' },
    { a: 'schrift', b: 'notebook' },
    { a: 'potlood', b: 'pencil' },
    { a: 'gum', b: 'eraser' },
    { a: 'rugzak', b: 'backpack' },
    { a: 'rooster', b: 'timetable' },
    { a: 'diploma', b: 'diploma' }
  ]
};

export function generateMisspellings(word, count = 3, options = {}) {
  const w    = word;
  const low  = w.toLowerCase();
  const VOWELS = 'aeiouäëïöüáéíóúàèìòùâêîôûæœ';
  const isVowel = c => VOWELS.includes(c);

  const candidates = [];
  const seen = new Set([low]);
  const add = s => {
    const sl = s.toLowerCase();
    if (s.length >= 2 && !seen.has(sl)) { seen.add(sl); candidates.push(s); }
  };

  // ── 1. Transpose two adjacent letters (watrefall) ──────────────────────
  for (let i = 0; i < w.length - 1; i++) {
    if (low[i] !== low[i + 1])
      add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
  }

  // ── 2. Reduce a double consonant to single (waterfal) ──────────────────
  for (let i = 0; i < w.length - 1; i++) {
    if (low[i] === low[i + 1] && !isVowel(low[i]))
      add(w.slice(0, i + 1) + w.slice(i + 2));
  }

  // ── 3. Double a consonant that isn't already doubled (watterfall) ───────
  for (let i = 1; i < w.length - 1; i++) {
    if (!isVowel(low[i]) && low[i] !== low[i - 1] && low[i] !== low[i + 1])
      add(w.slice(0, i + 1) + w[i] + w.slice(i + 1));
  }

  // ── 4. Phonetically similar substitutions ──────────────────────────────
  // Pairs: [pattern, replacement] — applied wherever pattern occurs in word
  // Boss-fight priority: voiced/unvoiced pairs that the Spelling Overlord favours
  const bossPhonetic = options.prioritizeVoiced ? [
    ['s', 'z'], ['z', 's'],
    ['f', 'v'], ['v', 'f'],
    ['g', 'c'], ['c', 'g'],
  ] : [];
  const phonetic = [...bossPhonetic,
    // Vowel digraphs (same sound, different spelling)
    ['ie', 'ei'], ['ei', 'ie'],
    ['ea', 'ee'], ['ee', 'ea'],
    ['ou', 'oo'], ['oo', 'ou'],
    ['ai', 'ay'], ['ay', 'ai'],
    ['au', 'aw'], ['aw', 'au'],
    // Consonant alternates
    ['ck', 'k'],  ['kk', 'ck'],
    ['ph', 'f'],  ['ff', 'ph'],
    ['gh', 'g'],
    ['ce', 'se'], ['se', 'ce'],
    ['ci', 'si'], ['si', 'ci'],
    // Suffixes often confused
    ['tion',  'sion'],  ['sion',  'tion'],
    ['ance',  'ence'],  ['ence',  'ance'],
    ['able',  'ible'],  ['ible',  'able'],
    ['ary',   'ery'],   ['ery',   'ary'],
    // Unstressed endings
    ['er', 'ar'], ['ar', 'er'],
    ['or', 'ar'], ['ar', 'or'],
    ['er', 're'], ['re', 'er'],
    ['el', 'le'], ['le', 'el'],
    // Accented vowel confusion (French / German words)
    ['é', 'e'], ['è', 'e'], ['ê', 'e'],
    ['ö', 'o'], ['ü', 'u'], ['ä', 'a'],
    ['â', 'a'], ['î', 'i'], ['ô', 'o'], ['û', 'u'],
    ['œ', 'oe'], ['æ', 'ae'],
  ];
  for (const [from, to] of phonetic) {
    let idx = low.indexOf(from);
    while (idx !== -1) {
      add(w.slice(0, idx) + to + w.slice(idx + from.length));
      idx = low.indexOf(from, idx + 1);
    }
  }

  // ── 5. Confused vowel in non-initial syllable (waterfill / waterfell) ───
  const vowelConfusion = {
    'a': ['e', 'i'],  'e': ['a', 'i'],  'i': ['e', 'a'],
    'o': ['u', 'a'],  'u': ['o', 'a'],
  };
  for (let i = 2; i < w.length - 1; i++) {   // skip first two chars to keep word recognisable
    const subs = vowelConfusion[low[i]];
    if (subs) subs.forEach(sub => add(w.slice(0, i) + sub + w.slice(i + 1)));
  }

  // ── 6. Drop a single letter from the middle (last resort) ───────────────
  for (let i = 1; i < w.length - 1; i++)
    add(w.slice(0, i) + w.slice(i + 1));

  // ── Pick 'count' candidates, preferring same-length (hardest to spot) ───
  const _shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const byDelta = d => candidates.filter(c => Math.abs(c.length - w.length) === d);
  const pool = [
    ..._shuffle(byDelta(0)),   // same length — hardest to spot
    ..._shuffle(byDelta(1)),   // ±1 letter
    ..._shuffle(byDelta(2)),   // ±2 letters
  ];

  const picked = pool.slice(0, count);

  // Absolute fallback for very short or unusual words
  while (picked.length < count)
    picked.push(w + 'x'.repeat(picked.length + 1));

  return picked;
}

// Flatten hierarchical manifest { "NL-EN": { lang1, lang2, categories: { Cat: [...] } } }
// into a plain array of entries, each with lang1/lang2/langPair/category/group fields.
// Also accepts the old flat-array format for backward compatibility.
export function flattenManifest(manifest) {
  if (Array.isArray(manifest)) {
    // Old flat format — normalise missing fields
    return manifest.map(e => ({
      ...e,
      langPair: e.langPair || `${e.lang1 || ''}-${e.lang2 || ''}`,
      category: e.category || 'Theme',
    }));
  }
  const entries = [];
  for (const [pairKey, pairData] of Object.entries(manifest)) {
    const { lang1, lang2, categories = {} } = pairData;
    for (const [catName, catData] of Object.entries(categories)) {
      if (Array.isArray(catData)) {
        for (const e of catData) {
          entries.push({ ...e, lang1, lang2, langPair: pairKey, category: catName });
        }
      } else {
        // Object: group name → array of entries
        for (const [groupName, groupList] of Object.entries(catData)) {
          for (const e of groupList) {
            entries.push({ ...e, lang1, lang2, langPair: pairKey, category: catName, group: groupName });
          }
        }
      }
    }
  }
  return entries;
}

// Fetch and parse a single word list on demand (lazy loading).
export async function fetchWordList(entry) {
  const file = entry.file || `data/${entry.id}.csv`;
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCSV(await res.text());
  } catch (e) {
    console.warn(`Failed to load word list "${entry.id}":`, e);
    return FALLBACK[entry.id] || [];
  }
}

// Boot-time load: fetch manifest only — individual CSVs are loaded lazily.
export async function loadWordLists() {
  let manifest;
  try {
    const res = await fetch('data/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = await res.json();
  } catch (e) {
    console.warn('Could not load manifest.json, using built-in lists:', e);
    manifest = [
      { id: 'holidays', label: '🏖 Holidays', subtitle: 'Vakantie', lang1: 'Dutch',  lang2: 'English' },
      { id: 'police',   label: '🚔 Police',   subtitle: 'Politie',  lang1: 'Dutch',  lang2: 'English' },
      { id: 'school',   label: '📚 School',   subtitle: 'School',   lang1: 'Dutch',  lang2: 'English' },
    ];
  }
  return { _manifest: manifest, _flat: flattenManifest(manifest) };
}
