export function parseCSV(text) {
  return text.trim().split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const comma = line.indexOf(',');
      return {
        a: line.slice(0, comma).trim(),
        b: line.slice(comma + 1).trim()
      };
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

export async function loadWordLists() {
  // Load manifest to discover available word lists
  let manifest;
  try {
    const res = await fetch('data/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = await res.json();
  } catch (e) {
    console.warn('Could not load manifest.json, using built-in lists:', e);
    manifest = [
      { id: 'holidays', label: '🏖 Holidays', subtitle: 'Vakantie' },
      { id: 'police',   label: '🚔 Police',   subtitle: 'Politie'  },
      { id: 'school',   label: '📚 School',   subtitle: 'School'   }
    ];
  }

  const lists = { _manifest: manifest };
  for (const entry of manifest) {
    try {
      const resp = await fetch(`data/${entry.id}.csv`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      lists[entry.id] = parseCSV(text);
    } catch (e) {
      console.warn(`Failed to load ${entry.id}.csv, using fallback:`, e);
      lists[entry.id] = FALLBACK[entry.id] || [];
    }
  }
  return lists;
}
