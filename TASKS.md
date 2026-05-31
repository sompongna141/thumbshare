# ThumbSnare Tasks

## Phase 0 — Foundation ✅

- [x] create app directory and state files
- [x] choose stack and scaffold app (Next.js 15 + TypeScript + Vitest)
- [x] define environment variable contract
- [x] create shared types for brief, concepts, color notes, export packet
- [x] create basic layout and page shells

## Phase 1 — Core input flow ✅

- [x] build video title + angle intake form
- [x] add local draft persistence (via sample brief loader)
- [x] validate required fields
- [x] add example seed brief for testing (3 → 6 sample briefs across niches)

## Phase 2 — Concept generation ✅

- [x] implement thumbnail concept generator (6 concepts)
- [x] structure output: image prompt, face expression, text overlay, color notes, A/B hint
- [x] add anti-generic prompt scaffolding (no "vibrant", no "eye-catching")
- [x] wire API route (`POST /api/generate/concepts`)
- [x] add A/B test plan generation (dynamic, tied to concepts)

## Phase 3 — Image preview ✅

- [x] build Pollinations image URL builder for each concept
- [x] show concept cards with generated image previews
- [x] allow per-concept regeneration

## Phase 4 — Export / packaging ✅

- [x] build concept pack summary view
- [x] export as print-friendly format (print CSS)
- [x] export as JSON download
- [x] copy-to-clipboard for individual concepts
- [x] copy-to-clipboard for all concepts

## Phase 5 — Auth & QA

- [x] add Pollinations BYOP login flow (OAuth at auth.pollinations.ai)
- [x] add empty / loading / error states (skeleton loader, error banner, empty state)
- [x] add sample briefs across niches (marketing, tech, travel, gaming, finance, family)
- [x] tighten prompt scaffolding (anti-generic word filter, YouTube-specific rules)
- [x] add lightweight automated tests (15 tests passing)
- [x] add mock generation QA fixtures

## Phase 6 — Deploy readiness

- [ ] validate end-to-end generation with real BYOP user key
- [x] write README.md for the app
- [x] verify build / lint / typecheck / tests pass (18/18 passing)
- [x] write DEPLOY.md with env and Vercel steps
- [ ] create GitHub repo and connect to Vercel
- [ ] mark deploy readiness in state files

## Phase 6b — Robustness & dev experience

- [x] fix image URL builder (remove nologo, add model param, prompt truncation)
- [x] wire live image model selector using /api/pollinations/models
- [x] add image error fallback UI (replace display:none with helpful fallback card)
- [x] add realistic mock mode for safe dev testing without credits
- [x] add test for mock mode generation
