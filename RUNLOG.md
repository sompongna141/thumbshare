
## 2026-06-01 05:45 UTC

**Focus:** UX polish sprint — workflow step tracking + model filtering robustness.

- **Workflow step tracker:** Added `WORKFLOW_STEPS` constant (Spark → Market → Direction) with step labels, titles, and descriptions. `currentStep` state tracks where the user is. Form validation errors now auto-navigate to the relevant step (missing title/angle → Spark, missing auth → Direction).
- **Brief completion indicator:** Added `briefCompletion` useMemo that counts filled fields (videoTitle, angle, topicCategory, targetAudience, channelContext, constraints, tone) and reports percent complete. Provides user-facing progress signal.
- **Model filtering hardening:** `/api/pollinations/models` now filters out `paid_only` models and video models, keeping only free image-generation models. Same logic synced to `pollinations-models.ts` client-side fetcher. Prevents users from selecting models that will 401 or return video.
- **Build cache cleanup:** `.next` directory had root-owned stale artifacts from prior dev server. Renamed to `.next.bak`, committed, then amended commit to exclude backup directory. Build now clean.
- **Tests:** 59/59 passing. Lint clean.
- **Git commit:** `7e2fb5b` (amended to `beca067` after removing backup dir).

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-06-01 03:45 UTC

**Focus:** Markdown export feature + commit previous uncommitted changes.

- **Committed prior run changes:** SVG placeholder on image failure, generation timeout protection (30s), QA scenarios 7 & 8, 50/50 tests. Committed as `f732545`.
- **Markdown export:** Added `buildMarkdownPacket()` in `src/lib/export.ts` that produces a clean, structured Markdown document with brief metadata, all concepts (face expression, text overlay, color psychology, A/B hint, platform notes, image prompt in code block), and A/B test plan. Supports `starred` filter for starred-only export.
- **UI wiring:** Added `Export Markdown` and `Export starred Markdown` buttons alongside existing JSON, print, and copy actions.
- **Refactored copy functions:** `handleCopyAll` and `handleCopyStarred` now use `buildMarkdownPacket()` so clipboard output matches the downloaded Markdown, ensuring consistency.
- **Tests:** Added `tests/export.test.ts` with 9 tests covering header rendering, all-concepts output, starred filtering, zero-starred edge case, markdown escaping, image prompt code blocks, optional field omission, A/B plan, and footer. 59/59 tests passing.
- **QA:** Added Scenario 9 (markdown export) to `QA-SCENARIOS.md`. Updated `QA.md` test count to 59/59 and added Markdown export to remaining validation items.
- **Build + lint:** Clean (tsc --noEmit, Next.js standalone output).
- **Git commits:** `f732545` (prior), `9ab5614` (markdown feature), `901c1bf` (refactor copy to use markdown builder).

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-06-01 02:52 UTC

**Focus:** SVG placeholder fallback for failed image loads + generation timeout protection.

- **Styled SVG placeholder on image failure:** Added `generatePlaceholderSvg(concept)` that creates a `data:image/svg+xml` URL with the concept name, text overlay, face expression, and concept color on a dark card. Added "Generate placeholder" button in the image fallback UI. Placeholder shows up as an actual image within the card layout rather than a blank or generic icon. Added `useEffect` to reset placeholder state when the concept imagePrompt changes. 8 new tests (50/50 passing).
- **Generation timeout protection:** Added 30s `AbortController` timeout to `pollinationsText()` and wired it through `generateThumbnailConcepts()`. API route wraps generation in a 35s timeout with `clearTimeout`/`AbortController`. Returns HTTP 504 with a descriptive "Generation timed out. Please retry in a moment." error instead of a hanging spinner.
- **QA scenarios expanded:** Added Scenario 7 (placeholder fallback) and Scenario 8 (timeout handling) to `QA-SCENARIOS.md`.
- **Build + lint:** Clean (tsc --noEmit, Next.js standalone output).
- **Tests:** 50/50 passing.

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-06-01 01:45 UTC

**Focus:** Critical Pollinations API endpoint migration — gen.pollinations.ai was returning 404 (text) and 401 (image).

- **Investigated broken API endpoints:**
  - `gen.pollinations.ai/openai/chat/completions` → 404 (not found)
  - `gen.pollinations.ai/image/models` → 401 (unauthorized)
  - `gen.pollinations.ai/image/{prompt}` → 401
  - `text.pollinations.ai/openai/chat/completions` → 200 OK
  - `image.pollinations.ai/prompt/{prompt}` → 200 OK (returns image binary)
  - `image.pollinations.ai/models` → 200 OK (returns `["sana"]`)

