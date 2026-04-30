#!/bin/bash
# Sync Domino Brain from OneDrive (canonical source) to repo + GitHub.
# One-way: OneDrive -> repo. Auto-commits brain/ changes and pushes to origin/main.

set -euo pipefail

SRC="/Users/andreabosso/Library/CloudStorage/OneDrive-DominoSRL/Documenti/Claude/Projects/Domino Brain/"
DST="/Users/andreabosso/Code/domino-prospect-engine/brain/"
REPO="/Users/andreabosso/Code/domino-prospect-engine"

# launchd's PATH is minimal; ensure git/rsync are reachable
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] sync-brain:"

[ -d "$SRC" ] || { echo "$LOG_PREFIX ERROR source not found: $SRC" >&2; exit 1; }
[ -d "$DST" ] || { echo "$LOG_PREFIX ERROR destination not found: $DST" >&2; exit 1; }

# Sync .md only. Exclude CLAUDE.md (Claude Desktop project context, not brain content).
# --delete mirrors OneDrive: files removed there get removed here.
rsync -rltv --delete \
  --exclude='CLAUDE.md' \
  --include='*.md' \
  --exclude='*' \
  "$SRC" "$DST"

cd "$REPO"

if [ -z "$(git status --porcelain brain/)" ]; then
  echo "$LOG_PREFIX no brain changes, done"
  exit 0
fi

git add brain/
git commit -m "Auto-sync brain from OneDrive ($(date '+%Y-%m-%d %H:%M'))"
echo "$LOG_PREFIX committed brain changes"

if git push origin main; then
  echo "$LOG_PREFIX pushed to origin/main"
else
  echo "$LOG_PREFIX push FAILED, commit is local only (will retry on next sync run with new content)" >&2
fi
