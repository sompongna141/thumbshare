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
- [x] add lightweight automated tests (24/24 Vitest tests passing)
- [x] add mock generation QA fixtures

## Phase 6 — Robustness & dev experience

- [x] fix image URL builder (remove nologo, add model param, prompt truncation)
- [x] wire live image model selector using /api/pollinations/models
- [x] add image error fallback UI (replace display:none with helpful fallback card)
- [x] add realistic mock mode for safe dev testing without credits
- [x] fix extractJson crash vulnerability (descriptive errors, API route handles gracefully)
- [x] add concept starring + shortlist with copy/export actions
- [x] add brief history persistence (localStorage, max 10, deduplicated)
- [x] add image model persistence (localStorage)
- [x] align Pollinations API to unified gen.pollinations.ai endpoints (text + image + models)

## Phase 7 — Deploy readiness

- [x] write README.md for the app
- [x] verify build / lint / typecheck / tests pass (29/29 passing)
- [x] write DEPLOY.md with env and Vercel steps
- [x] initialize dedicated git repo (main branch)
- [x] add /api/config route for runtime config (mock enabled, app key)
- [x] fix stale .next/types tsconfig noise
- [x] add per-concept regeneration prompt injection
- [x] add mock-mode QA scenarios
- [x] refactor studio page into components (TopBar, StepIndicator, HookStep, AudienceStep, DirectionStep, ResultsStep, ConceptCard, ExportToolbar, SampleMenu, HistoryMenu, ManualKeyBand)
- [x] extract useThumbnailStudio hook for all state, effects, API, export logic
- [x] add text overlay toggle (with-text / no-text) threaded through prompt builder and mock generator
- [x] persist wizard draft (step + brief) to localStorage and restore on reload
- [x] persist shortlist to localStorage and restore on reload
- [x] add comfortable / compact density toggle for results grid with persistence
- [x] add brief completion progress bar on Step 1
- [x] add error banner with inline Retry button on results
- [x] add per-entry history delete and Clear all
- [x] close dropdown menus on click-outside and Escape key
- [x] print CSS hides new density toggle and export spacer
- [ ] push git repo to GitHub remote (requires human-provided token/account)
- [ ] create Vercel project and connect to GitHub repo (requires human-provided account)
- [ ] validate end-to-end generation with real BYOP user key (external dependency)
- [ ] set POLLINATIONS_ALLOW_MOCK=false in production environment
- [ ] mark deploy readiness in state files