- **Migrated all endpoints to current working URLs:**
  - Text generation: `https://gen.pollinations.ai/openai/chat/completions` → `https://text.pollinations.ai/openai/chat/completions` (in `src/lib/pollinations.ts`)
  - Image generation: `https://gen.pollinations.ai/image/` → `https://image.pollinations.ai/prompt/` (in `src/lib/pollinations.ts`)
  - Image models: `https://gen.pollinations.ai/image/models` → `https://image.pollinations.ai/models` (in API route + model fetch lib)

- **Updated default model to sana:**
  - Current model list from Pollinations API: `["sana"]` (previously included flux, turbo, sdxl)
  - Default changed from `"flux"` to `"sana"` in URL builder, React state, and tests
  - Added `sana` to `PREFERRED_MODEL_ORDER` in model-fallback.ts

- **Refactored model fallback logic to be dynamic:**
  - `getNextFallbackModel(current, available)` now accepts available model list from live API
  - `pickDefaultModel(available, saved?)` selects best available model by preference order
  - Page.tsx uses `pickDefaultModel(imageModels.map(m=>m.name), savedModel)` on mount
  - `handleImageError` passes live available model list to fallback logic

- **Updated tests (42/42 passing):**
  - `buildThumbnailImageUrl`: updated `model=flux` → `model=sana`, fixed decode path from `/image/` to `/prompt/`
  - Model fallback: updated `returns null when no more fallbacks` for `sana` (last in list), added dynamic available-list tests, added `pickDefaultModel` tests

- **Build + lint:** Clean (tsc --noEmit, Next.js standalone output)

- **Git commit:** `29f0299`

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-06-01 00:45 UTC

**Focus:** Prompt scaffolding overhaul + image model auto-fallback + model fallback tests.

- **Prompt scaffolding overhaul:** Added anti-AI-slop rules (no "4K", "unreal engine", "octane render", "highly detailed", "masterpiece"). Added visual hierarchy rules (foreground face 60–70%, mid-ground prop, background flat color, 30% negative space). Added face expression taxonomy mapped to each tone (dramatic, funny, educational, controversial, emotional, curiosity, fear, aspirational). Added typography rules (3–5 words max, bold sans-serif, avoid bottom-right quadrant due to YouTube timestamp overlay). Added YouTube-specific CTR best practices (0.5s judgment, rule of thirds, close-up vs prop context, text-heavy vs text-light A/B). Tightened A/B plan instructions to require specific concept pairings and exact visual variable differences.
- **Image model auto-fallback:** When an image fails to load, the UI transparently retries with the next model in the preference chain: flux → kontext → flux-schnell → turbo → sdxl. Only shows the fallback card after exhausting all models. User "Retry" button resets the fallback chain. Added `src/lib/model-fallback.ts` with pure functions for preference ordering.
- **Model picker default:** Now sorts available models by preference index so `flux` is default if available, regardless of API response order.
- **Tests:** +5 new tests for fallback logic (next model, null at end, unknown model, preferred index, sort order). 36/36 passing.
- **Build + lint:** Clean (tsc --noEmit clean, Next.js standalone output).
- **Git commit:** `2e11929`.

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-05-31 23:45 UTC

**Focus:** Fix image retry defect + improve mock concept naming + expand test coverage.

- **Fixed image retry bug:** The "Retry image" button in the image fallback UI was clearing the error state but re-using the same memoized image URL because `buildThumbnailImageUrl` had no retry parameter. Browser cache would return the same broken image. Fixed by adding `retryCount` parameter to `buildThumbnailImageUrl` that increments the seed by 1,000,000 per retry. `ConceptCard` now tracks local `retryCount` state and passes it into the URL builder. Retry now actually fetches a different image.
- **Improved mock mode concept names:** Previously mock concepts were named generically (`"Dramatic Close-Up 1"` ... `6`). Now they derive from the first 2 significant words of the video title combined with a thumbnail-style suffix (`Face Drop`, `Split Shock`, `Text Punch`, `Color Pop`, `Prop Reveal`, `Angle Flip`). This makes mock demos feel more realistic and title-aware.
- **Added tests:**
  - `changes seed on retry` — validates `retryCount` increases seed by 1,000,000
  - `key param is properly URL-encoded` — validates special characters in keys are encoded
  - Updated mock-mode concept name test to assert title-keyword derivation instead of stale tone-based assertion
