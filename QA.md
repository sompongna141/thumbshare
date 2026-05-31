# ThumbSnare QA Checklist

## Core workflow

- [x] user can log in with Pollinations before generation (BYOP OAuth flow)
- [x] user can submit a video brief without confusion
- [ ] concept generator returns 6 structured concepts (needs real key validation)
- [ ] each concept has: image prompt, face expression, text overlay, color notes, A/B hint (needs real key validation)
- [ ] image previews render via Pollinations URLs (needs real key validation)
- [ ] user can regenerate a single concept (needs real key validation)
- [ ] export view includes all concepts + color notes + A/B plan

## UX

- [x] clear empty state with guidance and sample brief link
- [x] loading states are obvious (skeleton cards with shimmer animation)
- [x] generation failures are recoverable (error banner with message)
- [x] output layout is readable (structured card layout with sections)
- [x] print/export layout is clean (print CSS hides controls)
- [x] sample brief selector with niche tags

## Technical

- [x] app builds successfully
- [x] BYOP key path is wired through server-side API route (not client-side)
- [x] lint passes (tsc --noEmit clean)
- [x] typecheck passes (via build)
- [x] test suite passes (15/15 Vitest tests)
- [x] env handling is documented (.env.example + DEPLOY.md)
- [x] prompt scaffolding has anti-generic word filter
- [x] A/B plan is dynamically generated, not hardcoded fallback

## Product quality

- [ ] output is better than raw prompt dumping (needs real generation validation)
- [ ] workflow feels like a creator tool, not a demo (needs real generation validation)
- [x] multiple niches tested (6 sample briefs: marketing, tech, travel, gaming, finance, family)
- [x] no-key blocking works server-side (API route returns 401 without clientKey)

## Mock mode validation (completed)

- [x] Mock mode returns 6 structurally valid concepts without real key
- [x] Mock mode A/B plan is tailored to tone and brief
- [x] Mock mode activates when `POLLINATIONS_ALLOW_MOCK=true` and no key present

## Remaining validation items

These require a real Pollinations user key to confirm:

1. End-to-end concept generation returns valid JSON with 6 concepts
2. Image preview URLs load successfully with authenticated key
3. Per-concept regeneration replaces the targeted concept
4. Export (JSON + clipboard + print) produces correct output
5. Generated prompt quality meets the "better than raw prompting" bar
6. Live image model switching works across different model names
