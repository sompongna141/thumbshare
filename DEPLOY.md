# ThumbSnare — Deploy Notes

## Status

**Deploy prep.** Phase: `deploy_prep`. Build + lint + tests passing.

## App overview

ThumbSnare is a YouTube thumbnail strategy workstation. Users enter a video brief and generate 3, 4, 6, or 8 structured concept packs with image prompts, face expressions, deterministic text overlays, color psychology, A/B test plans, and platform notes.

## Expected env vars

```bash
# Publishable app key for Pollinations BYOP — used as the OAuth client_id
# This is NOT a spend key.
NEXT_PUBLIC_POLLINATIONS_APP_KEY=pk_...

# Text model for concept generation (default: openai)
POLLINATIONS_TEXT_MODEL=openai

# Optional: server-side fallback API key (only for testing)
# POLLINATIONS_API_KEY=

# Development mock fallback — must be "false" in production
POLLINATIONS_ALLOW_MOCK=false
```

## Architecture

- **Frontend:** Next.js 15 App Router, React 19, pure CSS (no Tailwind)
- **API route:** `POST /api/generate/concepts` — accepts `{ brief, clientKey }`, returns `ConceptGenerationResult`
- **API route:** `GET /api/pollinations/models` — returns available Pollinations image models
- **API route:** `GET /api/config` — returns runtime config (mock enabled, app key presence) without leaking secrets
- `not-found.tsx` — friendly 404 page with redirect
- **BYOP auth:** User authenticates via Pollinations OAuth at `auth.pollinations.ai`, returns to `/studio` with `api_key=` in the URL hash, then the key is stored in localStorage and removed from the URL
- **Image previews:** Built client-side as Pollinations image URLs with `?key=` for auth
- **Export:** JSON download + clipboard copy + print-friendly CSS

## Build + test commands

```bash
npm install
npm run lint        # TypeScript typecheck via tsc --noEmit
npm test            # Vitest suite (111 tests)
npm run build       # Production build (Next.js standalone output)
npm run start       # Start on port 3100 (or set PORT)
npm run dev         # Dev server on port 3100
```

## Deployment model

- One Vercel project for this app only
- Separate Vercel account per app (per portfolio policy)
- Standalone output enabled (`output: "standalone"` in next.config.ts)
- No auto-deploy until human provides account details
- Env vars must be set in Vercel project settings before first deploy

## Pre-deploy checklist

- [x] Build passes
- [x] Lint/typecheck passes
- [x] Test suite passes (111/111)
- [x] BYOP auth flow UI present (connect → disconnect)
- [x] Export features work (JSON, clipboard, print)
- [x] Error states are handled gracefully
- [x] Security headers configured (nosniff, frame deny, referrer policy)
- [x] OG/Twitter meta tags present for social sharing
- [x] Image retry available on failed loads
- [x] Sample briefs cover multiple niches (6: marketing, tech, travel, gaming, finance, family)
- [x] No hidden owner spend key in production runtime
- [ ] Core workflow tested end-to-end with real BYOP key (external dependency)
- [x] GitHub repo pushed to remote (`https://github.com/sompongna141/thumbshare.git`)
- [ ] Vercel project created and connected to GitHub repo (requires human-provided account)
- [ ] POLLINATIONS_ALLOW_MOCK=false in production environment
