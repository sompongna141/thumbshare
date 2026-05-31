
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
1. Human-provided GitHub remote / Vercel account details needed to publish repo and create production project.
2. Real Pollinations user key needed for final end-to-end smoke test. Mock mode covers dev/demos.
