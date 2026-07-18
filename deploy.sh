#!/usr/bin/env bash
#
# uitgeleerd.nl — bouw een schone publiceerbare map (dist/).
# Kopieert ALLEEN wat live moet; interne docs en Claude-config blijven achter.
# Upload daarna de INHOUD van dist/ naar de web-root.
#
# Gebruik:  bash deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"

# --- Allowlist: wat WEL mee moet (alles wat hier niet staat, gaat niet mee) ---
FILES=(
  index.html                    # de portal
)
DIRS=(
  css                           # site.css — alleen voor de portal
  wordshooter                   # het spel, compleet
)

# Interne bestanden die in een meegekopieerde map kunnen zitten. Sinds het spel
# in wordshooter/ woont pakt `cp -R` zijn CLAUDE.md en README.md gewoon mee —
# dat is precies het soort lek dat je pas ontdekt als het al online staat.
INTERN=( CLAUDE.md README.md .claude deploy.sh dist resume.sh )

echo "→ Schone dist/ aanmaken…"
rm -rf "$DIST"
mkdir -p "$DIST"

fout=0

for f in "${FILES[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    cp "$ROOT/$f" "$DIST/$f"
  else
    echo "  ! ontbreekt: $f" >&2; fout=1
  fi
done

for d in "${DIRS[@]}"; do
  if [[ -d "$ROOT/$d" ]]; then
    cp -R "$ROOT/$d" "$DIST/$d"
  else
    echo "  ! ontbreekt: $d/" >&2; fout=1
  fi
done

# Rommel en interne bestanden die meeliftten gaan er weer uit — op elk niveau.
# -mindepth 1 is niet cosmetisch: dist/ heet zelf "dist", dus zonder dat vlaggetje
# matcht de lus zijn eigen doelmap en gooit alles weg wat hij net heeft gekopieerd.
for naam in "${INTERN[@]}"; do
  find "$DIST" -mindepth 1 -depth -name "$naam" -exec rm -rf {} + 2>/dev/null || true
done
find "$DIST" -name '.~lock.*#' -delete 2>/dev/null || true
find "$DIST" -name '.DS_Store' -delete 2>/dev/null || true

# --- Check 1: elke tegel met een LOKAAL doel moet bestaan ---------------------
# Portal-equivalent van de CSV-check hieronder: een tegel die nergens heen gaat
# faalt pas als een kind erop klikt. Externe URL's checken we bewust NIET — dan
# zou je niet kunnen uploaden omdat andermans site toevallig plat ligt.
echo "→ Tegels controleren…"
tegels=$(
  python3 - "$DIST" <<'PY'
import os, re, sys
dist = sys.argv[1]
html = open(os.path.join(dist, 'index.html'), encoding='utf-8').read()

lokaal = extern = 0
for href in re.findall(r'<a\s[^>]*href="([^"]+)"', html):
    if href.startswith(('http://', 'https://', 'mailto:', '#')):
        extern += 1
        continue
    lokaal += 1
    doel = os.path.join(dist, href)
    # "wordshooter/" moet een map met een index.html zijn
    if href.endswith('/'):
        doel = os.path.join(doel, 'index.html')
    if not os.path.isfile(doel):
        print(f"MISSING {href}")
print(f"COUNT {lokaal} {extern}")
PY
)
read -r _ n_lokaal n_extern <<<"$(grep '^COUNT ' <<<"$tegels")"
echo "    $n_lokaal lokale tegel(s), $n_extern externe"
if grep -q '^MISSING ' <<<"$tegels"; then
  grep '^MISSING ' <<<"$tegels" | sed 's|^MISSING |  ! tegel wijst nergens heen: |' >&2
  fout=1
else
  echo "    ✓ elke lokale tegel bestaat"
fi

