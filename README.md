# ThumbSnare — YouTube Thumbnail Studio

Turn a video title and angle into 6 scroll-stopping thumbnail concept packs: image prompts, face expressions, text overlays, color psychology notes, and A/B test variants.

## What it does

1. Enter your video brief (title, angle, audience, tone).
2. App generates 6 structured thumbnail concepts via Pollinations AI.
3. Preview concept images generated on-demand.
4. Copy individual concepts or export the full pack as JSON.
5. Print a clean briefing sheet for your editor.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Vitest
- Pure CSS (no Tailwind)

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

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

## Development

```bash
npm install
npm run dev        # Dev server on port 3100
npm run lint       # TypeScript typecheck
npm test           # Vitest suite
npm run build      # Production build
```

## Architecture

- `POST /api/generate/concepts` — accepts `{ brief, clientKey }`, returns structured concepts + A/B plan.
- `GET /api/pollinations/models` — returns available Pollinations image models.
- BYOP auth: user connects via Pollinations OAuth at `auth.pollinations.ai`, token stored in `localStorage`.
- Image previews: built as Pollinations image URLs with user key appended via `?key=`.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for Vercel deployment steps.
