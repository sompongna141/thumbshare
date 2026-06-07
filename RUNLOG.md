## 2026-06-07 08:22 UTC

**Focus:** Direction controls + variable concept count + malformed JSON recovery

**Shipped:**
- Moved Thumbnail Text Overlay from Audience to Direction.
- Added deterministic text rendering over generated previews, so exact overlay copy and placement no longer depend on the image model spelling correctly.
- Moved the image model selector from the top bar to Direction.
- Added a 3 / 4 / 6 / 8 concept selector; prompt generation, mock generation, button labels, saved briefs, and results headers honor the selected count.
- Increased text completion allowance with `max_tokens: 8192`.
- Rebuilt JSON extraction around balanced object/array scanning so fenced payloads, leading/trailing prose, nested structures, and trailing commas parse safely.
- Added one automatic generation retry with shorter image prompts when the first model response is malformed or truncated.
- Replaced raw parser failures after two attempts with a concise recovery message.
- Added regression coverage for JSON edge cases and every supported concept count.

**Verification:**
- 99/99 Vitest tests passing, including preview prompt rules and automatic retry after truncated JSON or wrong concept count.
- `tsc --noEmit` passing.
- Next.js production build passing.
- Standalone runtime: `/studio` and `/api/health` return 200.
- Mock API: text-on returns exactly 3 concepts with overlays; text-off returns exactly 8 concepts with empty text and `placement: "none"`.

## 2026-06-07 07:48 UTC

**Focus:** Studio refactor + text overlay toggle + UX polish + persistence

**Shipped:**
- **Text overlay toggle:** added `textOverlay` field to `ThumbnailBrief` (default true). Updated `conceptPromptBuilder` and `buildMockConcepts` to generate text-free prompts when `false`. Added 5 tests covering default, text-free, and no-field default. 63/63 validation tests passing.
- **Studio refactor:** split 793-line monolith `page.tsx` into focused components + `useThumbnailStudio` hook:
  - `_hooks/useThumbnailStudio.ts` — all state, effects, API, persistence logic, export handlers
  - `_components/TopBar.tsx` — auth, model picker, slim persistent brief title
  - `_components/StepIndicator.tsx` — step dots with ✓ for completed
  - `_components/HookStep.tsx` — step 1 (title, angle, samples, history, progress bar, draft reset)
  - `_components/AudienceStep.tsx` — step 2 (audience, category, context, text overlay toggle)
  - `_components/DirectionStep.tsx` — step 3 (tone, constraints, brief summary, generate)
  - `_components/ResultsStep.tsx` — step 4 (export toolbar, A/B plan, shortlist, concept grid, density toggle)
  - `_components/ConceptCard.tsx` — per-concept image, fallback, placeholder, copy, star, regenerate
  - `_components/ExportToolbar.tsx` — copy/export/print/density toggle
  - `_components/SampleMenu.tsx` / `_components/HistoryMenu.tsx` — dropdowns with click-outside + Esc
  - `_components/ManualKeyBand.tsx` — manual key input below top bar
  - `_lib/studio-storage.ts` — all localStorage helpers (key, model, history, draft, shortlist, density)
  - `_lib/brief-validation.ts` — `isBriefValid` + `briefCompletion` (progress ratio)
  - `_lib/tone.ts` — `TONE_OPTIONS` + `STEP_META` constants
- **Persisted draft:** wizard step + brief saved to `thumbsnare.wizard_draft` on every change, restored on reload. Reset button available in Step 1.
- **Persisted shortlist:** starred concept IDs saved to `thumbsnare.shortlist`, restored on reload. Clear all in results step.
- **Density toggle:** Comfortable/Compact view switch in results grid, persisted to `thumbsnare.results_density`. Compact hides prompt details, shrinks padding, tightens grid.
- **History management:** per-entry × delete button in History dropdown, Clear all button when >1 entry.
- **Brief progress bar:** Step 1 shows 8-field completion percentage with animated fill bar.
- **Error retry button:** Results step error banner now includes a Retry button that re-runs generation.
- **Brief summary:** Step 3 replaced the duplicate review block with a compact grid (2-col desktop, 1-col mobile) showing Title, Angle, Audience, Category, Tone, Text overlay, Model.
- **CSS:** Added new utility classes for all new components (progress bar, text toggle, density toggle, compact card, history delete, etc.) without breaking existing classes. Print CSS hides density toggle and export spacer.
- **Tests:** 86/86 passing (54 validation, 9 export, 23 studio). Added 23 new tests covering brief validation, completion, history deduplication, draft round-trip, shortlist, density, and corruption handling.
- **Build + production server:** `next build` green, `next start` serving all routes (200). E2E API mock verified: text-on returns bold text overlay, text-off returns empty text, none placement, text-free prompt, text-free platform notes, adjusted A/B plan.

**Notable:**
- Sandbox `next dev` server fails due to root-owned `.next/cache/webpack` from previous container sessions. `next build` + `next start` are unaffected and verified functional.
- Updated `tsconfig.json` include back to original after Next auto-patched a `/tmp` path into it during a dev attempt.
- `buildMockConcepts` refactored from inline Array.from to a clean generator loop with per-concept `hasText` logic.
- `generatePlaceholderSvg` updated to handle text-free thumbnails (TEXT-FREE THUMBNAIL badge, shifted face line).

**Phase unchanged:** `deploy_prep`.

**Blockers unchanged:**
1. Human-provided GitHub remote / Vercel account details needed.
2. Real Pollinations user key needed for final end-to-end smoke test.
3. Dev server blocked by sandbox root-owned `.next` cache (non-blocking for production).
