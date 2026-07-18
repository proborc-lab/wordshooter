#!/usr/bin/env bash
#
# Wordshooter — bouw een schone publiceerbare map (dist/).
# Kopieert ALLEEN wat live moet; interne docs en Claude-config blijven achter.
#
# Upload de INHOUD van dist/ naar  uitgeleerd.nl/wordshooter/
# (niet naar de web-root — daar staat de portal, zie de Uitgeleerd-repo).
#
# Het spel weet zelf niet in welke map het woont: alle paden zijn relatief.
# Daardoor draait deze dist/ net zo goed in een submap als in een web-root.
# Wat je NIET mag veranderen is de origin — localStorage hangt aan
# uitgeleerd.nl, dus een eigen (sub)domein maakt een jaar aan voortgang
# onbereikbaar. Zie js/storage.js.
#
# Gebruik:  bash deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"

# --- Allowlist: wat WEL mee moet (alles wat hier niet staat, gaat niet mee) ---
FILES=(
  index.html
  manifest.webmanifest
  icon-192.png
  icon-512.png
)
DIRS=(
  css
  js
  data           # manifest.json + alle woordenlijst-CSV's
)

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

# --- Check 1: elke manifest-entry moet een CSV hebben die ECHT bestaat --------
# Dé faalmodus van dit project (zie CLAUDE.md): een lijst in het manifest zonder
# bijbehorend bestand geeft pas een harde fout als een kind erop klikt.
# Beter hier stuk dan op de site.
echo "→ Manifest controleren tegen de CSV's…"
if [[ -f "$DIST/data/manifest.json" ]]; then
  ontbrekend=$(
    python3 - "$DIST" <<'PY'
import json, os, sys
dist = sys.argv[1]
with open(os.path.join(dist, 'data', 'manifest.json')) as fh:
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
        if not os.path.isfile(os.path.join(dist, rel)):
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
    python3 - "$DIST" <<'PY'
import json, os, sys
dist = sys.argv[1]
with open(os.path.join(dist, 'data', 'manifest.json')) as fh:
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

for root, _, files in os.walk(os.path.join(dist, 'data')):
    for f in files:
        if f.endswith('.csv'):
            rel = os.path.normpath(os.path.relpath(os.path.join(root, f), dist))
            if rel not in used:
                print(rel)
PY
  )
  if [[ -n "$weesjes" ]]; then
    echo "    ⚠ CSV's die niet in het manifest staan (worden wél geüpload):"
    sed 's/^/      /' <<<"$weesjes"
  fi
else
  echo "  ! data/manifest.json ontbreekt" >&2; fout=1
fi

# --- Check 2: geen externe verwijzingen ---------------------------------------
# Het spel moet volledig zelfstandig draaien (serverless, localStorage).
echo "→ Externe verwijzingen zoeken…"
if grep -rIn --include='*.html' --include='*.js' --include='*.css' \
     -E "https?://(unpkg|cdn|cdnjs|jsdelivr|fonts\.googleapis)" "$DIST" 2>/dev/null; then
  echo "  ! externe CDN-verwijzing gevonden — het spel moet zonder internet werken" >&2
  fout=1
else
  echo "    ✓ geen CDN-verwijzingen"
fi

# --- Check 3: geen absolute paden ---------------------------------------------
# Het spel hangt onder /wordshooter/. Eén "/js/..." of "/data/..." zoekt vanaf de
# web-root en vindt daar niets. Relatief blijven is wat het spel verplaatsbaar
# houdt; dit is de check die dat bewaakt.
echo "→ Absolute paden zoeken…"
if grep -rIn --include='*.html' --include='*.js' --include='*.css' \
     -E "(src|href)=\"/|fetch\(['\"]/|from ['\"]/" "$DIST" 2>/dev/null; then
  echo "  ! absoluut pad gevonden — breekt zodra het spel in een submap staat" >&2
  fout=1
else
  echo "    ✓ alle paden zijn relatief"
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
  echo "✓ dist/ is klaar om te uploaden naar uitgeleerd.nl/wordshooter/ (HTTPS!)."
else
  echo "✗ Er ontbrak iets of er was een waarschuwing — controleer hierboven." >&2
  exit 1
fi
