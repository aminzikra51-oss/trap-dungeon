#!/bin/bash
# Sync the built public site (site/) into the independent release repo checkout (default ../dont-die-habibi). Does not push.
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"; DST="${1:-$SRC/../dont-die-habibi}"
[ -f "$SRC/site/index.html" ] || { echo "run python3 build.py first"; exit 1; }
mkdir -p "$DST"; find "$DST" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$SRC/site/." "$DST/"; cp "$SRC/release/README.md" "$SRC/release/LICENSE" "$DST/"
cd "$DST"; [ -d .git ] || git init -q -b main
git add -A; git status --short | head -20; echo "synced -> $DST"
