# ThumbSnare Run Log

## 2026-05-31 11:45 UTC

- UGC Ad Studio (rank 1) is deployed and in `production_smoke_passed` phase — no further active build needed.
- Promoted `youtube-thumbnail-studio` to active build per queue order.
- Created app directory structure: `src/app/`, `src/lib/`, `tests/`, `public/brand/`.
- Created state files: APP.md, STATE.json, TASKS.md, QA.md, DEPLOY.md, RUNLOG.md.
- Next: scaffold Next.js project, define types, build first vertical slice.

## 2026-05-31 13:45 UTC

**Focus:** Fix broken foundation (missing dependencies, broken build) and tighten prompt scaffolding.

- Reinstalled all dependencies to resolve missing dev deps (`autoprefixer`, `@types/node`, `typescript`, etc.).
- Resolved TypeScript issues: removed stale `.next` types cache, adjusted tsconfig include.
- Build passes successfully (`next build` completes with 6 static pages + 2 dynamic API routes).
- Lint passes (`tsc --noEmit` clean).
- Tests pass (4/4 Vitest tests).
- Tightened prompt scaffolding in `pollinations.ts`:
  - Added anti-generic word filter ("vibrant", "eye-catching", "stunning", etc.).
  - Added specific rules for YouTube 16:9, 150px mobile readability, exaggerated faces.
  - Prompt now requests a dynamic `abPlan` field tied to the generated concepts instead of a generic fallback.
- Added `abPlan` parsing fallback in `generateThumbnailConcepts()`.
- Connected BYOP app key via `.env.local` using the same publishable key as UGC Ad Studio.
- Exposed app key meta tag in `layout.tsx` for client-side BYOP login URL construction.
- App is now in `core_workflow_ready` phase.

**Next run priorities:**
1. Validate end-to-end generation with a real Pollinations user key.
2. Add more sample briefs across niches (gaming, finance, lifestyle).
3. Improve empty state and loading UX.
4. Prepare DEPLOY.md for Vercel deployment.
5. Create GitHub repo and connect to Vercel project.

## 2026-05-31 14:45 UTC

**Focus:** Fix critical architecture issue, UX overhaul, QA expansion.

