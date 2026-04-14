#!/bin/bash
# Lens Upgrade — thin wrapper around upgrade.py (one-stop safe upgrade)
#
# Delegates to scripts/upgrade.py for the real logic (Python stdlib only).
# Usage:
#   bash upgrade.sh                  # upgrade to latest
#   bash upgrade.sh --dry-run        # preview actions
#   bash upgrade.sh --yes            # skip confirmations
#   bash upgrade.sh --version v2.0.0 # pin a version
#
# Exit codes: see upgrade.py header.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PY_SCRIPT="$SCRIPT_DIR/upgrade.py"

if [ ! -f "$PY_SCRIPT" ]; then
  echo "ERROR: upgrade.py not found at $PY_SCRIPT" >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "ERROR: Python 3 is required but not found in PATH." >&2
  exit 1
fi

exec "$PY" "$PY_SCRIPT" "$@"
