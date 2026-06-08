# ThumbSnare — YouTube Thumbnail Studio

Turn a video title and angle into 3, 4, 6, or 8 thumbnail concept packs: image prompts, face expressions, exact text overlays, color psychology notes, and A/B test variants.

## What it does

1. Enter your video brief (title, angle, audience, tone).
2. Choose post-processed text, generated-in-image text, or no text. Pick AI-recommended or predefined lettering styles.
3. App generates the selected number of structured concepts via Pollinations AI.
4. Preview images are generated on-demand; exact overlay lettering is rendered by the app.
5. Copy individual concepts or export the full pack as JSON or Markdown.
6. Print a clean briefing sheet for your editor.

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
- BYOP auth: user connects via Pollinations OAuth at `enter.pollinations.ai/authorize`, returns to `/studio`, and the token is stored in `localStorage`.
- Image previews: built as Pollinations image URLs with user key appended via `?key=`.
- Text modes: deterministic post-processing (recommended), generated-in-image (experimental), or text-free.
- Text styles: AI recommended, Impact, Editorial, Minimal, and Banner.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for Vercel deployment steps.
