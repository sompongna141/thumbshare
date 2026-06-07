# ThumbSnare QA Checklist

## Core workflow

- [x] user can log in with Pollinations before generation (BYOP OAuth flow)
- [x] user can submit a video brief without confusion
- [x] concept generator returns the selected 3, 4, 6, or 8 structured concepts (mock mode validated)
- [x] each concept has: image prompt, face expression, text overlay, color notes, A/B hint (mock mode validated)
- [x] image preview URLs built correctly via image.pollinations.ai/prompt/ endpoint (migrated from gen.pollinations.ai which returned 401)
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
- [x] live image model selector moved to Direction with persistence
- [x] image model auto-fallback chain (flux → kontext → flux-schnell → turbo → sdxl) on load failure

## Technical

- [x] app builds successfully
- [x] BYOP key path is wired through server-side API route (not client-side)
- [x] lint passes (tsc --noEmit clean)
- [x] typecheck passes (via build)
- [x] test suite passes (111/111 Vitest tests)
- [x] env handling is documented (.env.example + DEPLOY.md)
- [x] prompt scaffolding has anti-generic word filter
- [x] A/B plan is dynamically generated with specific concept pairings and visual variable differences
- [x] prompt scaffolding includes anti-AI-slop rules, visual hierarchy, face expression taxonomy, typography rules, and YouTube CTR best practices
- [x] Pollinations API endpoints aligned to current working URLs (text.pollinations.ai, image.pollinations.ai)
- [x] extractJson handles fenced JSON, surrounding prose, nested payloads, trailing commas, malformed, empty, and truncated responses
- [x] generation retries once with a shorter structured prompt when the model returns incomplete JSON
- [x] with-text previews render exact overlay copy and placement in the UI instead of relying on image-model spelling
- [x] text mode supports post-process, generated-in-image, and no-text paths
- [x] text styles support AI recommended, Impact, Editorial, Minimal, and Banner treatments
- [x] Pollinations OAuth redirects back to `/studio`, where the returned key hash is consumed and removed from the URL

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

1. End-to-end concept generation returns the selected concept count via live LLM
2. Image preview URLs load successfully with authenticated key on gen.pollinations.ai/image/
3. Per-concept regeneration replaces the targeted concept via live API (prompt injection added, needs live validation)
4. Export (JSON + clipboard + print + markdown) produces correct output in production
5. Markdown export produces clean, well-structured output that a designer can read
6. Generated prompt quality meets the "better than raw prompting" bar with live LLM
7. Live image model switching works across different model names from live model list
8. BYOP auth flow works in production (OAuth callback, key storage, disconnect)
9. Production env has POLLINATIONS_ALLOW_MOCK=false
10. /api/config route returns correct runtime config without leaking secrets
11. Image model auto-fallback works across all 5 models in preference chain with real API
12. Prompt quality improvements (anti-AI-slop, visual hierarchy, face taxonomy, typography, CTR rules) produce measurably better live output than previous scaffolding

## Refactor + persistence (completed)

- [x] Studio page split into focused components (TopBar, StepIndicator, HookStep, AudienceStep, DirectionStep, ResultsStep, ConceptCard, ExportToolbar, SampleMenu, HistoryMenu, ManualKeyBand)
- [x] useThumbnailStudio hook owns all state, effects, API, export logic
- [x] Wizard draft (step + brief) persisted to localStorage and restored on reload
- [x] Shortlist persisted to localStorage and restored on reload
- [x] Comfortable / Compact density toggle with localStorage persistence
- [x] Brief completion progress bar on Step 1
- [x] Text rendering modes live in Step 3 Direction and are threaded through prompts, previews, exports, and mock generation
- [x] Concept count selector (3 / 4 / 6 / 8) on Step 3 Direction
- [x] Image model selector moved from the top bar to Step 3 Direction
- [x] Error banner with inline Retry button
- [x] History per-entry delete and Clear all
- [x] Dropdown menus close on click-outside and Escape
- [x] Print CSS hides density toggle and export spacer