- **Critical fix:** Rewired frontend to use `POST /api/generate/concepts` API route instead of calling `generateThumbnailConcepts()` directly from the browser. This prevents BYOP user key from being sent directly to Pollinations from client-side code, improving security and leveraging the existing server-side API route.
- **UX overhaul:**
  - Added shimmer-animated skeleton cards during loading (6 skeleton cards matching the grid layout).
  - Replaced simple empty state with guided experience: icon, heading, body text, and "load sample brief" link.
  - Added per-concept copy button (copies single concept to clipboard).
  - Added color swatch visualization for each concept's primary color (with CSS fallback for named colors).
  - Moved image prompt into a collapsible `<details>` section (less visual noise).
  - Added dropdown sample brief selector with niche tags (Marketing, Tech, Travel, Gaming, Finance, Family).
  - Added concept numbering (#1-6) with accent-colored badges.
  - Improved form layout: category + tone in a side-by-side field row, channel context + constraints side-by-side.
  - Added error banner with styled error display.
  - Improved BYOP panel with green dot glow on connected state.
  - A/B plan now prominently displayed above the grid with label.
  - "Load sample brief" button integrated into form header area.
- **Sample briefs expanded:** 3→6 briefs covering marketing, tech, travel, gaming, finance, family niches with `sampleBriefLabels` export.
- **Tests expanded:** 4→15 tests including brief validation, tone coverage, category diversity, concept shape verification, label-brief alignment, URL builder edge cases, and mock QA fixtures.
- **DEPLOY.md rewritten:** Comprehensive with architecture overview, env vars, build commands, deploy model, and pre-deploy checklist.
- **TASKS.md and QA.md updated** to reflect current progress.
- **Build, lint, typecheck, tests all passing** (15/15).

**Phase advanced:** `core_workflow_ready` → `ux_polish_and_qa`.

**Current blocker:** Real Pollinations user key needed for end-to-end validation. All infrastructure, UI, and tests are ready — the app is one validation run away from deploy readiness.

## 2026-05-31 15:45 UTC

**Focus:** Ship meaningful product improvements despite real-key blocker.

- **Fixed image URL builder:** Removed unsupported `nologo=true` param. Added `model` parameter. Added prompt truncation (1500-char cap) to prevent URL-length failures.
- **Live image model selector:** Wired existing `/api/pollinations/models` endpoint to a dropdown in the UI. Users can now switch image models per generation. Clears error states on model change.
- **Image error fallback UI:** Replaced `display:none` on broken images with a styled fallback card showing model name, error hint, and guidance (connect key or switch models).
- **Realistic mock mode:** Added `buildMockConcepts()` that produces tone-aware, structurally valid placeholder concepts for safe dev/demos without burning credits. Mock mode activates when `POLLINATIONS_ALLOW_MOCK=true` and no real key is present. 18/18 tests passing (added mock mode test).
- **Added app-level README.md:** Clean overview with stack, env vars, dev commands, and architecture notes.
- **Build, lint, typecheck, tests all passing** (18/18).

**Phase unchanged:** `ux_polish_and_qa`. Progress made on deploy readiness (docs, dev experience, robustness), but core end-to-end validation still blocked by real key requirement.

## 2026-05-31 16:45 UTC

**Focus:** Robustness + UX product features.

- **Fixed extractJson crash vulnerability:** Previously a non-JSON or empty response would crash the server with an unhandled `SyntaxError`. Now `extractJson` validates input, throws descriptive errors, and all paths are wrapped so API route returns a 500 with readable message instead of silently failing. (6 new tests added; 24/24 passing.)
- **Concept starring + shortlist:** Users can now star concepts. Starred count shown in a top bar with "Copy starred" and "Export starred JSON" actions. Enables creators to curate their favorite concepts before sharing or exporting.
- **Brief history persistence:** Every generated brief is saved to localStorage (max 10, deduplicated by title). Users can reload past briefs from a "History" dropdown. Eliminates re-entry friction for repeat workflows.
- **Image model persistence:** Selected image model is now stored in localStorage and restored on page load. Prevents model reset on refresh.
- **CSS additions:** Shortlist bar styling, star button states, responsive form header actions, history menu styling.
- **Build, lint, typecheck, tests all passing** (24/24).

**Next run priorities:**
1. Validate end-to-end generation with a real Pollinations user key (still the primary blocker).
2. Create GitHub repo and connect to Vercel.
3. Final QA pass once real key validates.

## 2026-05-31 17:45 UTC

**Focus:** Unblock broken foundation (API drift) + deploy prep.

- **Fixed Pollinations API endpoint drift:** Aligned all endpoints to the current unified `gen.pollinations.ai` API:
  - Text generation: `https://text.pollinations.ai/openai/chat/completions?key=` → `https://gen.pollinations.ai/openai/chat/completions` with `Authorization: Bearer {key}` header.
  - Image generation URLs: `https://image.pollinations.ai/prompt/` → `https://gen.pollinations.ai/image/`.
  - Model discovery: `https://image.pollinations.ai/models` → `https://gen.pollinations.ai/image/models`.
- **Tests updated:** Fixed URL builder test assertions to match new `image/` path. 24/24 tests passing.
- **Mock mode re-enabled:** `POLLINATIONS_ALLOW_MOCK=true` in `.env.local` for safe dev/demos without credits.
- **Build + lint clean:** Verified `next build` completes successfully with 6 static pages + 2 dynamic API routes.
- **Git repo initialized:** Created dedicated local repo on `main` branch. Ready for remote push once human provides GitHub account.
- **Live model list validated:** Fetched current image models from `gen.pollinations.ai/image/models` — received 30+ models including flux, gptimage, kontext, zimage, etc.
- **App quality state:** Core workflow scaffolded, UI polished, tests green, docs complete, API aligned. Blocked only by external dependencies (GitHub/Vercel account + real BYOP key for final smoke test).

**Phase advanced:** `ux_polish_and_qa` → `deploy_prep`.

**Blockers updated:**
1. Human-provided GitHub remote / Vercel account details needed to publish repo and create production project.
2. Real Pollinations user key needed for final end-to-end smoke test. Mock mode covers dev/demos.
