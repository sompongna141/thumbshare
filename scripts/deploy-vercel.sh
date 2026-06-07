#!/usr/bin/env bash
# Thumbshare / ThumbSnare Vercel deploy script.
# Requires:
#   VERCEL_TOKEN   - Vercel personal access token (Bearer)
#   GITHUB_TOKEN   - GitHub PAT with `repo` scope on sompongna141/thumbshare
#                    (only needed if you want this script to push first)
#
# Idempotent. Re-running is safe; it will reuse the existing project and
# just trigger a fresh deploy.

set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN to your Vercel token}"

BASE="https://api.vercel.com"
AUTH="Authorization: Bearer $VERCEL_TOKEN"
CT="Content-Type: application/json"

PROJECT_NAME="${PROJECT_NAME:-thumbshare}"
REPO_SLUG="${REPO_SLUG:-sompongna141/thumbshare}"
ROOT_DIR="${ROOT_DIR:-projects/lab-apps/apps/youtube-thumbnail-studio}"

# Optional: push the latest local main to GitHub if GITHUB_TOKEN is provided
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  echo "→ Pushing local main to GitHub"
  git push "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_SLUG}.git" main
fi

echo "→ Looking up Vercel user"
USER_JSON=$(curl -fsS -H "$AUTH" "$BASE/v2/user")
USER_ID=$(echo "$USER_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["user"]["id"])')
echo "   user.id=$USER_ID"

# Get the project (create if missing)
echo "→ Looking up project '$PROJECT_NAME'"
PROJ_JSON=$(curl -fsS -H "$AUTH" "$BASE/v9/projects/$PROJECT_NAME" || echo "{}")

if [[ "$PROJ_JSON" == "{}" ]]; then
  echo "→ Creating project '$PROJECT_NAME' linked to GitHub repo $REPO_SLUG"
  PROJ_JSON=$(curl -fsS -H "$AUTH" -H "$CT" -X POST "$BASE/v10/projects" \
    -d "{
      \"name\": \"$PROJECT_NAME\",
      \"framework\": \"nextjs\",
      \"gitRepository\": { \"type\": \"github\", \"repo\": \"$REPO_SLUG\" },
      \"rootDirectory\": \"$ROOT_DIR\",
      \"buildCommand\": null,
      \"installCommand\": null,
      \"outputDirectory\": null
    }")
fi

PROJ_ID=$(echo "$PROJ_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "   project.id=$PROJ_ID"

# Environment variables (Production + Preview + Development)
upsert_env() {
  local KEY="$1" VALUE="$2" TARGETS="$3"
  echo "→ env $KEY [$TARGETS]"
  curl -fsS -H "$AUTH" -H "$CT" -X POST "$BASE/v10/projects/$PROJ_ID/env" \
    -d "$(python3 -c "import json,sys;print(json.dumps({'key':sys.argv[1],'value':sys.argv[2],'type':'plain','target':sys.argv[3].split(',')}))" "$KEY" "$VALUE" "$TARGETS")" >/dev/null
}

upsert_env NEXT_PUBLIC_POLLINATIONS_APP_KEY "pk_4vwdCAbLf8wWIOJE" "production,preview,development"
upsert_env POLLINATIONS_TEXT_MODEL "openai" "production,preview,development"
upsert_env POLLINATIONS_ALLOW_MOCK "false" "production,preview,development"

# Trigger a deployment from main
echo "→ Triggering deployment from main"
DEPLOY_JSON=$(curl -fsS -H "$AUTH" -H "$CT" -X POST "$BASE/v13/deployments" \
  -d "{
    \"name\": \"$PROJECT_NAME\",
    \"target\": \"production\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repoId\": \"$REPO_SLUG\",
      \"ref\": \"main\"
    },
    \"projectSettings\": { \"rootDirectory\": \"$ROOT_DIR\" }
  }")

DEPLOY_URL=$(echo "$DEPLOY_JSON" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("url") or d.get("alias") or d.get("id"))')
echo "✓ Deployment: $DEPLOY_URL"
echo "$DEPLOY_URL" > .vercel-last-deploy-url
