#!/bin/bash
# Lens Upgrade — 마켓플레이스 동기화 + 캐시 삭제 + 재설치
# Usage: bash upgrade.sh

set -e

MARKETPLACE_DIR="$HOME/.claude/plugins/marketplaces/CreetaCorp"
CACHE_DIR="$HOME/.claude/plugins/cache/CreetaCorp/lens"
REPO_URL="https://github.com/livevil7/creeta-lens.git"

echo "=== Lens Upgrade ==="

# 1. 마켓플레이스 업데이트
if [ -d "$MARKETPLACE_DIR" ]; then
  echo "[1/3] Updating marketplace..."
  cd "$MARKETPLACE_DIR"
  git remote set-url origin "$REPO_URL" 2>/dev/null
  git fetch origin && git reset --hard origin/master
else
  echo "[1/3] Cloning marketplace..."
  git clone "$REPO_URL" "$MARKETPLACE_DIR"
fi

# 2. 캐시 삭제
echo "[2/3] Clearing cache..."
rm -rf "$CACHE_DIR"

# 3. 재설치
echo "[3/3] Installing..."
claude plugin install lens@CreetaCorp

echo ""
echo "=== Done ==="
claude plugin list 2>&1 | grep -A3 "lens"
