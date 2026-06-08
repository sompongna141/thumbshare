#!/usr/bin/env bash
# Push the local main branch to GitHub. Vercel will auto-deploy from the
# GitHub integration once the commit lands on main.
#
# Requires: a GitHub credential configured for sompongna141/thumbshare
# (HTTPS PAT, SSH key, or `gh auth login`).
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

if ! git show-ref --verify --quiet "refs/heads/$BRANCH" 2>/dev/null; then
  echo "✗ Branch '$BRANCH' does not exist locally." >&2
  exit 1
fi

echo "→ Pushing $BRANCH to $REMOTE"
git push "$REMOTE" "$BRANCH"
echo "✓ Pushed. Vercel will auto-deploy within ~1-2 minutes."
echo "  Watch: https://vercel.com/sompong-s-projects/thumbshare"
