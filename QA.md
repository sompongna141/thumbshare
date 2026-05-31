# ThumbSnare QA Checklist

## Core workflow

- [x] user can log in with Pollinations before generation (BYOP OAuth flow)
- [x] user can submit a video brief without confusion
- [x] concept generator returns 6 structured concepts (mock mode validated)
- [x] each concept has: image prompt, face expression, text overlay, color notes, A/B hint (mock mode validated)
- [x] image preview URLs built correctly via unified gen.pollinations.ai/image/ endpoint
- [x] user can regenerate a single concept (mock mode validated)
- [x] export view includes all concepts + color notes + A/B plan
- [x] concept starring + shortlist works (copy starred, export starred JSON)
- [x] brief history persistence works (save, reload, deduplicate, max 10)
- [x] image model persistence works (save, restore on reload)

## UX

- [x] clear empty state with guidance and sample brief link
- [x] loading states are obvious (skeleton cards with shimmer animation)
- [x] generation failures are recoverable (error banner with message)
- [x] output layout is readable (structured card layout with sections)
- [x] print/export layout is clean (print CSS hides controls)
- [x] sample brief selector with niche tags
- [x] image error fallback UI shows helpful guidance instead of blank space
- [x] live image model selector with persistence

## Technical

- [x] app builds successfully
- [x] BYOP key path is wired through server-side API route (not client-side)
- [x] lint passes (tsc --noEmit clean)
- [x] typecheck passes (via build)
- [x] test suite passes (29/29 Vitest tests)
- [x] env handling is documented (.env.example + DEPLOY.md)
- [x] prompt scaffolding has anti-generic word filter
- [x] A/B plan is dynamically generated, not hardcoded fallback
- [x] Pollinations API endpoints aligned to current unified gen.pollinations.ai URLs
- [x] extractJson handles malformed/empty responses gracefully with descriptive errors

## Product quality

- [x] output is better than raw prompt dumping (mock mode produces structured, tone-aware concepts)
- [x] workflow feels like a creator tool, not a demo (starring, history, model selection, export)
- [x] multiple niches tested (6 sample briefs: marketing, tech, travel, gaming, finance, family)
- [x] no-key blocking works server-side (API route returns 401 without clientKey)

## Mock mode validation (completed)

- [x] Mock mode returns 6 structurally valid concepts without real key
- [x] Mock mode A/B plan is tailored to tone and brief
- [x] Mock mode activates when `POLLINATIONS_ALLOW_MOCK=true` and no key present
- [x] Mock mode tone reflected in concept names
- [x] Mock mode color swatches are consistent across 6 concepts
- [x] Mock mode text overlays have placement and text for all concepts
- [x] Mock mode platform notes and AB hints present for all concepts

## Remaining validation items

These require a real Pollinations user key and/or production deployment to confirm:

1. End-to-end concept generation returns valid JSON with 6 concepts via live LLM
2. Image preview URLs load successfully with authenticated key on gen.pollinations.ai/image/
3. Per-concept regeneration replaces the targeted concept via live API (prompt injection added, needs live validation)
4. Export (JSON + clipboard + print) produces correct output in production
5. Generated prompt quality meets the "better than raw prompting" bar with live LLM
6. Live image model switching works across different model names from live model list
7. BYOP auth flow works in production (OAuth callback, key storage, disconnect)
8. Production env has POLLINATIONS_ALLOW_MOCK=false
9. /api/config route returns correct runtime config without leaking secrets