# --- Check 2: elke manifest-entry moet een CSV hebben die ECHT bestaat --------
# Dé faalmodus van het spel (zie wordshooter/CLAUDE.md): een lijst in het
# manifest zonder bestand geeft pas een harde fout als een kind erop klikt.
echo "→ Woordenlijsten controleren tegen de CSV's…"
GAME="$DIST/wordshooter"
if [[ -f "$GAME/data/manifest.json" ]]; then
  ontbrekend=$(
    python3 - "$GAME" <<'PY'
import json, os, sys
game = sys.argv[1]
with open(os.path.join(game, 'data', 'manifest.json')) as fh:
    manifest = json.load(fh)

# Categories nest: sometimes a flat list of lists, sometimes another level
# ("Homework" → "Method 128" → [...]). Walk until we hit the entries.
def entries(node):
    if isinstance(node, list):
        yield from node
    elif isinstance(node, dict):
        for v in node.values():
            yield from entries(v)

missing, total = [], 0
for pair in manifest.values():
    for e in entries(pair.get('categories', {})):
        total += 1
        rel = e.get('file') or f"data/{e['id']}.csv"
        if not os.path.isfile(os.path.join(game, rel)):
            missing.append(f"{e.get('label', e.get('id'))} → {rel}")

print(f"TOTAL {total}")
for m in missing:
    print(f"MISSING {m}")
PY
  )
  aantal=$(grep '^TOTAL ' <<<"$ontbrekend" | cut -d' ' -f2)
  echo "    $aantal lijsten in het manifest"
  if grep -q '^MISSING ' <<<"$ontbrekend"; then
    grep '^MISSING ' <<<"$ontbrekend" | sed 's/^MISSING /  ! CSV ontbreekt: /' >&2
    fout=1
  else
    echo "    ✓ alle CSV's aanwezig"
  fi

  # Andersom: CSV's die nergens in het manifest staan zijn dode vracht.
  weesjes=$(
    python3 - "$GAME" <<'PY'
import json, os, sys
game = sys.argv[1]
with open(os.path.join(game, 'data', 'manifest.json')) as fh:
    manifest = json.load(fh)

def entries(node):
    if isinstance(node, list):
        yield from node
    elif isinstance(node, dict):
        for v in node.values():
            yield from entries(v)

used = set()
for pair in manifest.values():
    for e in entries(pair.get('categories', {})):
        used.add(os.path.normpath(e.get('file') or f"data/{e['id']}.csv"))

for root, _, files in os.walk(os.path.join(game, 'data')):
    for f in files:
        if f.endswith('.csv'):
            rel = os.path.normpath(os.path.relpath(os.path.join(root, f), game))
            if rel not in used:
                print(rel)
PY
  )
  if [[ -n "$weesjes" ]]; then
    echo "    ⚠ CSV's die niet in het manifest staan (worden wél geüpload):"
    sed 's/^/      /' <<<"$weesjes"
  fi
else
  echo "  ! wordshooter/data/manifest.json ontbreekt" >&2; fout=1
fi

# --- Check 3: geen externe verwijzingen in het SPEL ---------------------------
# Het spel moet volledig zelfstandig draaien (serverless, localStorage). De
# portal linkt naar andere sites — dat mag — maar mag er niets van INLADEN.
echo "→ Externe verwijzingen zoeken…"
if grep -rIn --include='*.html' --include='*.js' --include='*.css' \
     -E "https?://(unpkg|cdn|cdnjs|jsdelivr|fonts\.googleapis)" "$DIST" 2>/dev/null; then
  echo "  ! externe CDN-verwijzing gevonden — alles moet zonder internet werken" >&2
  fout=1
else
  echo "    ✓ geen CDN-verwijzingen"
fi

# Hotlinks vanaf de portal: een <img>/<link>/<script> naar een ander domein
# maakt de tegels afhankelijk van andermans uptime. <a href> mag wél.
if grep -oIn -E '<(img|link|script)[^>]+(src|href)="https?://[^"]+"' "$DIST/index.html" 2>/dev/null; then
  echo "  ! portal laadt iets van een ander domein — teken tegel-art zelf" >&2
  fout=1
else
  echo "    ✓ portal laadt niets van buiten"
fi

# --- Check 4: interne bestanden mogen niet lekken -----------------------------
for lek in "${INTERN[@]}"; do
  if gevonden=$(find "$DIST" -mindepth 1 -name "$lek" -print -quit 2>/dev/null) && [[ -n "$gevonden" ]]; then
    echo "  ! intern bestand lekte naar dist/: ${gevonden#$DIST/}" >&2; fout=1
  fi
done

echo ""
echo "→ dist/ bevat:"
# Alleen het topniveau: kort en VOLLEDIG. Een afgekapte lijst liegt over de inhoud.
( cd "$DIST" && find . -maxdepth 1 -not -name '.' | sort | sed 's|^\./|    |' )
echo ""
echo "    bestanden: $(find "$DIST" -type f | wc -l) | grootte: $(du -sh "$DIST" | cut -f1)"
echo ""
if [[ "$fout" -eq 0 ]]; then
  echo "✓ dist/ is klaar om te uploaden naar de web-root (HTTPS!)."
else
  echo "✗ Er ontbrak iets of er was een waarschuwing — controleer hierboven." >&2
  exit 1
fi
