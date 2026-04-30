#!/bin/bash
# Sync Domino Brain from OneDrive (canonical source) to repo.
# One-way: OneDrive -> repo. Triggered by launchd LaunchAgent or manually.

set -euo pipefail

SRC="/Users/andreabosso/Library/CloudStorage/OneDrive-DominoSRL/Documenti/Claude/Projects/Domino Brain/"
DST="/Users/andreabosso/Code/domino-prospect-engine/brain/"

[ -d "$SRC" ] || { echo "ERROR: source not found: $SRC" >&2; exit 1; }
[ -d "$DST" ] || { echo "ERROR: destination not found: $DST" >&2; exit 1; }

# Sync .md only. Exclude CLAUDE.md (Claude Desktop project context, not brain content).
# --delete mirrors OneDrive: files removed there get removed here.
rsync -rltv --delete \
  --exclude='CLAUDE.md' \
  --include='*.md' \
  --exclude='*' \
  "$SRC" "$DST"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] sync-brain completed"
