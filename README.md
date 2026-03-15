# Wordshooter — by proborc-lab

> Well, you are looking up the Readme. That is something for sure.

The goal of this project is quite simple. A boy with little interest for learning languages, but a big interest in gaming — how do you get them to learn? By combining these two elements. This means we try to drive engagement while also learning the words.

---

## What is it?

Wordshooter is a browser-based side-scrolling platformer where the gameplay *is* the vocabulary drill. A word appears at the top of the screen. Answer boxes scroll past on platforms. Jump, run, shoot or knife the correct translation before the timer runs out. Get it wrong and a monster spawns. Get everything right and face the **Spelling Overlord** — a boss who tests whether you actually know how to *spell* what you've been translating.

No install. No server. No account. Open the HTML file and play.

---

## How to play

| Action | Keys |
|---|---|
| Move | ← → / A D |
| Jump (double jump available) | ↑ / W / Space |
| Shoot | Z / Ctrl / Mouse click (hold to auto-fire) |
| Knife (melee, 80 px reach) | Right Shift |
| Pause | P / ESC |

**Shoot the correct translation** of the word shown at the top. Wrong boxes shake and spawn monsters. Miss the timer and you lose a heart.

### Scoring & progression
- Each correct answer scores points based on remaining time × combo multiplier
- Combos build a score multiplier (up to ×4)
- Every 5 correct answers unlocks an upgrade: Rapid Fire, Shield, Speed Boost, +1 Heart, or 2× Score
- Difficulty ramps as you progress: more decoy boxes, less time per word

### The boss fight
After all words are answered the **Spelling Overlord** descends. He is immune to bullets by default. Each round:
1. A word appears above his head
2. Four boxes land on the arena platforms — one correct spelling, three deliberate misspellings
3. Shoot (or knife) the correctly spelled box to open a **10-second vulnerability window**
4. Unload everything into the boss before the shield comes back up
5. Repeat until his 9 HP are gone — then watch the pieces fly

---

## Adding your own word lists

Lists live in `data/` as plain CSV files — one word pair per line:

```
hond,dog
kat,cat
fiets,bicycle
```

Then register the list in `data/manifest.json`:

```json
{
  "id": "my_list",
  "label": "🐾 Animals",
  "subtitle": "Dieren",
  "lang1": "Dutch",
  "lang2": "English"
}
```

That's it. The list appears in the mission select screen immediately.

**A note on list length:** 20 words is a good sweet spot. Long enough to feel like a real session, short enough to finish in one sitting. The 36-word list included here is a bit much — you have been warned.

---

## Architecture

This project is intentionally **memoryless and serverless**. There is no backend, no telemetry, no feedback loop to any server. Everything runs in the browser.

- **High scores** are stored in `localStorage` — per list, per translation direction
- **Word lists** are static CSV files loaded at runtime
- **No build step** — plain ES6 modules, open `index.html` directly or serve from any static host

### File overview

```
index.html          Entry point
js/
  main.js           Screen management & game flow
  game.js           Core game loop, collision, boss logic
  level.js          Procedural platform generation & camera
  entities.js       All game objects (boxes, monsters, boss, projectiles)
  player.js         Player physics & animation
  ui.js             HUD, hearts, timer bar, boss health bar
  audio.js          Procedural Web Audio sound effects
  words.js          CSV loader, shuffle, misspelling generator
  leaderboard.js    localStorage high score persistence
  sprites.js        Sprite sheet handling
data/
  manifest.json     Word list registry
  *.csv             Vocabulary files
```

### Monsters
Wrong answers spawn one of three monsters at random:
- **Classic monster** — floats and tracks the player, fires projectiles
- **Bat** — rises upward and escapes off the top; fires only to the right
- **Snake** — crawls left along the platform, jumps once, then drops off screen; no projectile but damages on contact

---

## Running locally

No build step required. Just serve the project root over HTTP (browsers block ES6 module imports from `file://`):

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080`.

---

## Contributing

Pull requests welcome. If you add a word list, make sure `lang1` and `lang2` in the manifest match the actual languages in the CSV — the game uses those labels in the HUD and leaderboard.

---

*Built for one specific kid. Hopefully useful for others.*