- **Test count:** 29 → 31. All 31 passing.
- **Build + lint:** Clean (Next.js standalone output, tsc --noEmit clean).
- **Git commit:** `8098b3f`.

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-05-31 21:45 UTC

**Focus:** Fix recurring tsconfig lint noise + commit + state sync.

- **Fixed tsconfig stale include (again):** `.next/types/**/*.ts` re-appeared in `tsconfig.json` include (likely regenerated by a prior build), causing 6 TS6053 lint errors on `tsc --noEmit`. Removed the line permanently. Build and lint now fully clean.
- **Verified test suite:** 29/29 Vitest tests passing.
- **Verified production build:** `npm run build` completes successfully with standalone output.
- **Git commit:** `ff5788a` with tsconfig fix, DEPLOY.md checklist update, STATE.json sync, and RUNLOG.md entry.

**Build, lint, 29/29 tests passing.**

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-05-31 19:45 UTC

**Focus:** Fix image error bug + add retry UI + security headers + OG meta + 404 page.

- **Fixed image error state on regeneration:** `imgErrorMap` was not cleared when regenerating a concept, so a previously failed image would stay in the fallback state even after regeneration produced a new image prompt. Fixed by adding `setImgErrorMap((prev) => ({ ...prev, [id]: false }))` at the start of `handleRegenerate`.
- **Added image retry button:** When an image fails to load (model unavailable, network blip), the fallback card now shows a "Retry image" button that clears the error state and re-attempts the same URL.
- **Security headers in next.config.ts:** Added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` via Next.js headers config.
- **Unoptimized images config:** Added `images: { unoptimized: true }` to avoid Next.js Image Optimization dependency issues on Vercel free tier.
- **Open Graph + Twitter meta tags:** Added `openGraph` and `twitter` metadata objects in `layout.tsx` for better social sharing.
- **404 page:** Created `not-found.tsx` with a friendly message and link back to the app.
- **Git commit:** `da28abc`

**Build, lint, 29/29 tests passing.**

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.

---

## 2026-05-31 18:45 UTC

**Focus:** Unblock broken foundation (stale tsconfig lint noise) + deploy polish + QA coverage expansion.

- **Fixed persistent tsconfig lint errors:** `.next/types/**/*.ts` include in `tsconfig.json` was referencing stale generated files from an older build cache, causing `TS6053` errors on every `tsc --noEmit`. Removed `.next/types/**/*.ts` from `tsconfig.json` include. Build + lint now fully clean.
- **Added `/api/config` route:** Lightweight runtime config endpoint exposing `mockEnabled` and `appKeyPresent` (no secrets leaked). Enables future UI features to adapt based on server config without rebuilding.
- **Per-concept regeneration prompt injection:** Added `makeRegenBrief()` that appends a `[REGENERATE]` instruction with the target concept ID to the brief constraints. This increases the chance the LLM produces a meaningfully different concept when regenerating a single slot.
- **Wrote QA-SCENARIOS.md:** 6 end-to-end manual test scenarios covering mock mode workflow, BYOP connect/disconnect, empty/error states, image model switching, brief history persistence, and per-concept copy. Provides a repeatable validation playbook for human QA before deploy.
- **Expanded mock-mode tests:** 24 → 29 tests. Added coverage for tone-in-concept-names, color-swatches, text-overlay placement, platform notes, and AB variant hints across all mock concepts.
- **Updated DEPLOY.md and QA.md:** Test count bumped to 29. Added `/api/config` to architecture docs. Added mock-mode checklist items.
- **Git commit:** All changes committed to `main` as `29d9edb`.

**Build, lint, typecheck, tests all passing** (29/29).

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test. Mock mode covers dev/demos.

---

## 2026-05-31 17:45 UTC

**Focus:** Unblock broken foundation + deploy prep.

- **Fixed stale tsconfig lint noise:** `.next/types/**/*.ts` include in `tsconfig.json` referencing stale build cache files caused persistent `TS6053` errors. Removed.
- **Fixed Pollinations API endpoints:** Migrated all endpoints to unified `gen.pollinations.ai` for text, image, and models.
- **Updated auth header:** Switched from `x-api-key` to `Bearer` token format for Pollinations text API.
- **Re-enabled mock mode:** Safe dev testing without credits.
- **Added `/api/config` route:** Runtime config for mock enable/disable, app key presence.
- **24/24 tests passing.**
- **Git commit:** `da28abc`

**Phase advanced:** `deploy_prep`.

**Blockers:**
1. Need human-provided GitHub remote / Vercel account details to publish repo and create production project.
2. Need real Pollinations user key for final end-to-end validation.

---

## 2026-05-31 15:52 UTC

**Focus:** Robustness sprint.

- **Fixed image URL builder:** Removed unsupported `nologo` param, added `model` param + prompt truncation to prevent 414.
- **Wired live image model selector:** Dropdown populated from `/api/pollinations/models`.
- **Added image error fallback UI:** Replaces `display:none` blank with helpful card containing retry button.
- **Added realistic mock mode:** Returns tone-aware concepts for safe dev testing.
- **Wrote README.md:** App overview, stack, BYOP auth, env vars, build/test commands.
- **18/18 tests passing.**

**Phase unchanged:** `ux_polish_and_qa`.

**Blocker:** Need real Pollinations user key for end-to-end validation.

---

## 2026-05-31 14:50 UTC

**Focus:** UX overhaul.

- **Critical fix:** Client-side Pollinations calls now route through server API route to avoid CORS and key exposure.
- **Expanded sample briefs:** 3 → 6 (marketing, tech, travel, gaming, finance, family).
- **Tests expanded:** 4 → 15.
- **Skeleton loader, per-concept copy, color swatches, sample brief dropdown, collapsible prompts added.**
- **Phase advanced:** `ux_polish_and_qa`.

**Blocked by:** Need real Pollinations user key for end-to-end validation.

---

## 2026-05-31 13:52 UTC

**Focus:** Foundation fix + core workflow scaffold.

- **Foundation fixed:** Build + lint + tests passing.
- **Core workflow scaffolded:** Brief intake → concept generation → image preview → BYOP auth → export.
- **Prompt scaffolding tightened:** Anti-generic rules + dynamic A/B plan.
- **Phase:** `core_workflow_complete`.

**Blocked by:** End-to-end generation validation needs real Pollinations key.

---

## 2026-06-01 18:45 UTC

**Focus:** Homepage build — moved tool workspace to `/studio`, created premium landing page at `/`.

- **Homepage-first compliance:** Per CRON_PROMPT v2 homepage-first rule, the existing single-page tool UI (page.tsx ~1010 lines) was moved to `/studio`. A new `/` landing page was built.
- **Landing page features:**
  - Sticky nav with brand logo and "Open Studio" CTA
  - Hero section: clear value prop ("Thumbnails that stop the scroll"), subtitle, primary CTA, and CSS-only abstract thumbnail card composition (no images to load)
  - Four-step workflow section (Hook, Audience, Direction, Concepts)
  - Feature grid covering Image Prompt, Face Expression, Text Overlay, Color Psychology, A/B Variant, Export Ready
  - Final CTA section with link to studio
  - Footer with "Built on Pollinations. Developer earnings enabled."
  - Responsive layouts: 2-column hero collapses to 1 column below 900px, visual hidden below 640px, grids adapt to 2-col then 1-col
  - Reduced-motion support for all animated elements
- **Impeccable skill compliance:**
  - Contrast: all text uses existing CSS variables (`--text`, `--text-secondary`, `--muted`) against dark background (`--bg`, `--bg-2`), ratios exceed 4.5:1
  - Typography: single font stack (system sans-serif), hero clamp max 3.5rem, letter-spacing -0.04em on hero title, -0.03em on section titles
  - Layout: grid for 2D sections, flex for 1D rows, varied spacing (space-3xl / space-2xl / space-xl rhythm)
  - Motion: 150-250ms transitions only, reduced-motion removes transitions entirely
  - Copy: every word earns place — no buzzwords, CTA is verb-first ("Start creating", "Open ThumbSnare Studio")
  - No banned patterns: no gradient text, no glassmorphism, no side-stripe borders, no identical card grids (feature cards vary), border-radius ≤ 14px
- **Build verification:** Lint clean, 59/59 tests passing, `NEXT_DIST_DIR=.next2` build produces 9 static/dynamic routes including `/` (175 B) and `/studio` (7.97 kB).
- **Homepage status:** `homepageStatus` now `built`. Per registry, this was previously `missing`.
- **Git commit:** mid-run commit done after homepage files written and build verified.

**Next tasks:**
- Push to GitHub remote when human provides credentials
- Create Vercel project when human provides account
- Final end-to-end smoke test with real BYOP key

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.
